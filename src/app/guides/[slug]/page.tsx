import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllRetreats } from "@/lib/data";
import { GUIDES, getGuideBySlug, getRelatedGuides } from "@/data/guides";
import { EDITORIAL_GUIDES, getEditorialGuideBySlug } from "@/data/editorial-guides";
import { deriveLocationStats } from "@/lib/location-intelligence";
import RetreatCard from "@/components/RetreatCard";

export const revalidate = 86400;

export function generateStaticParams() {
  const matchmakerSlugs = GUIDES.map((g) => ({ slug: g.slug }));
  const editorialSlugs = EDITORIAL_GUIDES.map((g) => ({ slug: g.slug }));
  return [...matchmakerSlugs, ...editorialSlugs];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  const matchmaker = getGuideBySlug(slug);
  if (matchmaker) {
    return {
      title: `${matchmaker.title} (2026) | Retreat Vault`,
      description: matchmaker.metaDescription,
      alternates: { canonical: `https://www.retreatvault.com/guides/${slug}` },
      openGraph: { title: matchmaker.title, description: matchmaker.subtitle },
    };
  }

  const editorial = getEditorialGuideBySlug(slug);
  if (editorial) {
    return {
      title: `${editorial.title} | Retreat Vault`,
      description: editorial.metaDescription,
      alternates: { canonical: `https://www.retreatvault.com/guides/${slug}` },
      openGraph: { title: editorial.title, description: editorial.subtitle },
    };
  }

  return { title: "Guide Not Found" };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Try matchmaker guide first
  const matchmaker = getGuideBySlug(slug);
  if (matchmaker) {
    return <MatchmakerGuide guide={matchmaker} />;
  }

  // Try editorial guide
  const editorial = getEditorialGuideBySlug(slug);
  if (editorial) {
    return <EditorialGuide guide={editorial} />;
  }

  notFound();
}

/* ═══════════════════════════════════════════════════════════
   Matchmaker Guide (existing retreat-filtering guides)
   ═══════════════════════════════════════════════════════════ */

import type { GuideConfig } from "@/data/guides";

