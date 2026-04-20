import { WellnessRetreat } from "@/lib/types";
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
    <section className="mb-24">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">
            Discover More
          </p>
          <h2 className="mt-3 font-serif text-3xl font-light text-white">
            Similar Retreats
          </h2>
        </div>
        <a
          href={`/retreats/region/${slugifyRegion(region)}`}
          className="text-[11px] font-medium uppercase tracking-wider text-gold-400 transition-colors hover:text-gold-300"
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
              className="group block overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.02] transition-all duration-500 hover:border-gold-500/15 hover:bg-white/[0.04]"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                {hasImage ? (
                  <img
                    src={r.hero_image_url}
                    alt={r.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full bg-dark-800" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-dark-950/20 to-transparent" />
                <div className="absolute left-3 top-3">
                  <TierBadge tier={r.score_tier} size="sm" />
                </div>
                <div className="absolute right-3 top-3 flex h-9 w-9 flex-col items-center justify-center rounded-full border border-white/15 bg-dark-950/50 backdrop-blur-sm">
                  <span className="font-serif text-[11px] font-medium text-white">
                    {r.wrd_score.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <p className="text-[8px] font-semibold uppercase tracking-[0.25em] text-gold-400/70">
                  {r.city}, {r.country}
                </p>
                <h3 className="mt-1.5 font-serif text-lg font-light text-white">
                  {r.name}
                </h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[12px] text-dark-400">
                    From{" "}
                    <span className="text-white">
                      ${r.price_min_per_night.toLocaleString()}
                    </span>
                    /night
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-gold-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
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
