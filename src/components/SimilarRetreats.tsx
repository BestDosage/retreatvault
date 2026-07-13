import Image from "next/image";
import { WellnessRetreat, isScorePublic } from "@/lib/types";
import TierBadge from "./TierBadge";
import { slugifyRegion } from "@/lib/data";

export default function SimilarRetreats({
  retreats,
  region,
}: {
  retreats: WellnessRetreat[];
  region: string;
}) {
  if (retreats.length === 0) return null;

  return (
    <section className="mb-24 border-t border-cream-200 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">
            Discover More
          </p>
          <h2 className="mt-2 font-display text-3xl text-ink-900">
            Similar Retreats
          </h2>
        </div>
        <a
          href={`/retreats/region/${slugifyRegion(region)}`}
          className="text-[11px] font-medium uppercase tracking-wider text-sage-700 underline-offset-4 transition-colors hover:text-sage-600 hover:underline"
        >
          More in {region} &rarr;
        </a>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {retreats.map((r) => {
          const hasImage = r.hero_image_url?.startsWith("http");
          return (
            <a
              key={r.slug}
              href={`/retreats/${r.slug}`}
              className="group block overflow-hidden rounded-2xl bg-cream-100 ring-1 ring-cream-200 transition-all duration-300 ease-out hover:-translate-y-1 hover:ring-ink-900/15"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-cream-200">
                {hasImage && (
                  <Image
                    src={r.hero_image_url}
                    alt={r.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={60}
                    loading="lazy"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/75 via-ink-900/15 to-transparent" />
                <div className="absolute left-3 top-3">
                  <TierBadge tier={r.score_tier} size="sm" />
                </div>
                <div className="absolute right-3 top-3 flex h-9 w-9 flex-col items-center justify-center rounded-full border border-cream-50/20 bg-ink-900/50 backdrop-blur-sm">
                  <span className="font-display text-[11px] tabular-nums text-cream-50">
                    {isScorePublic(r.wrd_score) ? r.wrd_score.toFixed(1) : "Listed"}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-sage-700">
                  {r.city}, {r.country}
                </p>
                <h3 className="mt-1.5 font-display text-lg text-ink-900">
                  {r.name}
                </h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[12px] text-ink-500">
                    From{" "}
                    <span className="font-medium tabular-nums text-ink-900">
                      ${r.price_min_per_night.toLocaleString()}
                    </span>
                    /night
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wider text-sage-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    View &rarr;
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
