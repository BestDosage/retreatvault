"use client";

import { useEffect, useState } from "react";
import { isScorePublic } from "@/lib/types";

interface StickyMobileBarProps {
  retreatName: string;
  websiteUrl: string | null;
  score: number;
  priceMin: number;
  priceMax: number;
}

export default function StickyMobileBar({ retreatName, websiteUrl, score, priceMin, priceMax }: StickyMobileBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-cream-200 bg-cream-50/90 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-ink-900">{retreatName}</p>
          <div className="mt-0.5 flex items-center gap-3">
            <span className="text-[11px] font-semibold tabular-nums text-sage-700">
              {isScorePublic(score) ? `${score}/10` : "Listed"}
            </span>
            {priceMin > 0 && (
              <span className="text-[11px] tabular-nums text-ink-500">
                ${priceMin.toLocaleString()}&ndash;${priceMax.toLocaleString()}/night
              </span>
            )}
          </div>
        </div>
        <a
          href="#request-rates"
          className="group flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-ink-900 py-2 pl-5 pr-2 text-[12px] font-medium text-cream-50 transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          Check Rates
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
            <svg className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </a>
      </div>
    </div>
  );
}
