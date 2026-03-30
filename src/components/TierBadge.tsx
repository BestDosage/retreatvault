import { WellnessRetreat, getTierLabel } from "@/lib/types";

const tierStyles: Record<WellnessRetreat["score_tier"], string> = {
  elite: "bg-gold-400/15 text-gold-300 border-gold-400/30",
  exceptional: "bg-white/5 text-dark-100 border-white/10",
  highly_recommended: "bg-white/[0.03] text-dark-200 border-white/[0.06]",
  good: "bg-white/[0.02] text-dark-300 border-white/[0.04]",
  listed: "bg-transparent text-dark-400 border-white/[0.03]",
};

const tierIcons: Record<WellnessRetreat["score_tier"], string> = {
  elite: "\u2726",
  exceptional: "\u2605",
  highly_recommended: "",
  good: "",
  listed: "",
};

export default function TierBadge({ tier, size = "sm" }: { tier: WellnessRetreat["score_tier"]; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "px-2.5 py-1 text-[8px]",
    md: "px-3.5 py-1.5 text-[9px]",
    lg: "px-5 py-2 text-[10px]",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-[0.2em] ${tierStyles[tier]} ${sizeClasses[size]}`}>
      {tierIcons[tier] && <span className="text-[0.9em]">{tierIcons[tier]}</span>}
      {getTierLabel(tier)}
    </span>
  );
}
