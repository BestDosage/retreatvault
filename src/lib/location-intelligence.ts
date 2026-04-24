/**
 * Location intelligence — derives stats, insights, and travel context
 * from retreat data grouped by region, country, or city.
 */

import { WellnessRetreat, CATEGORY_LABELS, RetreatScores } from "./types";

export interface LocationStats {
  retreatCount: number;
  avgScore: number;
  topScore: number;
  avgPriceMin: number;
  avgPriceMax: number;
  priceRangeLabel: string;
  topSpecialties: { tag: string; count: number }[];
  topPrograms: { tag: string; count: number }[];
  scoreTierBreakdown: { tier: string; count: number; pct: number }[];
  topCategories: { label: string; avgScore: number }[];
  priceBuckets: { label: string; count: number; pct: number }[];
}

export function deriveLocationStats(retreats: WellnessRetreat[]): LocationStats {
  if (retreats.length === 0) {
    return {
      retreatCount: 0, avgScore: 0, topScore: 0,
      avgPriceMin: 0, avgPriceMax: 0, priceRangeLabel: "",
      topSpecialties: [], topPrograms: [],
      scoreTierBreakdown: [], topCategories: [], priceBuckets: [],
    };
  }

  const n = retreats.length;

  // Basic stats
  const avgScore = Math.round((retreats.reduce((s, r) => s + r.wrd_score, 0) / n) * 10) / 10;
  const topScore = Math.max(...retreats.map((r) => r.wrd_score));
  const avgPriceMin = Math.round(retreats.reduce((s, r) => s + r.price_min_per_night, 0) / n);
  const avgPriceMax = Math.round(retreats.reduce((s, r) => s + r.price_max_per_night, 0) / n);

  const avgPrice = (avgPriceMin + avgPriceMax) / 2;
  const priceRangeLabel =
    avgPrice >= 1500 ? "Ultra-Premium" :
    avgPrice >= 800 ? "Premium" :
    avgPrice >= 400 ? "Mid-Range" :
    avgPrice >= 150 ? "Accessible" : "Budget";

  // Specialty tag frequency
  const tagCounts = new Map<string, number>();
  retreats.forEach((r) => {
    (r.specialty_tags || []).forEach((t) => {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    });
  });
  const topSpecialties = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag: tag.replace(/-/g, " "), count }));

  // Program type frequency
  const progCounts = new Map<string, number>();
  retreats.forEach((r) => {
    (r.program_types || []).forEach((t) => {
      progCounts.set(t, (progCounts.get(t) || 0) + 1);
    });
  });
  const topPrograms = Array.from(progCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => ({ tag: tag.replace(/-/g, " "), count }));

  // Score tier breakdown
  const tierMap = new Map<string, number>();
  retreats.forEach((r) => {
    const tier = r.score_tier || "listed";
    tierMap.set(tier, (tierMap.get(tier) || 0) + 1);
  });
  const tierLabels: Record<string, string> = {
    elite: "Elite (9+)", exceptional: "Exceptional (8-9)",
    highly_recommended: "Highly Recommended (7-8)", good: "Good (6-7)", listed: "Listed (<6)",
  };
  const scoreTierBreakdown = ["elite", "exceptional", "highly_recommended", "good", "listed"]
    .filter((t) => tierMap.has(t))
    .map((t) => ({
      tier: tierLabels[t] || t,
      count: tierMap.get(t) || 0,
      pct: Math.round(((tierMap.get(t) || 0) / n) * 100),
    }));

  // Average category scores
  const catSums = new Map<string, { sum: number; count: number }>();
  retreats.forEach((r) => {
    Object.entries(r.scores || {}).forEach(([key, val]: [string, any]) => {
      const score = val?.score || 0;
      if (score > 0) {
        const existing = catSums.get(key) || { sum: 0, count: 0 };
        existing.sum += score;
        existing.count += 1;
        catSums.set(key, existing);
      }
    });
  });
  const topCategories = Array.from(catSums.entries())
    .map(([key, v]) => ({
      label: CATEGORY_LABELS[key as keyof RetreatScores] || key,
      avgScore: Math.round((v.sum / v.count) * 10) / 10,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5);

  // Price buckets
  const buckets = [
    { label: "Under $200/night", min: 0, max: 200 },
    { label: "$200-500/night", min: 200, max: 500 },
    { label: "$500-1,000/night", min: 500, max: 1000 },
    { label: "$1,000-2,000/night", min: 1000, max: 2000 },
    { label: "$2,000+/night", min: 2000, max: Infinity },
  ];
  const priceBuckets = buckets.map((b) => {
    const count = retreats.filter((r) =>
      r.price_min_per_night >= b.min && r.price_min_per_night < b.max
    ).length;
    return { label: b.label, count, pct: Math.round((count / n) * 100) };
  }).filter((b) => b.count > 0);

  return {
    retreatCount: n, avgScore, topScore,
    avgPriceMin, avgPriceMax, priceRangeLabel,
    topSpecialties, topPrograms,
    scoreTierBreakdown, topCategories, priceBuckets,
  };
}
