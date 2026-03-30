"use client";

import { motion, useInView, useSpring, useMotionValue, useTransform } from "framer-motion";
import { ReactNode, useRef, useEffect, useState } from "react";

// ═══ FADE/SLIDE IN ON SCROLL ═══
export default function AnimateIn({
  children,
  delay = 0,
  direction = "up",
  duration = 0.9,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
  className?: string;
}) {
  const offsets = {
    up: { y: 60, x: 0 },
    down: { y: -60, x: 0 },
    left: { x: 60, y: 0 },
    right: { x: -60, y: 0 },
    none: { x: 0, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ═══ STAGGER CHILDREN ═══
export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.12,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ═══ PARALLAX IMAGE ═══
export function ParallaxImage({
  src,
  alt,
  className = "",
  speed = 0.15,
}: {
  src: string;
  alt: string;
  className?: string;
  speed?: number;
}) {
  return (
    <motion.div className={`overflow-hidden ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        className="h-[120%] w-full object-cover"
        initial={{ y: `-${speed * 100}%` }}
        whileInView={{ y: `${speed * 100}%` }}
        viewport={{ once: false, margin: "200px" }}
        transition={{ duration: 0, ease: "linear" }}
        style={{ willChange: "transform" }}
        loading="lazy"
      />
    </motion.div>
  );
}

// ═══ ANIMATED COUNTER ═══
export function Counter({
  target,
  prefix = "",
  suffix = "",
  duration = 2,
  className = "",
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, { duration: duration * 1000, bounce: 0 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (isInView) motionVal.set(target);
  }, [isInView, target, motionVal]);

  useEffect(() => {
    const unsubscribe = springVal.on("change", (v) => {
      if (target >= 100) setDisplay(Math.round(v).toLocaleString());
      else setDisplay(v.toFixed(1));
    });
    return unsubscribe;
  }, [springVal, target]);

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  );
}

// ═══ TEXT REVEAL (CHAR BY CHAR) ═══
export function TextReveal({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const words = text.split(" ");
  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className={className}
    >
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.3em]">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: "110%" },
              visible: {
                y: "0%",
                transition: {
                  duration: 0.7,
                  delay: delay + i * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                },
              },
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

// ═══ HORIZONTAL MARQUEE ═══
export function Marquee({
  children,
  speed = 30,
  className = "",
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: [0, "-50%"] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}
