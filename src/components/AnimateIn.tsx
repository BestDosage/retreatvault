// Pure server components — no framer-motion, no client JS.
// Animations are driven by CSS classes defined in globals.css.
// This dramatically reduces TBT and main-thread work.
import type { ReactNode, CSSProperties } from "react";

// ═══ FADE/SLIDE IN ═══
export default function AnimateIn({
  children,
  delay = 0,
  duration,
  direction: _direction, // accepted for API compat, ignored
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
}) {
  const style: CSSProperties = {};
  if (delay) style.animationDelay = `${delay}s`;
  if (duration) style.animationDuration = `${duration}s`;
  return (
    <div className={`rv-fade-up ${className}`} style={style}>
      {children}
    </div>
  );
}

// ═══ STAGGER CHILDREN ═══
export function StaggerContainer({
  children,
  className = "",
  staggerDelay: _staggerDelay, // accepted for API compat, ignored
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return <div className={`rv-stagger ${className}`}>{children}</div>;
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

// ═══ TEXT REVEAL ═══
// Formerly a per-character Framer Motion animation. Now a plain
// server-rendered element with a simple CSS fade — no hydration cost,
// and the text is in the HTML immediately (big LCP win).
export function TextReveal({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const style: CSSProperties = delay ? { animationDelay: `${delay}s` } : {};
  return (
    <span className={`rv-fade-up inline-block ${className}`} style={style}>
      {text}
    </span>
  );
}

// ═══ COUNTER ═══
// Was an animated count-up using framer-motion useSpring.
// Now static — number is rendered server-side. Users don't need a
// counting animation to understand "$6.8T" — and it was costing
// hydration + continuous main-thread work.
export function Counter({
  target,
  prefix = "",
  suffix = "",
  className = "",
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const display =
    target >= 100 ? Math.round(target).toLocaleString() : target.toFixed(1);
  return (
    <span className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

// ═══ MARQUEE ═══
// Was a framer-motion infinite x animation. Now pure CSS keyframes —
// zero JS, browser-optimized, same visual result.
export function Marquee({
  children,
  speed: _speed, // accepted for API compat, ignored (CSS drives timing)
  className = "",
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="rv-marquee-track">
        {children}
        {children}
      </div>
    </div>
  );
}

// ═══ PARALLAX IMAGE ═══
// Was a framer-motion parallax. Now a plain lazy img (parallax is
// barely visible on desktop and costs continuous scroll-linked JS).
export function ParallaxImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
  speed?: number;
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
