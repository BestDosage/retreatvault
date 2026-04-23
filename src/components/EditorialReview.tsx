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
  retreatName,
  reviewHtml,
  verdict,
  bestFor,
  notIdealFor,
  alternatives,
  lastUpdated,
}: EditorialReviewProps) {
  return (
    <div className="rounded-3xl border border-white/[0.04] bg-white/[0.015] p-8 sm:p-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Vault Review</p>
          <h2 className="mt-3 font-serif text-3xl font-light text-white">Our Take</h2>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-dark-500">Last updated</p>
          <p className="text-[11px] text-dark-400">{lastUpdated}</p>
        </div>
      </div>

      {/* Main review body — content is trusted editorial HTML from our generation script */}
      <div
        className="mt-8 max-w-none text-[13px] leading-[1.85] text-dark-300 [&>p]:mb-4 [&>p:first-child]:text-dark-200 [&>p:first-child]:text-[14px]"
        dangerouslySetInnerHTML={{ __html: reviewHtml }}
      />

      {/* Verdict */}
      <div className="mt-8 rounded-2xl border border-gold-400/10 bg-gold-400/[0.03] p-6">
        <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-gold-500">Verdict</p>
        <p className="mt-2 text-[14px] font-light leading-relaxed text-white">{verdict}</p>
      </div>

      {/* Best For / Not Ideal For */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-emerald-500">Best For</p>
          <ul className="mt-3 space-y-2">
            {bestFor.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[12px] text-dark-300">
                <span className="mt-0.5 text-emerald-400">&#10003;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-red-400/80">Not Ideal For</p>
          <ul className="mt-3 space-y-2">
            {notIdealFor.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[12px] text-dark-300">
                <span className="mt-0.5 text-red-400/60">&#10005;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <div className="mt-8 border-t border-white/[0.04] pt-8">
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-gold-500">Consider Instead</p>
          <p className="mt-1 text-[11px] text-dark-500">Similar retreats that might be a better fit</p>
          <div className="mt-4 space-y-3">
            {alternatives.map((alt) => (
              <Link
                key={alt.slug}
                href={`/retreats/${alt.slug}`}
                className="group flex items-center justify-between rounded-xl border border-white/[0.03] bg-white/[0.02] px-5 py-3 transition-all duration-300 hover:border-gold-500/15"
              >
                <div>
                  <span className="text-[13px] font-medium text-white group-hover:text-gold-300">{alt.name}</span>
                  <p className="mt-0.5 text-[11px] text-dark-500">{alt.reason}</p>
                </div>
                <svg className="h-4 w-4 text-dark-500 transition-all group-hover:translate-x-0.5 group-hover:text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
