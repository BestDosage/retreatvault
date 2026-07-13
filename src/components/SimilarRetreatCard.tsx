import Image from "next/image";
import Link from "next/link";
import { WellnessRetreat, isScorePublic } from "@/lib/types";
import { getRetreatImage } from "@/lib/retreat-images";
import TierBadge from "./TierBadge";

/**
 * Compact retreat card used in the "Similar Retreats" section on profile pages.
 * Server-component friendly (no "use client", uses Link instead of window.location).
 */
export default function SimilarRetreatCard({ retreat }: { retreat: WellnessRetreat }) {
  return (
    <Link
      href={`/retreats/${retreat.slug}`}
      className="group block transition-transform duration-300 ease-out hover:-translate-y-1"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream-100">
        <Image
          src={getRetreatImage(retreat)}
          alt={retreat.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          quality={60}
          loading="lazy"
          className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/20 to-transparent" />

        {/* Tier badge */}
        <div className="absolute left-3 top-3">
          <TierBadge tier={retreat.score_tier} size="sm" />
        </div>

        {/* Score pill */}
        <div className="absolute right-3 top-3">
          <div className="flex h-10 w-10 flex-col items-center justify-center rounded-full border border-cream-50/20 bg-ink-900/50 backdrop-blur-sm">
            <span className="font-display text-[12px] tabular-nums text-cream-50">{isScorePublic(retreat.wrd_score) ? retreat.wrd_score.toFixed(1) : "Listed"}</span>
            <span className="text-[5px] uppercase tracking-[0.15em] text-cream-100/70">RV</span>
          </div>
        </div>

        {/* Name + location */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-[8px] font-semibold uppercase tracking-[0.3em] text-cream-100/80">
            {retreat.city}, {retreat.country}
          </p>
          <h3 className="mt-1 font-display text-lg text-cream-50 line-clamp-2">
            {retreat.name}
          </h3>
        </div>
      </div>

      <div className="mt-3 px-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-ink-500">
            From <span className="font-medium tabular-nums text-ink-900">${retreat.price_min_per_night.toLocaleString()}</span>
            <span className="text-ink-500">/night</span>
          </span>
          <span className="text-ink-500">{retreat.country}</span>
        </div>
      </div>
    </Link>
  );
}
