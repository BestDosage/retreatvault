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

// Cream pill <select>. Active (non-default) selection flips to the ink pill.
const pillBase =
  "shrink-0 cursor-pointer rounded-full px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-600/40";
const pillActive = "bg-ink-900 text-cream-50";
const pillIdle =
  "border border-cream-200 bg-cream-100 text-ink-700 hover:border-sage-600/40 hover:text-sage-700";

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
    // Sticky researcher toolbar. Full-bleed cream glass that stays fixed as the
    // grid scrolls beneath it. position:sticky reserves no space → CLS 0.
    <div className="mt-10 sticky top-20 z-30 -mx-6 border-y border-cream-200 bg-cream-50/85 px-6 py-4 backdrop-blur-md sm:-mx-10 sm:px-10 lg:-mx-16 lg:px-16">
      <div
        className="flex items-center gap-2 overflow-x-auto sm:flex-wrap"
        style={{ scrollbarWidth: "none" }}
      >
        <span className="mr-1 hidden shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500 sm:inline">
          Region
        </span>
        {REGIONS.map((region) => (
          <button
            key={region}
            onClick={() => updateParams("region", region)}
            className={`${pillBase} ${activeRegion === region ? pillActive : pillIdle}`}
          >
            {region === "All" ? "All" : region}
          </button>
        ))}

        <span aria-hidden className="mx-1 hidden h-5 w-px shrink-0 bg-cream-200 sm:inline-block" />

        {/* Specialty */}
        <select
          aria-label="Best For"
          value={activeBestFor}
          onChange={(e) => updateParams("tag", e.target.value)}
          className={`${pillBase} appearance-none ${activeBestFor !== "all" ? pillActive : pillIdle}`}
        >
          {BEST_FOR.map((t) => (
            <option key={t.value} value={t.value} className="bg-cream-50 text-ink-900">
              {t.label}
            </option>
          ))}
        </select>

        {/* Price band */}
        <select
          aria-label="Budget Tier"
          value={activeBudget}
          onChange={(e) => updateParams("budget", e.target.value)}
          className={`${pillBase} appearance-none ${activeBudget !== "all" ? pillActive : pillIdle}`}
        >
          {BUDGET_TIERS.map((b) => (
            <option key={b.value} value={b.value} className="bg-cream-50 text-ink-900">
              {b.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
