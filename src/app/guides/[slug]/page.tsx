import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllRetreats } from "@/lib/data";
import { GUIDES, getGuideBySlug, getRelatedGuides } from "@/data/guides";
import { deriveLocationStats } from "@/lib/location-intelligence";
import RetreatCard from "@/components/RetreatCard";

export const revalidate = 86400;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return { title: "Guide Not Found" };

  return {
    title: `${guide.title} (2026) | Retreat Vault`,
    description: guide.metaDescription,
    alternates: { canonical: `https://www.retreatvault.com/guides/${slug}` },
    openGraph: {
      title: guide.title,
      description: guide.subtitle,
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const allRetreats = await getAllRetreats();
  let matching = allRetreats.filter(guide.filters);
  if (guide.sortBy) matching.sort(guide.sortBy);
  if (guide.maxRetreats) matching = matching.slice(0, guide.maxRetreats);

  const stats = deriveLocationStats(matching);
  const related = getRelatedGuides(guide.relatedGuides);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.retreatvault.com" },
      { "@type": "ListItem", position: 2, name: "Guides", item: "https://www.retreatvault.com/guides" },
      { "@type": "ListItem", position: 3, name: guide.title },
    ],
  };

  // Guide intro content is static, defined in src/data/guides.ts — trusted internal content
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="min-h-screen bg-dark-950">
        {/* Hero */}
        <section className="border-b border-white/[0.06] px-6 pb-16 pt-32 md:px-12 lg:px-20">
          <div className="mx-auto max-w-4xl">
            <nav className="mb-8 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-dark-400">
              <a href="/" className="transition-colors hover:text-gold-400">Home</a>
              <span className="text-dark-700">/</span>
              <a href="/guides" className="transition-colors hover:text-gold-400">Guides</a>
              <span className="text-dark-700">/</span>
              <span className="text-dark-300">{guide.title}</span>
            </nav>

            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">
              Retreat Matchmaker
            </p>
            <h1 className="mt-4 font-serif text-4xl font-light text-white md:text-5xl lg:text-6xl">
              {guide.title}
            </h1>
            <p className="mt-4 text-lg text-dark-400">
              {guide.subtitle}
            </p>

            {/* Editorial intro — trusted static content from src/data/guides.ts, not user input */}
            <div
              className="mt-8 max-w-none text-[15px] leading-[1.85] text-dark-300 [&>p]:mb-4 [&>p:first-child]:text-dark-200"
              dangerouslySetInnerHTML={{ __html: guide.intro }}
            />
          </div>
        </section>

        {/* Quick stats */}
        <section className="border-b border-white/[0.06] px-6 py-12 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5">
                <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-dark-500">Retreats Found</div>
                <div className="mt-2 font-serif text-2xl font-light text-white">{matching.length}</div>
              </div>
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5">
                <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-dark-500">Avg Score</div>
                <div className="mt-2 font-serif text-2xl font-light text-gold-300">{stats.avgScore}/10</div>
              </div>
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5">
                <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-dark-500">Price Range</div>
                <div className="mt-2 font-serif text-2xl font-light text-white">${stats.avgPriceMin}–${stats.avgPriceMax}</div>
                <div className="mt-0.5 text-[10px] text-dark-500">avg per night</div>
              </div>
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5">
                <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-dark-500">Top Specialty</div>
                <div className="mt-2 font-serif text-xl font-light capitalize text-white">
                  {stats.topSpecialties[0]?.tag || "General"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Retreat cards */}
        <section className="px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {matching.map((retreat, i) => (
                <div key={retreat.slug} className="relative">
                  {i < 3 && (
                    <div className="absolute -top-3 left-4 z-10 rounded-full bg-gold-400 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-dark-950">
                      #{i + 1} Pick
                    </div>
                  )}
                  <RetreatCard retreat={retreat} />
                </div>
              ))}
            </div>

            {matching.length === 0 && (
              <div className="py-20 text-center">
                <p className="font-serif text-2xl text-dark-400">No retreats match these criteria yet</p>
                <a href="/retreats" className="mt-4 inline-block text-[11px] uppercase tracking-wider text-gold-400 hover:text-gold-300">
                  Browse all retreats
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Related guides */}
        {related.length > 0 && (
          <section className="border-t border-white/[0.06] px-6 py-16 md:px-12 lg:px-20">
            <div className="mx-auto max-w-7xl">
              <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Related Guides</p>
              <h2 className="mt-3 font-serif text-2xl font-light text-white">Keep Exploring</h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/guides/${g.slug}`}
                    className="group flex flex-col rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 transition-all duration-300 hover:border-gold-500/15 hover:bg-white/[0.04]"
                  >
                    <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gold-500/60">
                      {g.category}
                    </span>
                    <span className="mt-2 font-serif text-[16px] font-medium text-white group-hover:text-gold-300 transition-colors">
                      {g.title}
                    </span>
                    <span className="mt-2 text-[12px] text-dark-400">
                      {g.subtitle}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
