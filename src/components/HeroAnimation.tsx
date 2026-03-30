"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

// ═══ RISING LIGHT PARTICLES ═══
// Soft golden orbs float upward — lightness, release, revival
function Particles() {
  const [particles] = useState(() =>
    Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      startY: 80 + Math.random() * 30,
      size: 2 + Math.random() * 4,
      opacity: 0.15 + Math.random() * 0.35,
      duration: 12 + Math.random() * 18,
      delay: Math.random() * 12,
      drift: -15 + Math.random() * 30,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, rgba(212,175,55,${p.opacity}) 0%, rgba(212,175,55,0) 70%)`,
            boxShadow: `0 0 ${p.size * 3}px rgba(212,175,55,${p.opacity * 0.5})`,
          }}
          initial={{ y: `${p.startY}vh`, x: 0, opacity: 0 }}
          animate={{
            y: [
              `${p.startY}vh`,
              `${p.startY - 20}vh`,
              `${p.startY - 50}vh`,
              `-10vh`,
            ],
            x: [0, p.drift * 0.3, p.drift * 0.7, p.drift],
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// ═══ BREATHING RINGS ═══
// Concentric circles expand outward from center — mindfulness, calm, new beginnings
function BreathingRings() {
  const rings = [
    { delay: 0, duration: 8 },
    { delay: 2, duration: 8 },
    { delay: 4, duration: 8 },
    { delay: 6, duration: 8 },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {rings.map((ring, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            borderColor: "rgba(212, 175, 55, 0.06)",
          }}
          initial={{ width: 60, height: 60, opacity: 0 }}
          animate={{
            width: [60, 800],
            height: [60, 800],
            opacity: [0, 0.12, 0.08, 0],
            borderWidth: [1.5, 0.5],
          }}
          transition={{
            duration: ring.duration,
            delay: ring.delay,
            repeat: Infinity,
            ease: [0.25, 0.4, 0.25, 1],
          }}
        />
      ))}
    </div>
  );
}

// ═══ AURORA GRADIENT ═══
// Slow-shifting warm light — happiness, warmth, dawn of something new
function Aurora() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Primary warm glow — shifts position */}
      <motion.div
        className="absolute h-[600px] w-[800px] rounded-full opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, rgba(212,175,55,1) 0%, rgba(184,149,42,0.5) 40%, transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={{
          x: ["-20%", "10%", "-10%", "-20%"],
          y: ["-10%", "10%", "-5%", "-10%"],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        initial={{ left: "30%", top: "10%" }}
      />

      {/* Secondary rose glow */}
      <motion.div
        className="absolute h-[500px] w-[600px] rounded-full opacity-[0.025]"
        style={{
          background: "radial-gradient(circle, rgba(232,192,94,1) 0%, rgba(201,169,110,0.3) 50%, transparent 70%)",
          filter: "blur(100px)",
        }}
        animate={{
          x: ["10%", "-15%", "5%", "10%"],
          y: ["5%", "-10%", "15%", "5%"],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        initial={{ right: "10%", bottom: "20%" }}
      />

      {/* Subtle cool accent for depth */}
      <motion.div
        className="absolute h-[400px] w-[500px] rounded-full opacity-[0.015]"
        style={{
          background: "radial-gradient(circle, rgba(180,220,255,1) 0%, transparent 60%)",
          filter: "blur(100px)",
        }}
        animate={{
          x: ["-5%", "15%", "-10%", "-5%"],
          y: ["10%", "-5%", "5%", "10%"],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        initial={{ left: "50%", top: "40%" }}
      />
    </div>
  );
}

// ═══ LOTUS BLOOM ═══
// A geometric lotus that slowly blooms — renewal, transformation
function LotusBloom() {
  const petals = 8;
  const petalArray = Array.from({ length: petals }, (_, i) => i);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative h-[300px] w-[300px] sm:h-[400px] sm:w-[400px]">
        {petalArray.map((i) => {
          const rotation = (360 / petals) * i;
          return (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2"
              style={{
                transformOrigin: "center bottom",
                rotate: rotation,
              }}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{
                duration: 2.5,
                delay: 1.5 + i * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <motion.div
                className="relative -ml-[1px] -mt-[80px] h-[80px] w-[2px] sm:-mt-[110px] sm:h-[110px]"
                style={{
                  background: `linear-gradient(to top, rgba(212,175,55,0.15), rgba(212,175,55,0.03))`,
                }}
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 4,
                  delay: i * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          );
        })}

        {/* Center circle — the seed of renewal */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0) 70%)",
          }}
          initial={{ width: 0, height: 0, opacity: 0 }}
          animate={{
            width: [8, 16, 8],
            height: [8, 16, 8],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            delay: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Outer breathing circle */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{ borderColor: "rgba(212,175,55,0.06)" }}
          initial={{ width: 0, height: 0, opacity: 0 }}
          animate={{
            width: [160, 200, 160],
            height: [160, 200, 160],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 6,
            delay: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  );
}

// ═══ MAIN EXPORT ═══
export default function HeroAnimation() {
  const prefersReduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || prefersReduced) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]">
      <Aurora />
      <LotusBloom />
      <Particles />
      <BreathingRings />
    </div>
  );
}
