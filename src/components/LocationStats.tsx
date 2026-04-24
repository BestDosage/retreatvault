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
          <div key={m.label} className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5">
            <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-dark-500">{m.label}</div>
            <div className="mt-2 font-serif text-xl font-light text-white">{m.value}</div>
            {m.sub && <div className="mt-0.5 text-[10px] text-dark-500">{m.sub}</div>}
          </div>
        ))}
      </div>

      {/* Score tier breakdown + price distribution */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Score tiers */}
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6">
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-gold-500">Quality Distribution</p>
          <div className="mt-4 space-y-3">
            {stats.scoreTierBreakdown.map((t) => (
              <div key={t.tier}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-dark-300">{t.tier}</span>
                  <span className="text-dark-400">{t.count} ({t.pct}%)</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-400/40 to-gold-400"
                    style={{ width: `${t.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price distribution */}
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6">
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-gold-500">Price Distribution</p>
          <div className="mt-4 space-y-3">
            {stats.priceBuckets.map((b) => (
              <div key={b.label}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-dark-300">{b.label}</span>
                  <span className="text-dark-400">{b.count} ({b.pct}%)</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400/40 to-emerald-400"
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
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6">
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-gold-500">Strongest Categories</p>
          <p className="mt-1 text-[10px] text-dark-500">What {locationName} retreats do best (avg score)</p>
          <div className="mt-4 space-y-3">
            {stats.topCategories.map((c) => (
              <div key={c.label} className="flex items-center justify-between">
                <span className="text-[12px] text-dark-300">{c.label}</span>
                <span className="font-serif text-[14px] text-gold-400">{c.avgScore}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular specialties */}
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6">
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-gold-500">Popular Specialties</p>
          <p className="mt-1 text-[10px] text-dark-500">Most common retreat focus areas</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {stats.topSpecialties.map((s) => (
              <span
                key={s.tag}
                className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[10px] capitalize text-dark-300"
              >
                {s.tag} <span className="text-dark-500">({s.count})</span>
              </span>
            ))}
          </div>
          {stats.topPrograms.length > 0 && (
            <>
              <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.25em] text-dark-500">Program Types</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {stats.topPrograms.map((p) => (
                  <span
                    key={p.tag}
                    className="rounded-full border border-gold-400/10 bg-gold-400/5 px-3 py-1.5 text-[10px] capitalize text-gold-300"
                  >
                    {p.tag} <span className="text-gold-500/60">({p.count})</span>
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
