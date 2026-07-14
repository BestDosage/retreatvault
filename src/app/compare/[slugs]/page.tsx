import { notFound } from "next/navigation";
import { getAllRetreats } from "@/lib/data";
import { CATEGORY_LABELS, SCORE_WEIGHTS, RetreatScores, WellnessRetreat, isScorePublic } from "@/lib/types";
import AnimateIn, { StaggerContainer, StaggerItem } from "@/components/AnimateIn";
import TierBadge from "@/components/TierBadge";
import CompareScoreBars from "@/components/CompareScoreBars";
import type { Metadata } from "next";


export async function generateMetadata({ params }: { params: Promise<{ slugs: string }> }): Promise<Metadata> {
  const { slugs } = await params;
  const parts = slugs.split("-vs-");
  if (parts.length !== 2) return {};
  const retreats = await getAllRetreats();
  const a = retreats.find((r) => r.slug === parts[0]);
  const b = retreats.find((r) => r.slug === parts[1]);
  if (!a || !b) return {};
  return {
    title: `${a.name} vs ${b.name} \u2014 RetreatVault Comparison 2026`,
    description: `Head-to-head comparison of ${a.name} and ${b.name} across 15 wellness categories. Vault Scores: ${isScorePublic(a.wrd_score) ? a.wrd_score.toFixed(1) : "Listed"} vs ${isScorePublic(b.wrd_score) ? b.wrd_score.toFixed(1) : "Listed"}.`,
    alternates: { canonical: `/compare/${slugs}` },
  };
}

export default async function HeadToHeadPage({ params }: { params: Promise<{ slugs: string }> }) {
  const { slugs } = await params;
  const parts = slugs.split("-vs-");
  if (parts.length !== 2) notFound();

  const retreats = await getAllRetreats();
  const a = retreats.find((r) => r.slug === parts[0]);
  const b = retreats.find((r) => r.slug === parts[1]);
  if (!a || !b) notFound();

  const selected = [a, b];
  const winner = a.wrd_score >= b.wrd_score ? a : b;
  const categories = Object.keys(CATEGORY_LABELS) as (keyof RetreatScores)[];

  // Count category wins
  const winsA = categories.filter((c) => (a.scores[c]?.score || 0) > (b.scores[c]?.score || 0)).length;
  const winsB = categories.filter((c) => (b.scores[c]?.score || 0) > (a.scores[c]?.score || 0)).length;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.retreatvault.com" },
      { "@type": "ListItem", position: 2, name: "Compare", item: "https://www.retreatvault.com/compare" },
      { "@type": "ListItem", position: 3, name: `${a.name} vs ${b.name}` },
    ],
  };

  return (
    <div className="min-h-screen bg-cream-50 pt-28 pb-20 text-ink-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
        <AnimateIn>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sage-700">Head to Head</p>
          <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.03] tracking-tight text-ink-900">
            {a.name} <span className="text-ink-500">vs</span> {b.name}
          </h1>
          <p className="mt-4 text-[13px] tabular-nums text-ink-700">
            Category-by-category breakdown &middot; {winsA} wins for {a.name} &middot; {winsB} wins for {b.name}
          </p>
        </AnimateIn>

        {/* Summary cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {selected.map((r) => (
            <AnimateIn key={r.id} delay={r.id === a.id ? 0 : 0.15}>
              <a href={`/retreats/${r.slug}`} className="group block overflow-hidden rounded-2xl border border-cream-200 bg-cream-100 transition-all hover:border-sage-600/30">
                {r.hero_image_url?.startsWith("http") && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img src={r.hero_image_url} alt={r.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2">
                    <TierBadge tier={r.score_tier} size="sm" />
                    {r.id === winner.id && (
                      <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-ink-900 ring-1 ring-gold/40">
                        Overall Winner
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 font-display text-2xl text-ink-900 transition-colors group-hover:text-sage-700">{r.name}</h2>
                  <p className="mt-1 text-[12px] text-ink-500">{r.city}, {r.country}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-cream-50 ring-1 ring-cream-200">
                      <span className="font-display text-xl tabular-nums text-ink-900">{isScorePublic(r.wrd_score) ? r.wrd_score.toFixed(1) : "Listed"}</span>
                      <span className="text-[6px] uppercase tracking-wider text-sage-700">Vault</span>
                    </div>
                    <div>
                      <div className="text-[12px] tabular-nums text-ink-900">${r.price_min_per_night.toLocaleString()}&ndash;${r.price_max_per_night.toLocaleString()}/night</div>
                      <div className="text-[11px] tabular-nums text-ink-500">{r.id === a.id ? winsA : winsB} category wins</div>
                    </div>
                  </div>
                </div>
              </a>
            </AnimateIn>
          ))}
        </div>

        {/* Category comparison */}
        <AnimateIn delay={0.2} className="mt-16">
          <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-sage-700">Category Breakdown</p>
        </AnimateIn>

        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <CompareScoreBars retreats={selected} categories={categories} winner={winner} />
          </div>
        </div>

        {/* Back link */}
        <div className="mt-16">
          <a href="/retreats" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage-700 underline-offset-4 transition-colors hover:text-sage-600 hover:underline">
            \u2190 Back to Directory
          </a>
        </div>
      </div>
    </div>
  );
}
