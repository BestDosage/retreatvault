"use client";

import { useEffect, useState } from "react";

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
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-dark-950/95 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="min-w-0 flex-1 mr-3">
          <p className="truncate text-[13px] font-medium text-white">{retreatName}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px] font-semibold text-gold-400">{score}/10</span>
            {priceMin > 0 && (
              <span className="text-[11px] text-dark-400">
                ${priceMin.toLocaleString()}&ndash;${priceMax.toLocaleString()}/night
              </span>
            )}
          </div>
        </div>
        {websiteUrl ? (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full bg-gold-400 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-dark-950 transition-colors hover:bg-gold-300"
          >
            Visit Website
          </a>
        ) : (
          <a
            href="/quiz"
            className="shrink-0 rounded-full bg-gold-400 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-dark-950 transition-colors hover:bg-gold-300"
          >
            Take Quiz
          </a>
        )}
      </div>
    </div>
  );
}
