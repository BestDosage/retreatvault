import { notFound } from "next/navigation";
import { getAllRetreats } from "@/lib/data";
import { CATEGORY_LABELS, SCORE_WEIGHTS, RetreatScores, WellnessRetreat } from "@/lib/types";
import AnimateIn, { StaggerContainer, StaggerItem } from "@/components/AnimateIn";
import TierBadge from "@/components/TierBadge";
import CompareScoreBars from "@/components/CompareScoreBars";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const retreats = await getAllRetreats();
  const params: { slugs: string }[] = [];
  for (let i = 0; i < retreats.length; i++) {
    for (let j = i + 1; j < retreats.length; j++) {
      params.push({ slugs: `${retreats[i].slug}-vs-${retreats[j].slug}` });
    }
  }
  return params;
}

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
    description: `Head-to-head comparison of ${a.name} and ${b.name} across 15 wellness categories. Vault Scores: ${a.wrd_score.toFixed(1)} vs ${b.wrd_score.toFixed(1)}.`,
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

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
        <AnimateIn>
          <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-gold-500">Head to Head</p>
          <h1 className="mt-4 font-serif text-3xl font-light text-white sm:text-4xl lg:text-5xl">
            {a.name} <span className="text-dark-500">vs</span> {b.name}
          </h1>
          <p className="mt-3 text-[13px] text-dark-400">
            Category-by-category breakdown &middot; {winsA} wins for {a.name} &middot; {winsB} wins for {b.name}
          </p>
        </AnimateIn>

        {/* Summary cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {selected.map((r) => (
            <AnimateIn key={r.id} delay={r.id === a.id ? 0 : 0.15}>
              <a href={`/retreats/${r.slug}`} className="group block rounded-2xl border border-white/[0.04] bg-white/[0.015] overflow-hidden transition-all hover:border-gold-400/15">
                {r.hero_image_url?.startsWith("http") && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img src={r.hero_image_url} alt={r.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2">
                    <TierBadge tier={r.score_tier} size="sm" />
                    {r.id === winner.id && (
                      <span className="rounded-full bg-gold-400/15 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-gold-300">
                        {"\u2726"} Overall Winner
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 font-serif text-2xl font-light text-white group-hover:text-gold-300">{r.name}</h2>
                  <p className="mt-1 text-[12px] text-dark-400">{r.city}, {r.country}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 border-gold-400/30 bg-dark-950/60">
                      <span className="font-serif text-xl font-light text-white">{r.wrd_score.toFixed(1)}</span>
                      <span className="text-[6px] uppercase tracking-wider text-gold-400">Vault</span>
                    </div>
                    <div>
                      <div className="text-[12px] text-white">${r.price_min_per_night.toLocaleString()}&ndash;${r.price_max_per_night.toLocaleString()}/night</div>
                      <div className="text-[11px] text-dark-500">{r.id === a.id ? winsA : winsB} category wins</div>
                    </div>
                  </div>
                </div>
              </a>
            </AnimateIn>
          ))}
        </div>

        {/* Category comparison */}
        <AnimateIn delay={0.2} className="mt-16">
          <p className="mb-6 text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Category Breakdown</p>
        </AnimateIn>

        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <CompareScoreBars retreats={selected} categories={categories} winner={winner} />
          </div>
        </div>

        {/* Back link */}
        <div className="mt-16 text-center">
          <a href="/retreats" className="btn-outline !text-[10px]">
            Back to Directory
          </a>
        </div>
      </div>
    </div>
  );
}
