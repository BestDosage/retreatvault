"use client";

import { WellnessRetreat } from "@/lib/types";
import { motion } from "framer-motion";
import TierBadge from "./TierBadge";

export default function HorizontalScroll({ retreats }: { retreats: WellnessRetreat[] }) {
  return (
    <div className="relative">
      <div className="flex gap-6 overflow-x-auto scroll-snap-x px-6 pb-4 sm:px-10 lg:px-16" style={{ scrollbarWidth: "none" }}>
        {retreats.map((retreat, i) => (
          <motion.a
            key={retreat.id}
            href={`/retreats/${retreat.slug}`}
            className="group relative flex-shrink-0 scroll-snap-start"
            style={{ width: "min(420px, 80vw)" }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Image */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
              {retreat.hero_image_url?.startsWith("http") ? (
                <img
                  src={retreat.hero_image_url}
                  alt={retreat.name}
                  className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full bg-dark-800" />
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/20 to-transparent" />
              <div className="absolute inset-0 bg-dark-950/10 transition-opacity duration-500 group-hover:opacity-0" />

              {/* Top badges */}
              <div className="absolute left-5 top-5 z-10">
                <TierBadge tier={retreat.score_tier} size="sm" />
              </div>

              {/* Score */}
              <div className="absolute right-5 top-5 z-10">
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-full border border-white/20 bg-dark-950/60 backdrop-blur-sm">
                  <span className="font-serif text-sm font-medium text-white">{retreat.wrd_score.toFixed(1)}</span>
                  <span className="text-[6px] uppercase tracking-widest text-gold-400">RV</span>
                </div>
              </div>

              {/* Bottom content */}
              <div className="absolute bottom-0 left-0 right-0 z-10 p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-400/80">
                  {retreat.city}, {retreat.country}
                </p>
                <h3 className="mt-2 font-serif text-2xl font-light text-white transition-colors duration-500 group-hover:text-gold-200">
                  {retreat.name}
                </h3>
                <p className="mt-2 text-[12px] leading-relaxed text-dark-200 line-clamp-2">
                  {retreat.subtitle}
                </p>

                {/* Price */}
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-white">
                      ${retreat.price_min_per_night.toLocaleString()}
                    </span>
                    {retreat.price_min_per_night !== retreat.price_max_per_night && (
                      <span className="text-sm text-dark-300">
                        {" "}&ndash; ${retreat.price_max_per_night.toLocaleString()}
                      </span>
                    )}
                    <span className="ml-1 text-[10px] text-dark-400">/night</span>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-gold-400 opacity-0 transition-all duration-500 group-hover:opacity-100">
                    View &rarr;
                  </span>
                </div>
              </div>
            </div>
          </motion.a>
        ))}

        {/* End spacer */}
        <div className="w-6 flex-shrink-0 sm:w-10 lg:w-16" />
      </div>

      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-dark-950 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-dark-950 to-transparent" />
    </div>
  );
}
