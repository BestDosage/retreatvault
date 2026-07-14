import type { LocationStats as Stats } from "@/lib/location-intelligence";

export default function LocationStats({ stats, locationName }: { stats: Stats; locationName: string }) {
  if (stats.retreatCount === 0) return null;

  return (
    <div className="space-y-8">
      {/* Key metrics row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Retreats", value: stats.retreatCount.toLocaleString() },
          { label: "Avg Vault Score", value: stats.avgScore.toFixed(1) + "/10" },
          { label: "Avg Price", value: `$${stats.avgPriceMin}–$${stats.avgPriceMax}`, sub: "per night" },
          { label: "Market Tier", value: stats.priceRangeLabel },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl bg-cream-100 p-5 ring-1 ring-cream-200">
            <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-ink-500">{m.label}</div>
            <div className="mt-2 font-display text-xl tabular-nums text-ink-900">{m.value}</div>
            {m.sub && <div className="mt-0.5 text-[10px] text-ink-500">{m.sub}</div>}
          </div>
        ))}
      </div>

      {/* Score tier breakdown + price distribution */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Score tiers */}
        <div className="rounded-2xl bg-cream-100 p-6 ring-1 ring-cream-200">
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-sage-700">Quality Distribution</p>
          <div className="mt-4 space-y-3">
            {stats.scoreTierBreakdown.map((t) => (
              <div key={t.tier}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-ink-700">{t.tier}</span>
                  <span className="tabular-nums text-ink-500">{t.count} ({t.pct}%)</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sage-600/40 to-sage-600"
                    style={{ width: `${t.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price distribution */}
        <div className="rounded-2xl bg-cream-100 p-6 ring-1 ring-cream-200">
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-sage-700">Price Distribution</p>
          <div className="mt-4 space-y-3">
            {stats.priceBuckets.map((b) => (
              <div key={b.label}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-ink-700">{b.label}</span>
                  <span className="tabular-nums text-ink-500">{b.count} ({b.pct}%)</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-ink-500/40 to-ink-700"
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top categories + specialties */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Strongest categories */}
        <div className="rounded-2xl bg-cream-100 p-6 ring-1 ring-cream-200">
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-sage-700">Strongest Categories</p>
          <p className="mt-1 text-[10px] text-ink-500">What {locationName} retreats do best (avg score)</p>
          <div className="mt-4 space-y-3">
            {stats.topCategories.map((c) => (
              <div key={c.label} className="flex items-center justify-between">
                <span className="text-[12px] text-ink-700">{c.label}</span>
                <span className="font-display text-[14px] tabular-nums text-sage-700">{c.avgScore}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular specialties */}
        <div className="rounded-2xl bg-cream-100 p-6 ring-1 ring-cream-200">
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-sage-700">Popular Specialties</p>
          <p className="mt-1 text-[10px] text-ink-500">Most common retreat focus areas</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {stats.topSpecialties.map((s) => (
              <span
                key={s.tag}
                className="rounded-full bg-cream-50 px-3 py-1.5 text-[10px] capitalize text-ink-700 ring-1 ring-cream-200"
              >
                {s.tag} <span className="text-ink-500">({s.count})</span>
              </span>
            ))}
          </div>
          {stats.topPrograms.length > 0 && (
            <>
              <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.25em] text-ink-500">Program Types</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {stats.topPrograms.map((p) => (
                  <span
                    key={p.tag}
                    className="rounded-full bg-sage-100 px-3 py-1.5 text-[10px] capitalize text-sage-700"
                  >
                    {p.tag} <span className="text-sage-600/70">({p.count})</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
