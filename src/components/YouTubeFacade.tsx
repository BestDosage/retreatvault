"use client";

import { useState } from "react";

/**
 * Click-to-load YouTube embed with a fully generated placeholder.
 *
 * No third-party image is loaded: until the visitor clicks, we show a CSS
 * gradient + an inline SVG play button. The actual YouTube iframe is mounted
 * only on click. This avoids serving any externally-hosted thumbnail.
 */
export default function YouTubeFacade({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) {
  const [active, setActive] = useState(false);

  if (active) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label={`Play video: ${title}`}
      className="group/yt absolute inset-0 flex h-full w-full items-center justify-center overflow-hidden bg-ink-900"
    >
      {/* subtle texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(122,115,106,0.28),transparent_55%)]" />
      {/* play button */}
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all duration-300 group-hover/yt:scale-110 group-hover/yt:bg-white/20 group-hover/yt:ring-white/40">
        <svg className="ml-1 h-6 w-6 text-cream-50" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <span className="absolute bottom-3 left-0 right-0 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-cream-100/70">
        Watch on YouTube
      </span>
    </button>
  );
}
