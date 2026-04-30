"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCompare } from "./CompareProvider";

export default function CompareBar() {
  const { items, remove, clear } = useCompare();

  if (items.length === 0) return null;

  const compareUrl = `/compare?retreats=${items.map((i) => i.slug).join(",")}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-gold-400/10 bg-dark-900/95 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-6 py-4 sm:px-10">
          {/* Selected retreats */}
          <div className="flex items-center gap-3">
            <span className="hidden text-[10px] uppercase tracking-[0.2em] text-dark-400 sm:block">
              Compare
            </span>
            <div className="flex gap-2">
              {items.map((item) => (
                <div key={item.id} className="group relative">
                  <div className="h-12 w-12 overflow-hidden rounded-lg border border-gold-400/20 sm:h-14 sm:w-14">
                    {item.hero_image_url?.startsWith("http") ? (
                      <img src={item.hero_image_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-dark-700" />
                    )}
                  </div>
                  <button
                    onClick={() => remove(item.id)}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-dark-700 text-[10px] text-dark-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-900 hover:text-white"
                  >
                    &times;
                  </button>
                  <div className="mt-1 hidden max-w-[56px] truncate text-center text-[8px] text-dark-400 sm:block">
                    {item.name}
                  </div>
                </div>
              ))}
              {/* Empty slots */}
              {Array.from({ length: 3 - items.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-white/[0.06] sm:h-14 sm:w-14">
                  <span className="text-[10px] text-dark-600">+</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button onClick={clear} className="text-[10px] uppercase tracking-wider text-dark-400 transition-colors hover:text-white">
              Clear
            </button>
            {items.length >= 2 && (
              <a href={compareUrl} className="btn-luxury btn-luxury-sm">
                <span className="sm:hidden">Compare</span>
                <span className="hidden sm:inline">Compare Now</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