async function MatchmakerGuide({ guide }: { guide: GuideConfig }) {
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
        // Trusted static breadcrumb schema — no user input
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
              // Trusted static content from src/data/guides.ts — no user input
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

/* ═══════════════════════════════════════════════════════════
   Editorial Guide (long-form cost/comparison/planning content)
   ═══════════════════════════════════════════════════════════ */

import type { EditorialGuideConfig } from "@/data/editorial-guides";

function EditorialGuide({ guide }: { guide: EditorialGuideConfig }) {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.retreatvault.com" },
      { "@type": "ListItem", position: 2, name: "Guides", item: "https://www.retreatvault.com/guides" },
      { "@type": "ListItem", position: 3, name: guide.title },
    ],
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.metaDescription,
    author: { "@type": "Person", name: guide.author, jobTitle: guide.authorTitle },
    publisher: { "@type": "Organization", name: "RetreatVault", url: "https://www.retreatvault.com" },
    datePublished: guide.publishedDate,
    dateModified: guide.updatedDate,
    mainEntityOfPage: `https://www.retreatvault.com/guides/${guide.slug}`,
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer.replace(/<[^>]*>/g, ""),
      },
    })),
  };

  // All dangerouslySetInnerHTML in this component uses trusted static content
  // from src/data/editorial-guides.ts — authored by site owner, never user input
  return (
    <>
      <script
        type="application/ld+json"
        // Trusted static schema data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        // Trusted static schema data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        // Trusted static schema data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="min-h-screen bg-dark-950">
        {/* Hero */}
        <section className="border-b border-white/[0.06] px-6 pb-16 pt-32 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <nav className="mb-8 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-dark-400">
              <a href="/" className="transition-colors hover:text-gold-400">Home</a>
              <span className="text-dark-700">/</span>
              <a href="/guides" className="transition-colors hover:text-gold-400">Guides</a>
              <span className="text-dark-700">/</span>
              <span className="text-dark-300">{guide.title}</span>
            </nav>

            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">
              {guide.categoryLabel}
            </p>
            <h1 className="mt-4 font-serif text-4xl font-light text-white md:text-5xl lg:text-6xl">
              {guide.title}
            </h1>
            <p className="mt-4 text-lg text-dark-400">
              {guide.subtitle}
            </p>

            {/* Author & meta */}
            <div className="mt-8 flex items-center gap-4 border-t border-white/[0.06] pt-6">
              <div>
                <p className="text-[13px] font-medium text-dark-200">{guide.author}</p>
                <p className="text-[11px] text-dark-500">{guide.authorTitle}</p>
              </div>
              <div className="ml-auto flex items-center gap-4 text-[11px] text-dark-500">
                <span>{guide.readTimeMinutes} min read</span>
                <span>Updated {guide.updatedDate}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Table of Contents */}
        <section className="border-b border-white/[0.06] px-6 py-10 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-dark-500">In This Guide</p>
            <nav className="mt-4 flex flex-col gap-2">
              {guide.sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="text-[14px] text-dark-300 transition-colors hover:text-gold-400"
                >
                  {section.heading}
                </a>
              ))}
              <a href="#faq" className="text-[14px] text-dark-300 transition-colors hover:text-gold-400">
                Frequently Asked Questions
              </a>
            </nav>
          </div>
        </section>

        {/* Intro */}
        <section className="px-6 pt-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <div
              className="max-w-none text-[15px] leading-[1.85] text-dark-300 [&>p]:mb-4 [&>p:first-child]:text-lg [&>p:first-child]:text-dark-200"
              // Trusted static intro content from editorial-guides.ts
              dangerouslySetInnerHTML={{ __html: guide.intro }}
            />
          </div>
        </section>

        {/* Content sections */}
        {guide.sections.map((section) => (
          <section key={section.id} id={section.id} className="px-6 py-12 md:px-12 lg:px-20">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-8 font-serif text-3xl font-light text-white md:text-4xl">
                {section.heading}
              </h2>
              {/* Trusted static section content from editorial-guides.ts */}
              <div
                className="editorial-content max-w-none text-[15px] leading-[1.85] text-dark-300
                  [&>p]:mb-4
                  [&>h3]:mb-3 [&>h3]:mt-8 [&>h3]:font-serif [&>h3]:text-xl [&>h3]:font-medium [&>h3]:text-dark-100
                  [&>h4]:mb-2 [&>h4]:mt-6 [&>h4]:text-[14px] [&>h4]:font-semibold [&>h4]:uppercase [&>h4]:tracking-wider [&>h4]:text-gold-500
                  [&>ul]:mb-4 [&>ul]:ml-5 [&>ul]:list-disc [&>ul]:space-y-2
                  [&>ol]:mb-4 [&>ol]:ml-5 [&>ol]:list-decimal [&>ol]:space-y-2
                  [&_li]:text-dark-300
                  [&_strong]:text-dark-100 [&_strong]:font-medium
                  [&_a]:text-gold-400 [&_a]:underline [&_a]:decoration-gold-400/30 [&_a]:underline-offset-2 [&_a]:transition-colors hover:[&_a]:text-gold-300
                  [&>table]:mb-6 [&>table]:w-full [&>table]:border-collapse
                  [&_thead]:border-b [&_thead]:border-white/[0.08]
                  [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-dark-400
                  [&_td]:border-b [&_td]:border-white/[0.04] [&_td]:px-4 [&_td]:py-3 [&_td]:text-[14px] [&_td]:text-dark-300
                  [&_em]:text-dark-400 [&_em]:italic"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </div>
          </section>
        ))}

        {/* FAQ */}
        <section id="faq" className="border-t border-white/[0.06] px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">FAQ</p>
            <h2 className="mt-3 font-serif text-3xl font-light text-white md:text-4xl">
              Frequently Asked Questions
            </h2>
            <div className="mt-10 space-y-8">
              {guide.faqs.map((faq, i) => (
                <div key={i} className="border-b border-white/[0.04] pb-8 last:border-0">
                  <h3 className="font-serif text-lg font-medium text-dark-100">
                    {faq.question}
                  </h3>
                  <div
                    className="mt-3 text-[14px] leading-[1.8] text-dark-400 [&>p]:mb-2 [&_a]:text-gold-400 [&_a]:underline [&_a]:decoration-gold-400/30 [&_a]:underline-offset-2"
                    // Trusted static FAQ content from editorial-guides.ts
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Internal links / CTAs */}
        <section className="border-t border-white/[0.06] px-6 py-12 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-wrap gap-3">
              {guide.internalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-white/[0.08] px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-dark-300 transition-all duration-300 hover:border-gold-500/30 hover:text-gold-400"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Related guides */}
        {guide.relatedGuides.length > 0 && (
          <section className="border-t border-white/[0.06] px-6 py-16 md:px-12 lg:px-20">
            <div className="mx-auto max-w-7xl">
              <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Related Guides</p>
              <h2 className="mt-3 font-serif text-2xl font-light text-white">Keep Reading</h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {guide.relatedGuides.map((relSlug) => {
                  const relMatchmaker = GUIDES.find((g) => g.slug === relSlug);
                  const relEditorial = EDITORIAL_GUIDES.find((g) => g.slug === relSlug);
                  const rel = relMatchmaker || relEditorial;
                  if (!rel) return null;
                  return (
                    <Link
                      key={relSlug}
                      href={`/guides/${relSlug}`}
                      className="group flex flex-col rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 transition-all duration-300 hover:border-gold-500/15 hover:bg-white/[0.04]"
                    >
                      <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gold-500/60">
                        {"categoryLabel" in rel ? rel.categoryLabel : rel.category}
                      </span>
                      <span className="mt-2 font-serif text-[16px] font-medium text-white group-hover:text-gold-300 transition-colors">
                        {rel.title}
                      </span>
                      <span className="mt-2 text-[12px] text-dark-400">
                        {rel.subtitle}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Tags */}
        <section className="border-t border-white/[0.06] px-6 py-8 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-wrap gap-2">
              {guide.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/[0.03] px-3 py-1 text-[10px] text-dark-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
