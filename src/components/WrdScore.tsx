export default function WrdScore({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" | "xl" }) {
  const isTop = score >= 8.0;

  const sizes = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-20 w-20",
    xl: "h-28 w-28",
  };
  const text = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-4xl",
  };
  const label = {
    sm: "text-[5px]",
    md: "text-[7px]",
    lg: "text-[8px]",
    xl: "text-[10px]",
  };

  return (
    <div className={`flex flex-col items-center justify-center rounded-full border ${isTop ? "border-gold-400/40" : "border-white/10"} bg-dark-950/60 backdrop-blur-md ${sizes[size]}`}>
      <span className={`font-serif font-light leading-none text-white ${text[size]}`}>{score.toFixed(1)}</span>
      <span className={`font-semibold uppercase tracking-[0.2em] text-gold-400 ${label[size]}`}>RV</span>
    </div>
  );
}
