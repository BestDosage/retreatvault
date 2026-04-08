"use client";

import { WellnessRetreat, RetreatScores } from "@/lib/types";

// Returns EVERY Best For tag a retreat qualifies for. Used by the directory
// filter — must NOT slice here, otherwise retreats whose matching tag is
// later in the derivation order (e.g. Spa, Meditation) get dropped from the
// filter result and the tag appears to return zero matches.
export function deriveAllBestForTags(retreat: WellnessRetreat): string[] {
  const tags: string[] = [];
  const s = retreat.scores;
  if (!s) return tags;

  if ((s.mindfulness?.score ?? 0) >= 8.5 || (s.sleep?.score ?? 0) >= 8.5) tags.push("Best for Burnout");
  if ((s.amenities?.score ?? 0) >= 8.5 && (retreat.price_max_per_night ?? 0) >= 1500) tags.push("Best for Couples");
  if ((s.medical?.score ?? 0) >= 8.0 || (s.sleep?.score ?? 0) >= 8.5) tags.push("Best for Longevity");
  if (((s.medical?.score ?? 0) >= 9.0 || (s.personalization?.score ?? 0) >= 9.0) && (s.fitness?.score ?? 0) >= 7.5) tags.push("Best for Biohackers");
  if ((s.personalization?.score ?? 0) >= 7.5 && (s.pricing_value?.score ?? 0) >= 7.5 && (s.travel_access?.score ?? 0) >= 7.0) tags.push("Best First Retreat");
  if ((s.fitness?.score ?? 0) >= 9.0) tags.push("Best for Fitness");
  if ((s.nutrition?.score ?? 0) >= 9.0) tags.push("Best for Nutrition");
  if ((s.spa?.score ?? 0) >= 9.0) tags.push("Best for Spa");
  if ((s.mindfulness?.score ?? 0) >= 9.0) tags.push("Best for Meditation");

  return tags;
}

// Display version — capped at 4 to avoid visual clutter on cards.
// Always use deriveAllBestForTags() for filtering logic.
export function deriveBestForTags(retreat: WellnessRetreat): string[] {
  return deriveAllBestForTags(retreat).slice(0, 4);
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
