import { isScorePublic } from "@/lib/types";

// Lab-report headline number for the score panel. Below the display gate the
// number is suppressed to "Listed" (never a low number advertising itself).
export default function WrdScore({ score }: { score: number; size?: "sm" | "md" | "lg" | "xl" }) {
  const scorePublic = isScorePublic(score);

  if (!scorePublic) {
    return (
      <span className="font-display text-4xl leading-none tracking-tight text-ink-900">Listed</span>
    );
  }

  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-display text-6xl leading-none tracking-tight tabular-nums text-ink-900">
        {score.toFixed(1)}
      </span>
      <span className="text-xl text-ink-500">/ 10</span>
    </div>
  );
}
