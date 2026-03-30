"use client";

import { motion } from "framer-motion";
import { CATEGORY_LABELS, SCORE_WEIGHTS, RetreatScores, WellnessRetreat } from "@/lib/types";

interface Props {
  retreats: WellnessRetreat[];
  categories: (keyof RetreatScores)[];
  winner: WellnessRetreat;
}

const barColors = [
  "linear-gradient(90deg, #d4af37, #f2d896)",
  "linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.5))",
  "linear-gradient(90deg, rgba(180,220,255,0.3), rgba(180,220,255,0.5))",
];

export default function CompareScoreBars({ retreats, categories, winner }: Props) {
  return (
    <div className="space-y-1">
      {categories.map((cat) => {
        const scores = retreats.map((r) => r.scores[cat]?.score || 0);
        const maxScore = Math.max(...scores);

        return (
          <div
            key={cat}
            className="grid items-center gap-4 rounded-xl border border-white/[0.02] bg-white/[0.01] px-5 py-3 transition-colors hover:bg-white/[0.02]"
            style={{ gridTemplateColumns: `180px repeat(${retreats.length}, 1fr)` }}
          >
            {/* Category label */}
            <div>
              <span className="text-[11px] text-dark-300">{CATEGORY_LABELS[cat]}</span>
              <span className="ml-2 text-[9px] text-dark-600">{((SCORE_WEIGHTS[cat] || 0) * 100).toFixed(0)}%</span>
            </div>

            {/* Score bars */}
            {retreats.map((r, i) => {
              const score = r.scores[cat]?.score || 0;
              const isWinner = score === maxScore && scores.filter((s) => s === maxScore).length === 1;
              return (
                <div key={r.id} className="flex items-center gap-3">
                  <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(score / 10) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{ background: barColors[i] }}
                    />
                  </div>
                  <div className="flex w-14 items-center gap-1">
                    <span className={`text-[12px] font-medium ${i === 0 ? "text-gold-300" : "text-dark-200"}`}>
                      {score.toFixed(1)}
                    </span>
                    {isWinner && (
                      <svg className="h-3 w-3 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
