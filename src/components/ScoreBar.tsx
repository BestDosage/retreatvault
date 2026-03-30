"use client";

import { motion } from "framer-motion";

export default function ScoreBar({ score, label, weight }: { score: number; label: string; weight?: number }) {
  const pct = (score / 10) * 100;
  const isGold = score >= 9;
  const isSilver = score >= 8;

  return (
    <div className="group flex items-center gap-4 py-1.5">
      <div className="w-36 shrink-0 text-right sm:w-44">
        <span className="text-[11px] text-dark-400 transition-colors duration-300 group-hover:text-dark-200">
          {label}
        </span>
        {weight !== undefined && (
          <span className="ml-2 text-[9px] text-dark-600">{(weight * 100).toFixed(0)}%</span>
        )}
      </div>
      <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/[0.04]">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{
            background: isGold
              ? "linear-gradient(90deg, #b8952a, #f2d896)"
              : isSilver
              ? "linear-gradient(90deg, #9a7623, #d4af37)"
              : "linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.25))",
          }}
        />
      </div>
      <span className={`w-8 text-right font-serif text-[13px] ${isGold ? "text-gold-300" : isSilver ? "text-gold-500" : "text-dark-300"}`}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}
