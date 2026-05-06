"use client";

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
    <section className="mt-12 border-t border-dark-700 pt-10">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-2xl font-light text-white">
          What guests actually say
        </h2>
        {data.review_count && (
          <span className="text-xs text-dark-400">
            Based on {data.review_count} reviews
          </span>
        )}
      </div>

      <p className="mt-4 text-[15px] leading-relaxed text-dark-300">
        {data.summary}
      </p>

      {/* Strengths & Weaknesses */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {data.strengths.length > 0 && (
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-emerald-400">
              What guests love
            </h3>
            <ul className="mt-3 space-y-2">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-[14px] text-dark-300">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.weaknesses.length > 0 && (
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-amber-400">
              What guests complain about
            </h3>
            <ul className="mt-3 space-y-2">
              {data.weaknesses.map((w, i) => (
                <li key={i} className="text-[14px] text-dark-300">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Category Verdicts */}
      {verdicts.length > 0 && (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {verdicts.map((v) => (
            <div
              key={v.label}
              className="rounded-lg bg-dark-800/50 p-4"
            >
              <span className="text-xs font-medium uppercase tracking-wider text-dark-400">
                {v.label}
              </span>
              <p className="mt-2 text-[13px] leading-relaxed text-dark-300">
                {v.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Real Quotes */}
      {data.best_quotes?.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xs font-medium uppercase tracking-wider text-dark-400">
            In their own words
          </h3>
          <div className="mt-4 space-y-4">
            {data.best_quotes.slice(0, 4).map((q, i) => (
              <blockquote
                key={i}
                className="border-l-2 border-dark-600 pl-4"
              >
                <p className="text-[14px] italic text-dark-300">
                  &ldquo;{q.text}&rdquo;
                </p>
                <footer className="mt-1 flex items-center gap-2 text-xs text-dark-500">
                  {q.rating > 0 && (
                    <span>
                      {"★".repeat(q.rating)}
                      {"☆".repeat(5 - q.rating)}
                    </span>
                  )}
                  {q.topic && (
                    <span className="rounded bg-dark-700 px-1.5 py-0.5 text-dark-400">
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
        <div className="mt-8 rounded-lg border border-amber-900/30 bg-amber-950/10 p-5">
          <h3 className="text-xs font-medium uppercase tracking-wider text-amber-400">
            Honest warnings
          </h3>
          <ul className="mt-3 space-y-2">
            {data.red_flags.map((flag, i) => (
              <li key={i} className="text-[14px] text-dark-300">
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ideal For / Not For */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {data.ideal_for?.length > 0 && (
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-dark-400">
              Best for
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.ideal_for.map((item, i) => (
                <span
                  key={i}
                  className="rounded-full bg-emerald-900/20 px-3 py-1 text-xs text-emerald-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
        {data.not_ideal_for?.length > 0 && (
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-dark-400">
              Skip if you
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.not_ideal_for.map((item, i) => (
                <span
                  key={i}
                  className="rounded-full bg-amber-900/20 px-3 py-1 text-xs text-amber-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Surprise Factor */}
      {data.surprise_factor && (
        <div className="mt-6 text-[14px] text-dark-400">
          <span className="text-dark-500">What surprises people:</span>{" "}
          {data.surprise_factor}
        </div>
      )}
    </section>
  );
}
