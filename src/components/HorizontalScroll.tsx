import { WellnessRetreat } from "@/lib/types";
import RetreatCard from "./RetreatCard";

/**
 * Editorial horizontal scroll strip. Pure-CSS overflow scroll with snap —
 * no client JS. Renders the system-wide RetreatCard so the strip matches the
 * cream card language everywhere else. Designed to sit inside a padded
 * container (e.g. the similar-retreats section on the detail page).
 */
export default function HorizontalScroll({ retreats }: { retreats: WellnessRetreat[] }) {
  if (retreats.length === 0) return null;

  return (
    <div
      className="-mx-1 flex snap-x snap-mandatory gap-6 overflow-x-auto px-1 pb-2"
      style={{ scrollbarWidth: "none", overscrollBehaviorX: "contain" }}
    >
      {retreats.map((retreat) => (
        <div
          key={retreat.id}
          className="shrink-0 snap-start"
          style={{ width: "min(340px, 78vw)" }}
        >
          <RetreatCard retreat={retreat} />
        </div>
      ))}
    </div>
  );
}
