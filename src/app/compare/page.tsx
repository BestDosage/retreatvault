import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Compare Wellness Retreats Side-by-Side — Scores & Pricing",
  description:
    "Compare up to 3 wellness retreats across 15 scored categories including nutrition, spa, medical, sleep & fitness. See which retreat wins on the metrics that matter to you.",
};

import { getAllRetreats } from "@/lib/data";
import { CATEGORY_LABELS, SCORE_WEIGHTS, RetreatScores, WellnessRetreat } from "@/lib/types";
import AnimateIn from "@/components/AnimateIn";
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

  const winner = selected.reduce((a, b) => (a.wrd_score >= b.wrd_score ? a : b));
  const categories = Object.keys(CATEGORY_LABELS) as (keyof RetreatScores)[];
  const colWidth = selected.length === 2 ? "min-w-[180px] w-[50%]" : "min-w-[160px] w-[33.333%]";

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-10 lg:px-16">
        {/* Header */}
        <AnimateIn>
          <div className="text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-gold-500">Side by Side</p>
            <h1 className="mt-4 font-serif text-3xl font-light text-white sm:text-5xl">
              Compare Retreats
            </h1>
            <p className="mt-3 text-[13px] text-dark-400">
              Scores across 15 weighted categories
            </p>
          </div>
        </AnimateIn>

        {/* Apple-style comparison — horizontal scroll on mobile */}
        <div className="mt-10 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[500px]">

            {/* ═══ STICKY PRODUCT HEADERS ═══ */}
            <div className="sticky top-[72px] z-30 bg-dark-950/95 backdrop-blur-md pb-4 pt-2">
              <div className="flex gap-3">
                {selected.map((r) => (
                  <a
                    key={r.id}
                    href={`/retreats/${r.slug}`}
                    className={`${colWidth} group flex-shrink-0 text-center`}
                  >
                    {/* Image */}
                    <div className="mx-auto aspect-[4/3] max-w-[220px] overflow-hidden rounded-2xl">
                      {r.hero_image_url?.startsWith("http") ? (
                        <img src={r.hero_image_url} alt={r.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="h-full w-full bg-dark-800 rounded-2xl" />
                      )}
                    </div>

                    {/* Badge + Winner */}
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <TierBadge tier={r.score_tier} size="sm" />
                      {r.id === winner.id && (
                        <span className="rounded-full bg-gold-400/15 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-gold-300">
                          ✦ Winner
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <h2 className="mt-2 font-serif text-base font-light text-white group-hover:text-gold-300 sm:text-lg">
                      {r.name}
                    </h2>
                    <p className="mt-0.5 text-[10px] text-dark-500">{r.city}</p>

                    {/* Score + Price */}
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <div className="flex h-9 w-9 flex-col items-center justify-center rounded-full border border-gold-400/30 bg-dark-950/60">
                        <span className="font-serif text-[12px] text-white">{r.wrd_score.toFixed(1)}</span>
                        <span className="text-[4px] uppercase tracking-wider text-gold-400">RV</span>
                      </div>
                      <span className="text-[11px] text-dark-300">${r.price_min_per_night.toLocaleString()}/night</span>
                    </div>
                  </a>
                ))}
              </div>
              <div className="mt-4 line-gold" />
            </div>

            {/* ═══ SPEC ROWS ═══ */}
            <div className="mt-2">
              {/* Overall WRD Score row */}
              <div className="flex items-center gap-3 border-b border-white/[0.04] py-4">
                {selected.map((r) => (
                  <div key={r.id} className={`${colWidth} flex-shrink-0 text-center`}>
                    <div className="text-[10px] uppercase tracking-wider text-dark-500">Overall RV Score</div>
                    <div className="mt-1 font-serif text-2xl font-light text-gold-300">{r.wrd_score.toFixed(1)}</div>
                  </div>
                ))}
              </div>

              {/* Category scores */}
              {categories.map((cat) => {
                const scores = selected.map((r) => r.scores[cat]?.score || 0);
                const maxScore = Math.max(...scores);
                const hasUniqueWinner = scores.filter((s) => s === maxScore).length === 1;

                return (
                  <div key={cat} className="flex items-center gap-3 border-b border-white/[0.04] py-4">
                    {selected.map((r, i) => {
                      const score = r.scores[cat]?.score || 0;
                      const isWinner = hasUniqueWinner && score === maxScore;
                      return (
                        <div key={r.id} className={`${colWidth} flex-shrink-0 text-center`}>
                          {/* Show label only in first column */}
                          {i === 0 && (
                            <div className="mb-2 text-[10px] uppercase tracking-wider text-dark-500">
                              {CATEGORY_LABELS[cat]}
                              <span className="ml-1 text-dark-600">
                                {((SCORE_WEIGHTS[cat] || 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                          )}
                          {i !== 0 && (
                            <div className="mb-2 text-[10px] uppercase tracking-wider text-dark-500 sm:hidden">
                              {CATEGORY_LABELS[cat]}
                            </div>
                          )}
                          <div className={`font-serif text-xl ${isWinner ? "text-gold-300" : "text-dark-200"}`}>
                            {score.toFixed(1)}
                            {isWinner && (
                              <svg className="ml-1 inline h-3.5 w-3.5 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          {/* Score bar */}
                          <div className="mx-auto mt-1.5 h-[4px] max-w-[120px] overflow-hidden rounded-full bg-white/[0.04]">
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${(score / 10) * 100}%`,
                                background: isWinner
                                  ? "linear-gradient(90deg, #d4af37, #f2d896)"
                                  : "rgba(255,255,255,0.2)",
                              }}
                            />
                          </div>
                          {/* Notes */}
                          {r.scores[cat]?.notes && (
                            <p className="mx-auto mt-2 max-w-[180px] text-[9px] leading-relaxed text-dark-500 line-clamp-2">
                              {r.scores[cat].notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* ═══ DETAILS ROWS ═══ */}
              <div className="mt-6 mb-2 text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Details</div>

              {/* Pricing */}
              <div className="flex items-center gap-3 border-b border-white/[0.04] py-4">
                {selected.map((r, i) => (
                  <div key={r.id} className={`${colWidth} flex-shrink-0 text-center`}>
                    {i === 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-dark-500">Pricing</div>}
                    {i !== 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-dark-500 sm:hidden">Pricing</div>}
                    <div className="text-[14px] font-medium text-white">
                      ${r.price_min_per_night.toLocaleString()}
                      {r.price_min_per_night !== r.price_max_per_night && (
                        <span className="text-dark-400">&ndash;${r.price_max_per_night.toLocaleString()}</span>
                      )}
                      <span className="text-[10px] text-dark-500 ml-0.5">/night</span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-dark-500 capitalize">{r.pricing_model.replace(/_/g, " ")}</div>
                  </div>
                ))}
              </div>

              {/* Property */}
              <div className="flex items-center gap-3 border-b border-white/[0.04] py-4">
                {selected.map((r, i) => (
                  <div key={r.id} className={`${colWidth} flex-shrink-0 text-center`}>
                    {i === 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-dark-500">Property</div>}
                    {i !== 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-dark-500 sm:hidden">Property</div>}
                    <div className="text-[13px] text-white">{r.room_count} rooms</div>
                    <div className="text-[10px] text-dark-500 capitalize">{r.property_size} &middot; Est. {r.founded_year}</div>
                  </div>
                ))}
              </div>

              {/* Location */}
              <div className="flex items-center gap-3 border-b border-white/[0.04] py-4">
                {selected.map((r, i) => (
                  <div key={r.id} className={`${colWidth} flex-shrink-0 text-center`}>
                    {i === 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-dark-500">Location</div>}
                    {i !== 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-dark-500 sm:hidden">Location</div>}
                    <div className="text-[13px] text-white">{r.city}</div>
                    <div className="text-[10px] text-dark-500">{r.nearest_airport} &middot; {r.airport_distance_km}km</div>
                  </div>
                ))}
              </div>

              {/* Reviews */}
              <div className="flex items-center gap-3 border-b border-white/[0.04] py-4">
                {selected.map((r, i) => (
                  <div key={r.id} className={`${colWidth} flex-shrink-0 text-center`}>
                    {i === 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-dark-500">Reviews</div>}
                    {i !== 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-dark-500 sm:hidden">Reviews</div>}
                    <div className="flex items-center justify-center gap-1">
                      <svg className="h-3 w-3 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-[13px] text-white">{r.google_rating}</span>
                      <span className="text-[10px] text-dark-500">({r.google_review_count})</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Specialties */}
              <div className="flex items-center gap-3 border-b border-white/[0.04] py-4">
                {selected.map((r, i) => (
                  <div key={r.id} className={`${colWidth} flex-shrink-0 text-center`}>
                    {i === 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-dark-500">Specialties</div>}
                    {i !== 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-dark-500 sm:hidden">Specialties</div>}
                    <div className="flex flex-wrap justify-center gap-1">
                      {r.specialty_tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[9px] text-dark-300 capitalize">
                          {tag.replace(/-/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-3 py-6">
                {selected.map((r) => (
                  <div key={r.id} className={`${colWidth} flex-shrink-0 text-center`}>
                    <a
                      href={`/retreats/${r.slug}`}
                      className="inline-block rounded-full border border-gold-400/30 px-5 py-2.5 text-[10px] font-medium uppercase tracking-wider text-gold-300 transition-all hover:bg-gold-400/10 hover:border-gold-400/50"
                    >
                      View Details
                    </a>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
