import Link from "next/link";

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

  return (
    <div className="rounded-3xl border border-white/[0.04] bg-white/[0.015] p-8 sm:p-12">
      <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Guest Intelligence</p>
      <h2 className="mt-3 font-serif text-3xl font-light text-white">What Guests Say</h2>
      <p className="mt-2 text-[12px] text-dark-500">
        Aggregated from {[
          googleCount > 0 && `${googleCount} Google reviews`,
          tripadvisorCount && tripadvisorCount > 0 && `${tripadvisorCount} TripAdvisor reviews`,
        ].filter(Boolean).join(" and ")}
      </p>

      {/* Rating overview */}
      <div className="mt-6 flex gap-4">
        {googleRating > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-5 py-3">
            <div>
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-serif text-xl font-light text-white">{googleRating}</span>
              </div>
              <p className="mt-0.5 text-[9px] text-dark-500">Google ({googleCount})</p>
            </div>
          </div>
        )}
        {tripadvisorRating && tripadvisorRating > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-5 py-3">
            <div>
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-serif text-xl font-light text-white">{tripadvisorRating}</span>
              </div>
              <p className="mt-0.5 text-[9px] text-dark-500">TripAdvisor ({tripadvisorCount})</p>
            </div>
          </div>
        )}
      </div>

      {/* Review themes */}
      {themes.length > 0 && (
        <div className="mt-8">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-dark-500">Common Themes</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {themes.map((theme) => (
              <span
                key={theme.label}
                className={`rounded-full border px-3 py-1.5 text-[10px] font-medium ${
                  theme.sentiment === "positive"
                    ? "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300"
                    : "border-red-400/15 bg-red-400/[0.06] text-red-300"
                }`}
              >
                {theme.label} ({theme.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Individual reviews */}
      {hasReviews && (
        <div className="mt-8 space-y-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-dark-500">Selected Reviews</p>
          {displayReviews.map((review, i) => (
            <div key={i} className="rounded-xl border border-white/[0.03] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    review.sentiment === "positive" ? "bg-emerald-400" :
                    review.sentiment === "negative" ? "bg-red-400" : "bg-dark-400"
                  }`} />
                  <span className="text-[11px] font-medium text-dark-200">{review.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] capitalize text-dark-500">{review.source.replace("_", " ")}</span>
                  <span className="text-[10px] text-dark-600">{review.date}</span>
                </div>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-dark-400 italic">
                &ldquo;{review.text}&rdquo;
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
