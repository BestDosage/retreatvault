"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const REGIONS = ["All", "USA", "Europe", "Canada", "Mexico", "Asia"];

// Best For tags — must mirror deriveBestForTags() in BestForTags.tsx
const BEST_FOR = [
  { value: "all", label: "Best For — All" },
  { value: "Best for Burnout", label: "Burnout Recovery" },
  { value: "Best for Longevity", label: "Longevity" },
  { value: "Best for Biohackers", label: "Biohackers" },
  { value: "Best for Couples", label: "Couples" },
  { value: "Best First Retreat", label: "First Retreat" },
  { value: "Best for Fitness", label: "Fitness" },
  { value: "Best for Nutrition", label: "Nutrition" },
  { value: "Best for Spa", label: "Spa" },
  { value: "Best for Meditation", label: "Meditation" },
];

// Budget bands are applied directly against price_max_per_night in
// src/app/retreats/page.tsx — no derivation dependency.
const BUDGET_TIERS = [
  { value: "all", label: "Any Budget" },
  { value: "accessible", label: "Accessible Luxury (<$500)" },
  { value: "mid", label: "Mid-Range ($500–$1,500)" },
  { value: "premium", label: "Premium ($1,500–$3,000)" },
  { value: "ultra", label: "Ultra-Premium ($3,000+)" },
];

const selectClass =
  "rounded-full border border-white/[0.06] bg-transparent px-5 py-2.5 text-[10px] uppercase tracking-wider text-dark-300 focus:border-gold-500/30 focus:outline-none";

export default function RetreatFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeRegion = searchParams.get("region") || "All";
  const activeBestFor = searchParams.get("tag") || "all";
  const activeBudget = searchParams.get("budget") || "all";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "All" || value === "all") params.delete(key);
      else params.set(key, value);
      // Strip any stale params from removed filters so old bookmarks can't
      // retrigger deleted code paths.
      params.delete("tier");
      params.delete("goal");
      params.delete("experience");
      params.delete("travel");
      params.delete("sort");
      // Reset pagination when a filter changes
      params.delete("page");
      router.push(`/retreats${params.toString() ? `?${params.toString()}` : ""}`);
    },
    [router, searchParams]
  );

  return (
    <div className="mb-12 space-y-6">
      {/* Region pills */}
      <div className="flex flex-wrap gap-2">
        {REGIONS.map((region) => (
          <button
            key={region}
            onClick={() => updateParams("region", region)}
            className={`rounded-full px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.2em] transition-all duration-500 ${
              activeRegion === region
                ? "bg-gold-400 text-dark-950 shadow-[0_0_24px_rgba(212,175,55,0.15)]"
                : "border border-white/[0.06] text-dark-400 hover:border-gold-500/20 hover:text-white"
            }`}
          >
            {region === "All" ? "All Regions" : region}
          </button>
        ))}
      </div>

      {/* Filter dropdowns — Best For + Budget only */}
      <div className="flex flex-wrap gap-3">
        <select aria-label="Best For" value={activeBestFor} onChange={(e) => updateParams("tag", e.target.value)} className={selectClass}>
          {BEST_FOR.map((t) => (
            <option key={t.value} value={t.value} className="bg-dark-900">{t.label}</option>
          ))}
        </select>

        <select aria-label="Budget Tier" value={activeBudget} onChange={(e) => updateParams("budget", e.target.value)} className={selectClass}>
          {BUDGET_TIERS.map((b) => (
            <option key={b.value} value={b.value} className="bg-dark-900">{b.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
