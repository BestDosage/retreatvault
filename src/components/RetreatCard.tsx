import Image from "next/image";
import Link from "next/link";
import { WellnessRetreat, isScorePublic } from "@/lib/types";
import { getRetreatImage, isStockFallback, safeImageUrl, sizedImageUrl } from "@/lib/retreat-images";
import TierBadge from "./TierBadge";
import AddToCompareButton from "./AddToCompareButton";

/**
 * System-wide editorial retreat card (cream). Used across the directory,
 * guides, city/region/country/type indexes and the similar-retreats strip.
 *
 * Image honesty: the retreat name/location/score live in the cream caption
 * body below the photo — NEVER overlaid on the image. Our own keyed stock
 * fallbacks (isStockFallback) get a muted duotone so they read as ambience,
 * not as a claim that this is the property. A curated Unsplash hero is left
 * untreated. Server component — hover is pure CSS, no client JS.
 */
export default function RetreatCard({ retreat }: { retreat: WellnessRetreat }) {
  // Cards only ever want a network-loadable hero. getRetreatImage trusts local
  // "/images/*" paths as verified property photos, but those files don't exist
  // yet (e.g. Buchinger Wilhelmi) → next/image renders a blank grey box. Guard:
  // anything that isn't an http(s) URL falls back to the keyed location photo.
  // Future official photos live in the Supabase bucket (https) and pass through.
  const resolved = getRetreatImage(retreat);
  const img = resolved.startsWith("http")
    ? resolved
    : safeImageUrl("", retreat.region || "", retreat.country || "", retreat.slug);
  // Honesty gate on the CANONICAL url, THEN size for the card slot (~380px CSS,
  // 2x for retina). Cuts each card image from a 1200px JPEG to a ~760px AVIF.
  const muted = isStockFallback(img);
  const displaySrc = sizedImageUrl(img, 760, 570);
  const scorePublic = isScorePublic(retreat.wrd_score);
  const showTier = retreat.score_tier === "elite" || retreat.score_tier === "exceptional";
  const location = [retreat.city, retreat.country].filter(Boolean).join(", ");
  const priceBand =
    retreat.price_min_per_night > 0
      ? retreat.price_min_per_night !== retreat.price_max_per_night
        ? `$${retreat.price_min_per_night.toLocaleString()}–$${retreat.price_max_per_night.toLocaleString()} / night`
        : `$${retreat.price_min_per_night.toLocaleString()} / night`
      : "Price on request";

  return (
    <Link
      href={`/retreats/${retreat.slug}`}
      className="group block overflow-hidden rounded-2xl bg-cream-100 ring-1 ring-cream-200 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(0,0,0,0.15)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {/* Image — ambience only, no text overlaid */}
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-200">
        <Image
          src={displaySrc}
          alt=""
          fill
          loading="lazy"
          quality={65}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          style={muted ? { filter: "sepia(0.15) saturate(0.7)" } : undefined}
        />
        {showTier && (
          <div className="absolute left-4 top-4">
            <TierBadge tier={retreat.score_tier} size="sm" />
          </div>
        )}
        {/* Compare trigger — client leaf; swallows the click so the card link
            doesn't fire. Card itself stays a server component. */}
        <div className="absolute right-3 top-3 z-10">
          <AddToCompareButton
            retreat={{
              id: retreat.id,
              slug: retreat.slug,
              name: retreat.name,
              hero_image_url: sizedImageUrl(img, 240, 180),
              wrd_score: retreat.wrd_score,
            }}
            variant="circle"
          />
        </div>
      </div>

      {/* Cream caption body */}
      <div className="p-5">
        {location && (
          <p className="truncate text-sm text-ink-500">{location}</p>
        )}
        <h3 className="mt-1 line-clamp-2 font-display text-xl leading-tight text-ink-900">
          {retreat.name}
        </h3>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-cream-200 pt-4">
          <span className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular-nums text-ink-900">
              {scorePublic ? retreat.wrd_score.toFixed(1) : "Listed"}
            </span>
            {scorePublic && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500">
                Vault
              </span>
            )}
          </span>
          <span className="text-right text-[12px] tabular-nums text-ink-700">
            {priceBand}
          </span>
        </div>
      </div>
    </Link>
  );
}
