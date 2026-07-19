import Link from "next/link";

interface EditorialReviewProps {
  retreatName: string;
  reviewHtml: string;
  verdict: string;
  bestFor: string[];
  notIdealFor: string[];
  alternatives: { name: string; slug: string; reason: string }[];
  lastUpdated: string;
}

export default function EditorialReview({
  reviewHtml,
  verdict,
  bestFor,
  notIdealFor,
  alternatives,
  lastUpdated,
}: EditorialReviewProps) {
  return (
    <div className="border-t border-cream-200 pt-8">
      {/* Visually-hidden heading keeps the section in the document outline. */}
      <h2 className="sr-only">The Vault Review</h2>
      {/* Eyebrow tag + byline */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">The Vault Review</p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
          RetreatVault Editorial · {lastUpdated}
        </p>
      </div>

      {/* Two-column editorial layout on desktop: article left, sticky rail right.
          Stacks to a single column on mobile. */}
      <div className="mt-7 grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* MAIN — review article body (clean body text, not oversized display).
            Content is trusted editorial HTML from our generation script. */}
        <div
          className="max-w-[70ch] text-[17px] leading-[1.75] text-ink-700 [&>p]:mt-5 [&>p:first-child]:mt-0"
          dangerouslySetInnerHTML={{ __html: reviewHtml }}
        />

        {/* RIGHT RAIL — verdict, fit signals, alternatives. Sticky on desktop. */}
        <aside className="flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
          {/* Verdict */}
          <div className="rounded-2xl bg-cream-100 p-6 ring-1 ring-cream-200">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">Verdict</p>
            <p className="mt-3 font-display text-lg leading-snug text-ink-900">{verdict}</p>
          </div>

          {/* Best For */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">Best For</p>
            <ul className="mt-4 space-y-2.5">
              {bestFor.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink-700">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sage-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Not Ideal For */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500">Not Ideal For</p>
            <ul className="mt-4 space-y-2.5">
              {notIdealFor.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink-500">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-500/40" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Alternatives */}
          {alternatives.length > 0 && (
            <div className="border-t border-cream-200 pt-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">Consider Instead</p>
              <p className="mt-1 text-xs text-ink-500">Similar retreats that might fit better</p>
              <div className="mt-4 divide-y divide-cream-200">
                {alternatives.map((alt) => (
                  <Link
                    key={alt.slug}
                    href={`/retreats/${alt.slug}`}
                    className="group flex items-center justify-between gap-3 py-3 transition-colors duration-200 ease-out"
                  >
                    <div>
                      <span className="text-sm font-medium text-ink-900 transition-colors duration-200 group-hover:text-sage-700">{alt.name}</span>
                      <p className="mt-0.5 text-xs text-ink-500">{alt.reason}</p>
                    </div>
                    <svg className="h-4 w-4 shrink-0 text-ink-500 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-sage-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
