import { WellnessRetreat, getTierLabel } from "@/lib/types";

// Text-only token pills. Light fills read cleanly on both the cream editorial
// surfaces and the (temporary) dark card surfaces still awaiting conversion.
// Gold = Elite, sage = Exceptional; lower tiers get quiet neutral pills. No icons.
const tierStyles: Record<WellnessRetreat["score_tier"], string> = {
  elite: "bg-gold text-ink-900",
  exceptional: "bg-sage-100 text-sage-700",
  highly_recommended: "bg-cream-200 text-ink-700",
  good: "bg-cream-200 text-ink-500",
  listed: "bg-cream-100 text-ink-500",
};

export default function TierBadge({ tier, size = "sm" }: { tier: WellnessRetreat["score_tier"]; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "px-3 py-1 text-[10px]",
    md: "px-3.5 py-1.5 text-[11px]",
    lg: "px-5 py-2 text-[12px]",
  };

  return (
    <span className={`inline-flex items-center rounded-full font-semibold uppercase tracking-[0.2em] ${tierStyles[tier]} ${sizeClasses[size]}`}>
      {getTierLabel(tier)}
    </span>
  );
}
