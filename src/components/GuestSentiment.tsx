interface ReviewSummary {
  source: string;
  rating: number;
  text: string;
  author: string;
  date: string;
  sentiment: "positive" | "neutral" | "negative";
}

interface GuestSentimentProps {
  retreatName: string;
  googleRating: number;
  googleCount: number;
  tripadvisorRating: number | null;
  tripadvisorCount: number | null;
  reviews: ReviewSummary[];
  themes: { label: string; count: number; sentiment: "positive" | "negative" }[];
}

export default function GuestSentiment({
  retreatName,
  googleRating,
  googleCount,
  tripadvisorRating,
  tripadvisorCount,
  reviews,
  themes,
}: GuestSentimentProps) {
  const hasReviews = reviews.length > 0;
  const positiveReviews = reviews.filter(r => r.sentiment === "positive").slice(0, 3);
  const negativeReviews = reviews.filter(r => r.sentiment === "negative").slice(0, 2);
  const neutralReviews = reviews.filter(r => r.sentiment === "neutral").slice(0, 1);
  const displayReviews = [...positiveReviews, ...negativeReviews, ...neutralReviews];

  // Designed pending state — the sentiment analysis table is empty until the
  // aggregation pipeline lands (Phase 6). Shipping design doesn't wait on data.
  const isPending = themes.length === 0 && !hasReviews;

  const aggregatedFrom = [
    googleCount > 0 && `${googleCount} Google reviews`,
    tripadvisorCount && tripadvisorCount > 0 && `${tripadvisorCount} TripAdvisor reviews`,
  ].filter(Boolean).join(" and ");

  return (
    <section className="border-t border-cream-200 pt-8">
      <div className="grid gap-6 md:grid-cols-[1fr_2fr] md:gap-10">
        {/* Heading + ratings */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">Guest Intelligence</p>
          <h2 className="mt-2 font-display text-2xl text-ink-900">What Guests Say</h2>
          {aggregatedFrom && (
            <p className="mt-2 text-xs text-ink-500">Aggregated from {aggregatedFrom}</p>
          )}

          <div className="mt-5 flex flex-wrap gap-8">
            {googleRating > 0 && (
              <div>
                <div className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-display text-xl tabular-nums text-ink-900">{googleRating}</span>
                </div>
                <p className="mt-1 text-[11px] tabular-nums text-ink-500">Google ({googleCount})</p>
              </div>
            )}
            {tripadvisorRating && tripadvisorRating > 0 && (
              <div>
                <div className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-sage-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-display text-xl tabular-nums text-ink-900">{tripadvisorRating}</span>
                </div>
                <p className="mt-1 text-[11px] tabular-nums text-ink-500">TripAdvisor ({tripadvisorCount})</p>
              </div>
            )}
          </div>
        </div>

        {/* Themes + reviews, or pending state */}
        <div>
          {isPending ? (
            <p className="text-sm italic leading-relaxed text-ink-500">
              Guest sentiment analysis in progress &middot; based on aggregated public reviews
            </p>
          ) : (
            <>
              {themes.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">Common Themes</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {themes.map((theme) => (
                      <span
                        key={theme.label}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-medium ${
                          theme.sentiment === "positive"
                            ? "bg-sage-100 text-sage-700"
                            : "bg-cream-200 text-ink-500"
                        }`}
                      >
                        {theme.label} <span className="tabular-nums">({theme.count})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {hasReviews && (
                <div className={themes.length > 0 ? "mt-7" : ""}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">Selected Reviews</p>
                  <div className="mt-3">
                    {displayReviews.map((review, i) => (
                      <div key={i} className="border-b border-cream-200 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${
                              review.sentiment === "positive" ? "bg-sage-600" :
                              review.sentiment === "negative" ? "bg-ink-500/40" : "bg-ink-500"
                            }`} />
                            <span className="text-xs font-medium text-ink-700">{review.author}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-ink-500">
                            <span className="capitalize">{review.source.replace("_", " ")}</span>
                            <span aria-hidden>&middot;</span>
                            <span>{review.date}</span>
                          </div>
                        </div>
                        <p className="mt-2 text-[13px] italic leading-relaxed text-ink-700">
                          &ldquo;{review.text}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
