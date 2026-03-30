"use client";

import { motion } from "framer-motion";

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
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.015] p-6 sm:p-8">
      <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Dual Score</p>
      <h3 className="mt-2 font-serif text-xl font-light text-white">Vault Score vs Guest Score</h3>

      <div className="mt-6 grid grid-cols-2 gap-6">
        {/* Vault Score */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-gold-400/40 bg-dark-950/60"
          >
            <span className="font-serif text-2xl font-light text-white">{vaultScore.toFixed(1)}</span>
            <span className="text-[7px] font-semibold uppercase tracking-[0.2em] text-gold-400">Vault</span>
          </motion.div>
          <p className="mt-3 text-[10px] text-dark-400">Analytical Score</p>
          <p className="text-[9px] text-dark-500">15 categories &middot; 120+ data points</p>
        </div>

        {/* Guest Score */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-white/10 bg-dark-950/60"
          >
            <span className="font-serif text-2xl font-light text-white">
              {guestScore !== null ? guestScore.toFixed(1) : "N/A"}
            </span>
            <span className="text-[7px] font-semibold uppercase tracking-[0.2em] text-dark-400">Guest</span>
          </motion.div>
          <p className="mt-3 text-[10px] text-dark-400">Aggregated Reviews</p>
          <p className="text-[9px] text-dark-500">{totalReviews.toLocaleString()} reviews</p>
        </div>
      </div>

      {/* Divergence flag */}
      {diverges && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 rounded-xl border border-gold-400/15 bg-gold-400/[0.04] px-5 py-4"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-gold-400">{"\u26A0"}</span>
            <div>
              <p className="text-[11px] font-semibold text-gold-300">Scores Differ &mdash; Here&rsquo;s Why</p>
              <p className="mt-1 text-[11px] leading-relaxed text-dark-400">
                {vaultScore > (guestScore || 0)
                  ? "Our analytical scoring found strengths in clinical, nutrition, or personalization categories that typical guests don\u2019t rate in reviews. This retreat delivers more than its guest scores suggest."
                  : "Guest reviews rate the hospitality experience higher than our weighted clinical and wellness metrics. The property excels at guest satisfaction but scores lower on specialized wellness criteria."}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
