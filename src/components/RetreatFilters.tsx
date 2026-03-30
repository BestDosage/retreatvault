"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const REGIONS = ["All", "USA", "Europe", "Canada", "Mexico", "Asia"];
const TIERS = [
  { value: "all", label: "All Tiers" },
  { value: "elite", label: "Elite (9.0+)" },
  { value: "exceptional", label: "Exceptional (8.0+)" },
  { value: "highly_recommended", label: "Highly Recommended (7.0+)" },
];
const SORT_OPTIONS = [
  { value: "score_desc", label: "Highest Vault Score" },
  { value: "score_asc", label: "Lowest Vault Score" },
  { value: "price_asc", label: "Lowest Price" },
  { value: "price_desc", label: "Highest Price" },
  { value: "rating_desc", label: "Highest Rating" },
];

export default function RetreatFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeRegion = searchParams.get("region") || "All";
  const activeTier = searchParams.get("tier") || "all";
  const activeSort = searchParams.get("sort") || "score_desc";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "All" || value === "all" || value === "score_desc") params.delete(key);
      else params.set(key, value);
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

      {/* Dropdowns */}
      <div className="flex flex-wrap gap-3">
        <select
          value={activeTier}
          onChange={(e) => updateParams("tier", e.target.value)}
          className="rounded-full border border-white/[0.06] bg-transparent px-5 py-2.5 text-[10px] uppercase tracking-wider text-dark-300 focus:border-gold-500/30 focus:outline-none"
        >
          {TIERS.map((t) => <option key={t.value} value={t.value} className="bg-dark-900">{t.label}</option>)}
        </select>
        <select
          value={activeSort}
          onChange={(e) => updateParams("sort", e.target.value)}
          className="rounded-full border border-white/[0.06] bg-transparent px-5 py-2.5 text-[10px] uppercase tracking-wider text-dark-300 focus:border-gold-500/30 focus:outline-none"
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-dark-900">{o.label}</option>)}
        </select>
      </div>
    </div>
  );
}
