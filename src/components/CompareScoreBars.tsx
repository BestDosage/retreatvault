"use client";

import { motion } from "framer-motion";
import { CATEGORY_LABELS, SCORE_WEIGHTS, RetreatScores, WellnessRetreat } from "@/lib/types";

interface Props {
  retreats: WellnessRetreat[];
  categories: (keyof RetreatScores)[];
  winner: WellnessRetreat;
}

export default function CompareScoreBars({ retreats, categories, winner }: Props) {
  return (
    <div className="space-y-1">
      {categories.map((cat) => {
        const scores = retreats.map((r) => r.scores[cat]?.score || 0);
        const maxScore = Math.max(...scores);

        return (
          <div
            key={cat}
            className="grid items-center gap-4 rounded-xl border border-cream-200 bg-cream-100 px-5 py-3 transition-colors hover:bg-cream-200/50"
            style={{ gridTemplateColumns: `180px repeat(${retreats.length}, 1fr)` }}
          >
            {/* Category label */}
            <div>
              <span className="text-[11px] uppercase tracking-wide text-ink-700">{CATEGORY_LABELS[cat]}</span>
              <span className="ml-2 text-[9px] tabular-nums text-ink-500/60">{((SCORE_WEIGHTS[cat] || 0) * 100).toFixed(0)}%</span>
            </div>

            {/* Score bars */}
            {retreats.map((r, i) => {
              const score = r.scores[cat]?.score || 0;
              const isWinner = score === maxScore && score > 0 && scores.filter((s) => s === maxScore).length === 1;
              return (
                <div key={r.id} className="flex items-center gap-3">
                  <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-cream-200">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(score / 10) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      className={`h-full rounded-full ${isWinner ? "bg-sage-600" : "bg-ink-900/25"}`}
                    />
                  </div>
                  <div className="flex w-14 items-center gap-1">
                    <span className={`text-[12px] font-medium tabular-nums ${isWinner ? "text-sage-700" : "text-ink-500"}`}>
                      {score.toFixed(1)}
                    </span>
                    {isWinner && (
                      <svg className="h-3 w-3 text-sage-600" fill="currentColor" viewBox="0 0 20 20">
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
