import type { Metadata } from "next";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Compare Wellness Retreats Side-by-Side — Scores & Pricing",
  description:
    "Compare up to 3 wellness retreats across 15 scored categories including nutrition, spa, medical, sleep & fitness. See which retreat wins on the metrics that matter to you.",
};

import { getAllRetreats } from "@/lib/data";
import { CATEGORY_LABELS, SCORE_WEIGHTS, RetreatScores, WellnessRetreat, isScorePublic } from "@/lib/types";
import AnimateIn from "@/components/AnimateIn";
import TierBadge from "@/components/TierBadge";
import CopyLinkButton from "@/components/CopyLinkButton";
import CompareUrlSync from "@/components/CompareUrlSync";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ retreats?: string }>;
}) {
  const params = await searchParams;
  // URL -> state: parse slugs, validate against real retreats, cap at 3.
  const slugs = (params.retreats || "").split(",").filter(Boolean).slice(0, 3);
  const allRetreats = await getAllRetreats();
  const selected = slugs
    .map((slug) => allRetreats.find((r) => r.slug === slug))
    .filter(Boolean) as WellnessRetreat[];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.retreatvault.com" },
      { "@type": "ListItem", position: 2, name: "Compare" },
    ],
  };

  if (selected.length < 2) {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <div className="min-h-screen bg-cream-50 pt-32 text-ink-900">
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sage-700">Compare</p>
            <h1 className="mt-4 font-display text-[clamp(2.2rem,5vw,3.5rem)] leading-[1.03] tracking-tight text-ink-900">
              Select 2–3 retreats
            </h1>
            <p className="mt-5 max-w-md text-[14px] leading-relaxed text-ink-700">
              Visit the{" "}
              <a href="/retreats" className="text-sage-700 underline-offset-4 transition-colors hover:text-sage-600 hover:underline">
                directory
              </a>{" "}
              and click &ldquo;Compare&rdquo; on retreat cards to build a side-by-side comparison.
            </p>
          </div>
        </div>
      </>
    );
  }

  const winner = selected.reduce((a, b) => (a.wrd_score >= b.wrd_score ? a : b));
  const categories = Object.keys(CATEGORY_LABELS) as (keyof RetreatScores)[];
  const colWidth = selected.length === 2 ? "min-w-[180px] w-[50%]" : "min-w-[160px] w-[33.333%]";

  // Seed data for the in-memory compare state (floating bar) — mirrors what the
  // AddToCompareButton stores, so a shared link hydrates the bar too.
  const seed = selected.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    hero_image_url: r.hero_image_url,
    wrd_score: r.wrd_score,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CompareUrlSync seed={seed} />
      <div className="min-h-screen bg-cream-50 pt-28 pb-20 text-ink-900">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-10 lg:px-16">
          {/* Header — left-aligned editorial, copy-link on the right */}
          <AnimateIn>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sage-700">Side by Side</p>
                <h1 className="mt-4 font-display text-[clamp(2.2rem,5vw,3.75rem)] leading-[1.03] tracking-tight text-ink-900">
                  Compare <span className="text-ink-500">retreats</span>
                </h1>
                <p className="mt-4 text-[14px] leading-relaxed text-ink-700">
                  Scores across 15 weighted categories. No paid placements.
                </p>
              </div>
              <CopyLinkButton />
            </div>
          </AnimateIn>

          {/* Comparison — horizontal scroll on mobile */}
          <div className="mt-10 -mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
            <div className="min-w-[500px]">

              {/* ═══ STICKY PRODUCT HEADERS ═══ */}
              <div className="sticky top-[72px] z-30 bg-cream-50/95 pb-4 pt-2 backdrop-blur-md">
                <div className="flex gap-3">
                  {selected.map((r) => (
                    <a
                      key={r.id}
                      href={`/retreats/${r.slug}`}
                      className={`${colWidth} group flex-shrink-0 text-center`}
                    >
                      {/* Image */}
                      <div className="mx-auto aspect-[4/3] max-w-[220px] overflow-hidden rounded-2xl ring-1 ring-cream-200">
                        {r.hero_image_url?.startsWith("http") ? (
                          <img src={r.hero_image_url} alt={r.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="h-full w-full bg-cream-200" />
                        )}
                      </div>

                      {/* Badge + Winner */}
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <TierBadge tier={r.score_tier} size="sm" />
                        {r.id === winner.id && (
                          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-ink-900 ring-1 ring-gold/40">
                            Winner
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <h2 className="mt-2 font-display text-base font-normal text-ink-900 transition-colors group-hover:text-sage-700 sm:text-lg">
                        {r.name}
                      </h2>
                      <p className="mt-0.5 text-[10px] text-ink-500">{r.city}</p>

                      {/* Score + Price */}
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <div className="flex h-9 w-9 flex-col items-center justify-center rounded-full bg-cream-100 ring-1 ring-cream-200">
                          <span className="font-display text-[12px] tabular-nums text-ink-900">{isScorePublic(r.wrd_score) ? r.wrd_score.toFixed(1) : "—"}</span>
                          <span className="text-[4px] uppercase tracking-wider text-sage-700">RV</span>
                        </div>
                        <span className="text-[11px] tabular-nums text-ink-700">${r.price_min_per_night.toLocaleString()}/night</span>
                      </div>
                    </a>
                  ))}
                </div>
                <div className="mt-4 border-t border-cream-200" />
              </div>

              {/* ═══ SPEC ROWS ═══ */}
              <div className="mt-2">
                {/* Overall RV Score row */}
                <div className="flex items-center gap-3 border-b border-cream-200 py-4">
                  {selected.map((r) => (
                    <div key={r.id} className={`${colWidth} flex-shrink-0 text-center`}>
                      <div className="text-[10px] uppercase tracking-wider text-ink-500">Overall RV Score</div>
                      <div className="mt-1 font-display text-2xl tabular-nums text-ink-900">{isScorePublic(r.wrd_score) ? r.wrd_score.toFixed(1) : "Listed"}</div>
                    </div>
                  ))}
                </div>

                {/* Category scores */}
                {categories.map((cat) => {
                  const scores = selected.map((r) => r.scores[cat]?.score || 0);
                  const maxScore = Math.max(...scores);
                  const hasUniqueWinner = scores.filter((s) => s === maxScore).length === 1;

                  return (
                    <div key={cat} className="flex items-center gap-3 border-b border-cream-200 py-4">
                      {selected.map((r, i) => {
                        const score = r.scores[cat]?.score || 0;
                        const isWinner = hasUniqueWinner && score === maxScore && score > 0;
                        return (
                          <div key={r.id} className={`${colWidth} flex-shrink-0 text-center`}>
                            {/* Show label only in first column on desktop; every column on mobile */}
                            {i === 0 && (
                              <div className="mb-2 text-[10px] uppercase tracking-wider text-ink-500">
                                {CATEGORY_LABELS[cat]}
                                <span className="ml-1 tabular-nums text-ink-500/60">
                                  {((SCORE_WEIGHTS[cat] || 0) * 100).toFixed(0)}%
                                </span>
                              </div>
                            )}
                            {i !== 0 && (
                              <div className="mb-2 text-[10px] uppercase tracking-wider text-ink-500 sm:hidden">
                                {CATEGORY_LABELS[cat]}
                              </div>
                            )}
                            <div className={`font-display text-xl tabular-nums ${isWinner ? "text-sage-700" : "text-ink-500"}`}>
                              {score.toFixed(1)}
                              {isWinner && (
                                <svg className="ml-1 inline h-3.5 w-3.5 text-sage-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            {/* Score bar — lab-report track */}
                            <div className="relative mx-auto mt-1.5 h-[3px] max-w-[120px]">
                              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-cream-200" />
                              <div
                                className={`absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full ${isWinner ? "bg-sage-600" : "bg-ink-900/25"}`}
                                style={{ width: `${(score / 10) * 100}%` }}
                              />
                            </div>
                            {/* Notes */}
                            {r.scores[cat]?.notes && (
                              <p className="mx-auto mt-2 max-w-[180px] text-[9px] leading-relaxed text-ink-500 line-clamp-2">
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
                <div className="mb-2 mt-8 text-[10px] font-semibold uppercase tracking-[0.28em] text-sage-700">Details</div>

                {/* Pricing */}
                <div className="flex items-center gap-3 border-b border-cream-200 py-4">
                  {selected.map((r, i) => (
                    <div key={r.id} className={`${colWidth} flex-shrink-0 text-center`}>
                      {i === 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-ink-500">Pricing</div>}
                      {i !== 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-ink-500 sm:hidden">Pricing</div>}
                      <div className="text-[14px] font-medium tabular-nums text-ink-900">
                        ${r.price_min_per_night.toLocaleString()}
                        {r.price_min_per_night !== r.price_max_per_night && (
                          <span className="text-ink-500">&ndash;${r.price_max_per_night.toLocaleString()}</span>
                        )}
                        <span className="ml-0.5 text-[10px] text-ink-500">/night</span>
                      </div>
                      <div className="mt-0.5 text-[10px] capitalize text-ink-500">{r.pricing_model.replace(/_/g, " ")}</div>
                    </div>
                  ))}
                </div>

                {/* Property */}
                <div className="flex items-center gap-3 border-b border-cream-200 py-4">
                  {selected.map((r, i) => (
                    <div key={r.id} className={`${colWidth} flex-shrink-0 text-center`}>
                      {i === 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-ink-500">Property</div>}
                      {i !== 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-ink-500 sm:hidden">Property</div>}
                      <div className="text-[13px] tabular-nums text-ink-900">{r.room_count} rooms</div>
                      <div className="text-[10px] capitalize text-ink-500">{r.property_size} &middot; Est. {r.founded_year}</div>
                    </div>
                  ))}
                </div>

                {/* Location */}
                <div className="flex items-center gap-3 border-b border-cream-200 py-4">
                  {selected.map((r, i) => (
                    <div key={r.id} className={`${colWidth} flex-shrink-0 text-center`}>
                      {i === 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-ink-500">Location</div>}
                      {i !== 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-ink-500 sm:hidden">Location</div>}
                      <div className="text-[13px] text-ink-900">{r.city}</div>
                      <div className="text-[10px] tabular-nums text-ink-500">{r.nearest_airport} &middot; {r.airport_distance_km}km</div>
                    </div>
                  ))}
                </div>

                {/* Reviews */}
                <div className="flex items-center gap-3 border-b border-cream-200 py-4">
                  {selected.map((r, i) => (
                    <div key={r.id} className={`${colWidth} flex-shrink-0 text-center`}>
                      {i === 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-ink-500">Reviews</div>}
                      {i !== 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-ink-500 sm:hidden">Reviews</div>}
                      <div className="flex items-center justify-center gap-1">
                        <svg className="h-3 w-3 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-[13px] tabular-nums text-ink-900">{r.google_rating}</span>
                        <span className="text-[10px] tabular-nums text-ink-500">({r.google_review_count})</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Specialties */}
                <div className="flex items-center gap-3 border-b border-cream-200 py-4">
                  {selected.map((r, i) => (
                    <div key={r.id} className={`${colWidth} flex-shrink-0 text-center`}>
                      {i === 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-ink-500">Specialties</div>}
                      {i !== 0 && <div className="mb-2 text-[10px] uppercase tracking-wider text-ink-500 sm:hidden">Specialties</div>}
                      <div className="flex flex-wrap justify-center gap-1">
                        {r.specialty_tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="rounded-md border border-cream-200 bg-cream-100 px-2 py-0.5 text-[9px] capitalize text-ink-700">
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
                        className="inline-block rounded-full bg-ink-900 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cream-50 transition-transform duration-150 ease-out hover:bg-ink-700 active:scale-[0.97]"
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
    </>
  );
}
