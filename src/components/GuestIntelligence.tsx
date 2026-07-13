interface GuestQuote {
  text: string;
  rating: number;
  topic: string;
}

interface GuestIntelligenceData {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  food_verdict: string | null;
  spa_verdict: string | null;
  rooms_verdict: string | null;
  staff_verdict: string | null;
  value_verdict: string | null;
  best_quotes: GuestQuote[];
  red_flags: string[];
  ideal_for: string[];
  not_ideal_for: string[];
  surprise_factor: string;
  review_count?: number;
}

export function GuestIntelligence({ data }: { data: GuestIntelligenceData | null }) {
  if (!data) return null;

  const verdicts = [
    { label: "Food", value: data.food_verdict },
    { label: "Spa", value: data.spa_verdict },
    { label: "Rooms", value: data.rooms_verdict },
    { label: "Staff", value: data.staff_verdict },
    { label: "Value", value: data.value_verdict },
  ].filter((v) => v.value);

  return (
    <section className="mt-12 border-t border-cream-200 pt-10">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl text-ink-900">
          What guests actually say
        </h2>
        {data.review_count && (
          <span className="text-xs tabular-nums text-ink-500">
            Based on {data.review_count} reviews
          </span>
        )}
      </div>

      <p className="mt-4 max-w-[65ch] text-[15px] leading-relaxed text-ink-700">
        {data.summary}
      </p>

      {/* Strengths & Weaknesses */}
      <div className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2">
        {data.strengths.length > 0 && (
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">
              What guests love
            </h3>
            <ul className="mt-4 space-y-2.5">
              {data.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-ink-700">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sage-600" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.weaknesses.length > 0 && (
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500">
              What guests complain about
            </h3>
            <ul className="mt-4 space-y-2.5">
              {data.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-ink-500">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-500/40" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Category Verdicts */}
      {verdicts.length > 0 && (
        <div className="mt-8 grid gap-x-10 md:grid-cols-2">
          {verdicts.map((v) => (
            <div key={v.label} className="border-b border-cream-200 py-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500">
                {v.label}
              </span>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-700">
                {v.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Real Quotes */}
      {data.best_quotes?.length > 0 && (
        <div className="mt-8">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500">
            In their own words
          </h3>
          <div className="mt-4">
            {data.best_quotes.slice(0, 4).map((q, i) => (
              <blockquote key={i} className="border-b border-cream-200 py-4">
                <p className="text-[15px] italic leading-relaxed text-ink-700">
                  &ldquo;{q.text}&rdquo;
                </p>
                <footer className="mt-2 flex items-center gap-2 text-xs text-ink-500">
                  {q.rating > 0 && (
                    <span aria-hidden className="text-gold">
                      {"★".repeat(q.rating)}
                      <span className="text-ink-500/30">{"★".repeat(5 - q.rating)}</span>
                    </span>
                  )}
                  {q.topic && (
                    <span className="rounded-full bg-cream-200 px-2 py-0.5 text-ink-500">
                      {q.topic}
                    </span>
                  )}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      )}

      {/* Red Flags */}
      {data.red_flags?.length > 0 && (
        <div className="mt-8 rounded-2xl bg-cream-100 p-5 ring-1 ring-cream-200">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500">
            Honest warnings
          </h3>
          <ul className="mt-3 space-y-2.5">
            {data.red_flags.map((flag, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-ink-700">
                <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-500/40" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ideal For / Not For */}
      <div className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2">
        {data.ideal_for?.length > 0 && (
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500">
              Best for
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.ideal_for.map((item, i) => (
                <span key={i} className="rounded-full bg-sage-100 px-3 py-1 text-xs text-sage-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
        {data.not_ideal_for?.length > 0 && (
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500">
              Skip if you
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.not_ideal_for.map((item, i) => (
                <span key={i} className="rounded-full bg-cream-200 px-3 py-1 text-xs text-ink-500">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Surprise Factor */}
      {data.surprise_factor && (
        <p className="mt-6 text-sm text-ink-700">
          <span className="text-ink-500">What surprises people:</span>{" "}
          {data.surprise_factor}
        </p>
      )}
    </section>
  );
}
