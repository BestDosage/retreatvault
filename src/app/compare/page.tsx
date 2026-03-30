export const dynamic = "force-dynamic";

import { getAllRetreats } from "@/lib/data";
import { CATEGORY_LABELS, SCORE_WEIGHTS, RetreatScores, WellnessRetreat } from "@/lib/types";
import AnimateIn, { StaggerContainer, StaggerItem } from "@/components/AnimateIn";
import ScoreBar from "@/components/ScoreBar";
import TierBadge from "@/components/TierBadge";
import CompareScoreBars from "@/components/CompareScoreBars";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ retreats?: string }>;
}) {
  const params = await searchParams;
  const slugs = (params.retreats || "").split(",").filter(Boolean);
  const allRetreats = await getAllRetreats();
  const selected = slugs
    .map((slug) => allRetreats.find((r) => r.slug === slug))
    .filter(Boolean) as WellnessRetreat[];

  if (selected.length < 2) {
    return (
      <div className="min-h-screen pt-32">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-gold-500">Compare</p>
          <h1 className="mt-4 font-serif text-4xl font-light text-white">Select 2-3 Retreats</h1>
          <p className="mt-4 text-[14px] text-dark-400">
            Visit the <a href="/retreats" className="text-gold-400 hover:text-gold-300">directory</a> and
            click &ldquo;Compare&rdquo; on retreat cards to add them to your comparison.
          </p>
        </div>
      </div>
    );
  }

  // Find winner
  const winner = selected.reduce((a, b) => (a.wrd_score >= b.wrd_score ? a : b));
  const categories = Object.keys(CATEGORY_LABELS) as (keyof RetreatScores)[];

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <AnimateIn>
          <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-gold-500">Side by Side</p>
          <h1 className="mt-4 font-serif text-4xl font-light text-white sm:text-5xl">
            Retreat Comparison
          </h1>
        </AnimateIn>

        {/* Retreat headers */}
        <div className="mt-12 overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Top row — retreat cards */}
            <div className="mb-8 grid gap-4" style={{ gridTemplateColumns: `180px repeat(${selected.length}, 1fr)` }}>
              <div /> {/* spacer */}
              {selected.map((r) => (
                <AnimateIn key={r.id} delay={0.1}>
                  <a href={`/retreats/${r.slug}`} className="group block rounded-2xl border border-white/[0.04] bg-white/[0.015] p-5 transition-all hover:border-gold-400/15">
                    {r.hero_image_url?.startsWith("http") && (
                      <div className="mb-4 aspect-[16/10] overflow-hidden rounded-xl">
                        <img src={r.hero_image_url} alt={r.name} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <TierBadge tier={r.score_tier} size="sm" />
                      {r.id === winner.id && (
                        <span className="rounded-full bg-gold-400/15 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-gold-300">
                          {"\u2726"} Winner
                        </span>
                      )}
                    </div>
                    <h2 className="mt-3 font-serif text-lg font-light text-white group-hover:text-gold-300">{r.name}</h2>
                    <p className="mt-1 text-[11px] text-dark-400">{r.city}, {r.country}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex h-10 w-10 flex-col items-center justify-center rounded-full border border-gold-400/30 bg-dark-950/60">
                        <span className="font-serif text-sm text-white">{r.wrd_score.toFixed(1)}</span>
                        <span className="text-[5px] uppercase tracking-wider text-gold-400">RV</span>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-white">${r.price_min_per_night.toLocaleString()}/night</div>
                        <div className="text-[10px] text-dark-500">{r.room_count} rooms</div>
                      </div>
                    </div>
                  </a>
                </AnimateIn>
              ))}
            </div>

            {/* Score comparison rows */}
            <CompareScoreBars retreats={selected} categories={categories} winner={winner} />
          </div>
        </div>
      </div>
    </div>
  );
}
