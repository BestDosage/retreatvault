"use client";

import { motion, useReducedMotion } from "framer-motion";
import { isScorePublic } from "@/lib/types";

interface Props {
  vaultScore: number;
  googleRating: number;
  tripadvisorRating: number | null;
  googleCount: number;
  tripadvisorCount: number | null;
}

export default function VaultVsGuest({
  vaultScore,
  googleRating,
  tripadvisorRating,
  googleCount,
  tripadvisorCount,
}: Props) {
  const reduce = useReducedMotion();
  // Normalize guest score to 0-10 scale (Google/TA are out of 5)
  const guestScores: number[] = [];
  if (googleRating > 0) guestScores.push(googleRating * 2);
  if (tripadvisorRating && tripadvisorRating > 0) guestScores.push(tripadvisorRating * 2);
  const guestScore = guestScores.length > 0
    ? Math.round((guestScores.reduce((a, b) => a + b, 0) / guestScores.length) * 10) / 10
    : null;

  const totalReviews = (googleCount || 0) + (tripadvisorCount || 0);
  const diverges = guestScore !== null && Math.abs(vaultScore - guestScore) > 1.0;

  return (
    <div className="rounded-[2rem] bg-cream-100 p-6 ring-1 ring-cream-200 sm:p-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">Dual Score</p>
      <h3 className="mt-2 font-display text-xl text-ink-900">Vault Score vs Guest Score</h3>

      <div className="mt-7 grid grid-cols-2 gap-6">
        {/* Vault Score */}
        <div className="text-center">
          <motion.div
            initial={reduce ? false : { scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto flex h-20 w-20 flex-col items-center justify-center rounded-full bg-cream-50 ring-2 ring-gold/50"
          >
            <span className="font-display text-2xl tabular-nums text-ink-900">{isScorePublic(vaultScore) ? vaultScore.toFixed(1) : "Listed"}</span>
            <span className="text-[7px] font-semibold uppercase tracking-[0.2em] text-sage-700">Vault</span>
          </motion.div>
          <p className="mt-3 text-xs text-ink-700">Analytical Score</p>
          <p className="text-[11px] text-ink-500">15 categories &middot; 120+ data points</p>
        </div>

        {/* Guest Score */}
        <div className="text-center">
          <motion.div
            initial={reduce ? false : { scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: reduce ? 0 : 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto flex h-20 w-20 flex-col items-center justify-center rounded-full bg-cream-50 ring-2 ring-ink-900/15"
          >
            <span className="font-display text-2xl tabular-nums text-ink-900">
              {guestScore !== null ? guestScore.toFixed(1) : "N/A"}
            </span>
            <span className="text-[7px] font-semibold uppercase tracking-[0.2em] text-ink-500">Guest</span>
          </motion.div>
          <p className="mt-3 text-xs text-ink-700">Aggregated Reviews</p>
          <p className="text-[11px] tabular-nums text-ink-500">{totalReviews.toLocaleString()} reviews</p>
        </div>
      </div>

      {/* Divergence flag */}
      {diverges && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: reduce ? 0 : 0.24 }}
          className="mt-7 rounded-2xl bg-sage-100 px-5 py-4"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage-700">Scores Differ &mdash; Here&rsquo;s Why</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-700">
            {vaultScore > (guestScore || 0)
              ? "Our analytical scoring found strengths in clinical, nutrition, or personalization categories that typical guests don’t rate in reviews. This retreat delivers more than its guest scores suggest."
              : "Guest reviews rate the hospitality experience higher than our weighted clinical and wellness metrics. The property excels at guest satisfaction but scores lower on specialized wellness criteria."}
          </p>
        </motion.div>
      )}
    </div>
  );
}
