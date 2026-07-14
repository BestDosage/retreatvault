"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useCompare } from "./CompareProvider";

export default function CompareBar() {
  const { items, remove, clear } = useCompare();
  // Respect prefers-reduced-motion: the bar appears/leaves with a plain opacity
  // fade, no slide-up sweep (same pattern as IntelligencePanels).
  const reduce = useReducedMotion();

  if (items.length === 0) return null;

  const compareUrl = `/compare?retreats=${items.map((i) => i.slug).join(",")}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={reduce ? { opacity: 0 } : { y: 100, opacity: 0 }}
        animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
        exit={reduce ? { opacity: 0 } : { y: 100, opacity: 0 }}
        transition={reduce ? { duration: 0.15 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4"
      >
        {/* Floating cream-glass pill */}
        <div className="flex items-center gap-4 rounded-full bg-cream-50/90 px-3 py-2.5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.35)] ring-1 ring-cream-200 backdrop-blur-md sm:gap-5 sm:pl-5 sm:pr-3">
          {/* Selected thumbnails */}
          <div className="flex items-center gap-2">
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500 sm:block">
              Compare
            </span>
            <div className="flex gap-1.5">
              {items.map((item) => (
                <div key={item.id} className="group relative">
                  <div className="h-10 w-10 overflow-hidden rounded-full ring-1 ring-cream-200 sm:h-11 sm:w-11">
                    {item.hero_image_url?.startsWith("http") ? (
                      <img src={item.hero_image_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-cream-200" />
                    )}
                  </div>
                  <button
                    onClick={() => remove(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink-900 text-[10px] text-cream-50 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {/* Empty slots */}
              {Array.from({ length: 3 - items.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-cream-200 sm:h-11 sm:w-11"
                >
                  <span className="text-[11px] text-ink-500/50">+</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={clear}
              className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-500 transition-colors hover:text-ink-900"
            >
              Clear
            </button>
            {items.length >= 2 && (
              <a
                href={compareUrl}
                className="group inline-flex items-center gap-2 rounded-full bg-ink-900 py-2.5 pl-5 pr-4 text-[12px] font-medium text-cream-50 transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                Compare ({items.length})
                <svg
                  className="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
