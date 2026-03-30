"use client";

import { WellnessRetreat, RetreatScores } from "@/lib/types";

// Derive "Best For" tags from scoring data
export function deriveBestForTags(retreat: WellnessRetreat): string[] {
  const tags: string[] = [];
  const s = retreat.scores;

  if (s.mindfulness?.score >= 8.5 || s.sleep?.score >= 8.5) tags.push("Best for Burnout");
  if (s.amenities?.score >= 8.5 && retreat.price_max_per_night >= 1500) tags.push("Best for Couples");
  if (s.medical?.score >= 8.0 || s.sleep?.score >= 8.5) tags.push("Best for Longevity");
  if ((s.medical?.score >= 9.0 || s.personalization?.score >= 9.0) && s.fitness?.score >= 7.5) tags.push("Best for Biohackers");
  if (s.personalization?.score >= 7.5 && s.pricing_value?.score >= 7.5 && s.travel_access?.score >= 7.0) tags.push("Best First Retreat");
  if (s.fitness?.score >= 9.0) tags.push("Best for Fitness");
  if (s.nutrition?.score >= 9.0) tags.push("Best for Nutrition");
  if (s.spa?.score >= 9.0) tags.push("Best for Spa");
  if (s.mindfulness?.score >= 9.0) tags.push("Best for Meditation");

  return tags.slice(0, 4); // max 4 tags per retreat
}

export function BestForChips({
  retreat,
  linkable = true,
}: {
  retreat: WellnessRetreat;
  linkable?: boolean;
}) {
  const tags = deriveBestForTags(retreat);
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) =>
        linkable ? (
          <a
            key={tag}
            href={`/retreats?tag=${encodeURIComponent(tag)}`}
            className="rounded-full border border-gold-400/15 bg-gold-400/[0.06] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-gold-300 transition-all duration-300 hover:border-gold-400/30 hover:bg-gold-400/10"
          >
            {tag}
          </a>
        ) : (
          <span
            key={tag}
            className="rounded-full border border-gold-400/15 bg-gold-400/[0.06] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-gold-300"
          >
            {tag}
          </span>
        )
      )}
    </div>
  );
}
