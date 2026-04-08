"use client";

import Image from "next/image";
import { WellnessRetreat } from "@/lib/types";
import TierBadge from "./TierBadge";
import AddToCompareButton from "./AddToCompareButton";
import { BestForChips } from "./BestForTags";

export default function RetreatCard({ retreat }: { retreat: WellnessRetreat }) {
  const topScores = Object.entries(retreat.scores)
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, 3);

  const labels: Record<string, string> = {
    nutrition: "Nutrition", fitness: "Fitness", mindfulness: "Mindfulness",
    spa: "Spa", sleep: "Sleep", medical: "Medical", personalization: "Personal.",
    amenities: "Amenities", pricing_value: "Value", activities: "Activities",
    education: "Education", travel_access: "Access", sustainability: "Sustain.",
    social_proof: "Reputation", addons: "Add-Ons",
  };

  return (
    <div
      className="group block cursor-pointer transition-transform duration-500 ease-out hover:-translate-y-1.5"
      onClick={() => (window.location.href = `/retreats/${retreat.slug}`)}
    >
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
        {retreat.hero_image_url?.startsWith("http") ? (
          <Image
            src={retreat.hero_image_url}
            alt={retreat.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={65}
            loading="lazy"
            className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <div className="h-full w-full bg-dark-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/20 to-transparent" />
        <div className="absolute inset-0 bg-dark-950/5 transition-opacity duration-700 group-hover:bg-dark-950/0" />

        {/* Badges */}
        <div className="absolute left-4 top-4"><TierBadge tier={retreat.score_tier} size="sm" /></div>
        <div className="absolute right-4 top-4">
          <div className="flex h-11 w-11 flex-col items-center justify-center rounded-full border border-white/15 bg-dark-950/50 backdrop-blur-sm">
            <span className="font-serif text-[13px] font-medium text-white">{retreat.wrd_score.toFixed(1)}</span>
            <span className="text-[5px] uppercase tracking-[0.15em] text-gold-400">RV</span>
          </div>
        </div>

        {/* Bottom text */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-[8px] font-semibold uppercase tracking-[0.3em] text-gold-400/70">
            {retreat.city}
          </p>
          <h3 className="mt-1 font-serif text-xl font-light text-white">
            {retreat.name}
          </h3>
        </div>
      </div>

      {/* Info below image */}
      <div className="mt-4 px-1">
        <p className="text-[12px] leading-relaxed text-dark-400 line-clamp-2">{retreat.subtitle}</p>

        <div className="mt-3 flex items-center gap-2 text-[10px] text-dark-500">
          <svg className="h-3 w-3 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-dark-200">{retreat.google_rating}</span>
          <span>({retreat.google_review_count})</span>
          <span className="mx-1 text-dark-700">&middot;</span>
          <span>{retreat.country}</span>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          {topScores.map(([key, cat]) => (
            <span key={key} className="rounded-md border border-white/[0.04] bg-white/[0.02] px-2 py-0.5 text-[9px] text-dark-300">
              <span className="text-gold-400">{cat.score.toFixed(1)}</span> {labels[key]}
            </span>
          ))}
        </div>

        {/* Best For tags */}
        <div className="mt-3">
          <BestForChips retreat={retreat} linkable={false} />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="text-[13px] font-medium text-white">
              ${retreat.price_min_per_night.toLocaleString()}
            </span>
            {retreat.price_min_per_night !== retreat.price_max_per_night && (
              <span className="text-[13px] text-dark-400">
                &ndash;${retreat.price_max_per_night.toLocaleString()}
              </span>
            )}
            <span className="ml-1 text-[10px] text-dark-500">/night</span>
          </div>
          <AddToCompareButton retreat={{ id: retreat.id, slug: retreat.slug, name: retreat.name, hero_image_url: retreat.hero_image_url, wrd_score: retreat.wrd_score }} />
        </div>
      </div>
    </div>
  );
}
