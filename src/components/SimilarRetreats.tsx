import { WellnessRetreat } from "@/lib/types";
import HorizontalScroll from "./HorizontalScroll";
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

      <div className="mt-10">
        <HorizontalScroll retreats={retreats} />
      </div>
    </section>
  );
}
