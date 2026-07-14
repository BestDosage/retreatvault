// Lab-report category bar: a 1px cream track with a 3px sage fill. Categories
// with no data render "Data pending" in italic ink — never a zero bar.
// No client JS: below the fold, CSS-only, keeps the performance floor intact.
export default function ScoreBar({ score, label, weight }: { score: number; label: string; weight?: number }) {
  const hasData = typeof score === "number" && score > 0;
  const pct = Math.max(0, Math.min(100, (score / 10) * 100));

  return (
    <div className="group flex items-center gap-4">
      <div className="w-36 shrink-0 sm:w-44">
        <span className="text-xs uppercase tracking-wide text-ink-500">{label}</span>
        {weight !== undefined && (
          <span className="ml-2 text-[10px] tabular-nums text-ink-500/60">{(weight * 100).toFixed(0)}%</span>
        )}
      </div>

      {hasData ? (
        <>
          <div className="relative h-[3px] flex-1">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-cream-200" />
            <div
              className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-sage-600 transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="w-8 text-right text-sm tabular-nums text-ink-700">{score.toFixed(1)}</span>
        </>
      ) : (
        <>
          <div className="h-px flex-1 bg-cream-200" />
          <span className="w-auto text-right text-xs italic text-ink-500">Data pending</span>
        </>
      )}
    </div>
  );
}
