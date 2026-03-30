"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, Tooltip } from "chart.js";
import type {
  LongevityIndex, DigitalDetoxData, RoiData,
  SleepScienceData, IdealGuestProfile, MonthData,
  ScoreHistoryPoint, SeventyTwoHourEffect,
} from "@/lib/retreat-intelligence";

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip);

// ═══════════════════════════════════════════════
// 1. LONGEVITY TECHNOLOGY INDEX
// ═══════════════════════════════════════════════
export function LongevityPanel({ data }: { data: LongevityIndex }) {
  return (
    <div className="rounded-3xl border border-white/[0.04] bg-white/[0.015] p-6 sm:p-8">
      <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Proprietary Index</p>
      <div className="mt-2 flex items-center justify-between">
        <h3 className="font-serif text-xl font-light text-white">Longevity Technology</h3>
        <div className="flex items-center gap-2">
          <span className="font-serif text-2xl font-light text-gold-300">{data.score.toFixed(1)}</span>
          <span className="text-[9px] text-dark-500">/10</span>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-2">
        {data.technologies.map((tech) => (
          <div key={tech.name} className="flex items-center gap-2.5 rounded-lg bg-white/[0.02] px-3 py-2.5">
            <span className={`text-sm ${tech.available ? "text-gold-400" : "text-dark-600"}`}>
              {tech.available ? "\u2713" : "\u2715"}
            </span>
            <span className={`text-[11px] ${tech.available ? "text-dark-200" : "text-dark-500"}`}>
              {tech.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 2. DIGITAL DETOX SCORE
// ═══════════════════════════════════════════════
export function DigitalDetoxPanel({ data }: { data: DigitalDetoxData }) {
  return (
    <div className="rounded-3xl border border-white/[0.04] bg-white/[0.015] p-6 sm:p-8">
      <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Unplugged Index</p>
      <div className="mt-2 flex items-center justify-between">
        <h3 className="font-serif text-xl font-light text-white">Digital Detox Score</h3>
        <span className="font-serif text-2xl font-light text-gold-300">{data.score.toFixed(1)}<span className="text-[9px] text-dark-500">/10</span></span>
      </div>
      {/* Meter bar */}
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.04]">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${(data.score / 10) * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #9a7623, #f2d896)" }}
        />
      </div>
      <div className="mt-5 space-y-2.5">
        {data.factors.map((f) => (
          <div key={f.name} className="flex items-center justify-between text-[11px]">
            <span className="text-dark-400">{f.name}</span>
            <span className="text-dark-200">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 3. RETREAT ROI CALCULATOR
// ═══════════════════════════════════════════════
export function RoiCalculator({ data }: { data: RoiData }) {
  const [days, setDays] = useState(7);
  const retreatTotal = data.retreatCostPerDay * days;
  const separateTotal = data.totalSeparateCost * days;
  const savings = separateTotal - retreatTotal;

  return (
    <div className="rounded-3xl border border-gold-400/[0.08] bg-gradient-to-br from-white/[0.025] to-white/[0.01] p-6 sm:p-8">
      <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Value Analysis</p>
      <h3 className="mt-2 font-serif text-xl font-light text-white">Retreat ROI Calculator</h3>

      {/* Day selector */}
      <div className="mt-5 flex items-center gap-3">
        <span className="text-[11px] text-dark-400">Trip length:</span>
        {[3, 5, 7, 14].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-full px-3 py-1 text-[10px] font-medium transition-all ${
              days === d
                ? "bg-gold-400 text-dark-950"
                : "border border-white/[0.06] text-dark-400 hover:text-white"
            }`}
          >
            {d} days
          </button>
        ))}
      </div>

      {/* Comparison */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-white/[0.03] p-5">
          <div className="text-[9px] uppercase tracking-wider text-dark-500">Retreat Cost</div>
          <div className="mt-1 font-serif text-3xl font-light text-gold-300">${retreatTotal.toLocaleString()}</div>
          <div className="text-[10px] text-dark-500">${data.retreatCostPerDay.toLocaleString()}/day &times; {days} days</div>
        </div>
        <div className="rounded-xl bg-white/[0.03] p-5">
          <div className="text-[9px] uppercase tracking-wider text-dark-500">Same Services Separately</div>
          <div className="mt-1 font-serif text-3xl font-light text-dark-200">${separateTotal.toLocaleString()}</div>
          <div className="text-[10px] text-dark-500">${data.totalSeparateCost.toLocaleString()}/day &times; {days} days</div>
        </div>
      </div>

      {savings > 0 && (
        <div className="mt-4 rounded-xl border border-gold-400/10 bg-gold-400/[0.04] px-5 py-3 text-center">
          <span className="text-[12px] font-semibold text-gold-300">
            You save ${savings.toLocaleString()} ({data.savingsPercent}%) vs booking separately
          </span>
        </div>
      )}

      {/* Service breakdown */}
      <div className="mt-5 space-y-1.5">
        {data.comparisons.map((c) => (
          <div key={c.service} className="flex items-center justify-between text-[11px]">
            <span className={c.included ? "text-dark-300" : "text-dark-600 line-through"}>{c.service}</span>
            <span className={c.included ? "text-gold-400" : "text-dark-600"}>
              {c.included ? `$${c.dailyCost}/day` : "Not included"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 4. SLEEP SCIENCE RATING
// ═══════════════════════════════════════════════
export function SleepSciencePanel({ data }: { data: SleepScienceData }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-3xl border border-white/[0.04] bg-white/[0.015] p-6 sm:p-8">
      <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Sleep Lab</p>
      <div className="mt-2 flex items-center justify-between">
        <h3 className="font-serif text-xl font-light text-white">Sleep Science Rating</h3>
        <span className="font-serif text-2xl font-light text-gold-300">{data.score.toFixed(1)}<span className="text-[9px] text-dark-500">/10</span></span>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.04]">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${(data.score / 10) * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #4a3d8f, #9a7623, #f2d896)" }}
        />
      </div>

      <button onClick={() => setExpanded(!expanded)} className="mt-4 text-[10px] text-gold-400 hover:text-gold-300">
        {expanded ? "Hide details" : "Show sub-factors"} {expanded ? "\u25B2" : "\u25BC"}
      </button>

      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 space-y-2">
          {data.factors.map((f) => (
            <div key={f.name} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
              <div>
                <div className="text-[11px] text-dark-200">{f.name}</div>
                <div className="text-[10px] text-dark-500">{f.detail}</div>
              </div>
              <span className="font-serif text-sm text-gold-400">{f.score}</span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// 6. IDEAL GUEST PROFILE
// ═══════════════════════════════════════════════
export function IdealGuestCard({ profile }: { profile: IdealGuestProfile }) {
  const fields = [
    { label: "Age Range", value: profile.ageRange },
    { label: "Primary Goal", value: profile.primaryGoal },
    { label: "Experience Level", value: profile.experienceLevel },
    { label: "Travel Style", value: profile.travelStyle },
    { label: "Budget Tier", value: profile.budgetTier },
  ];

  return (
    <div className="rounded-3xl border border-gold-400/[0.08] bg-gradient-to-br from-white/[0.025] to-white/[0.01] p-6 sm:p-8">
      <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Guest Match</p>
      <h3 className="mt-2 font-serif text-xl font-light text-white">This retreat is best for</h3>
      <div className="mt-6 space-y-4">
        {fields.map((f) => (
          <div key={f.label} className="flex items-center justify-between border-b border-white/[0.03] pb-3">
            <span className="text-[11px] text-dark-400">{f.label}</span>
            <span className="text-[12px] font-medium text-white">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 7. SEASONAL PERFORMANCE CHART
// ═══════════════════════════════════════════════
export function SeasonalChart({ months }: { months: MonthData[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const data = {
    labels: months.map((m) => m.month),
    datasets: [
      {
        label: "Weather",
        data: isInView ? months.map((m) => m.weather) : months.map(() => 0),
        backgroundColor: "rgba(212, 175, 55, 0.6)",
        borderRadius: 4,
        barPercentage: 0.7,
      },
      {
        label: "Value",
        data: isInView ? months.map((m) => m.pricing) : months.map(() => 0),
        backgroundColor: "rgba(212, 175, 55, 0.25)",
        borderRadius: 4,
        barPercentage: 0.7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1200, easing: "easeOutQuart" as const },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#555", font: { size: 10 } } },
      y: { display: false, max: 12 },
    },
    plugins: {
      tooltip: {
        backgroundColor: "rgba(10,10,10,0.9)",
        borderColor: "rgba(212,175,55,0.2)",
        borderWidth: 1,
        titleFont: { size: 11 },
        bodyFont: { size: 11 },
        titleColor: "#d4af37",
        bodyColor: "#b0b0b0",
        padding: 10,
        cornerRadius: 8,
      },
      legend: { display: false },
    },
  };

  const seasonal = months.filter((m) => m.programs);

  return (
    <div ref={ref} className="rounded-3xl border border-white/[0.04] bg-white/[0.015] p-6 sm:p-8">
      <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Timing</p>
      <h3 className="mt-2 font-serif text-xl font-light text-white">Best Months to Visit</h3>
      <div className="mt-2 flex gap-4 text-[10px] text-dark-500">
        <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-gold-400/60" />Weather</span>
        <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-gold-400/25" />Value</span>
      </div>
      <div className="mt-4 h-40">
        <Bar data={data} options={options} />
      </div>
      {seasonal.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {seasonal.map((m) => (
            <span key={m.month} className="rounded-full border border-gold-400/10 bg-gold-400/[0.05] px-2.5 py-1 text-[9px] text-gold-300">
              {m.month}: {m.programs}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// 8. VAULT SCORE SPARKLINE
// ═══════════════════════════════════════════════
export function ScoreSparkline({ history }: { history: ScoreHistoryPoint[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const min = Math.min(...history.map((h) => h.score)) - 0.3;
  const max = Math.max(...history.map((h) => h.score)) + 0.3;
  const range = max - min;
  const w = 200;
  const h = 50;

  const points = history.map((p, i) => {
    const x = (i / (history.length - 1)) * w;
    const y = h - ((p.score - min) / range) * h;
    return `${x},${y}`;
  });

  const trend = history[history.length - 1].score - history[0].score;

  return (
    <div ref={ref} className="rounded-2xl border border-white/[0.04] bg-white/[0.015] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Trend</p>
          <h4 className="mt-1 text-[13px] font-medium text-white">Vault Score History</h4>
        </div>
        <span className={`text-[11px] font-medium ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {trend >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(trend).toFixed(1)} since Q1 2024
        </span>
      </div>
      <div className="mt-3">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 50 }}>
          <motion.polyline
            points={points.join(" ")}
            fill="none"
            stroke="#d4af37"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="mt-1 flex justify-between text-[8px] text-dark-600">
          <span>{history[0].quarter}</span>
          <span>{history[history.length - 1].quarter}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 9. THE 72-HOUR EFFECT
// ═══════════════════════════════════════════════
export function SeventyTwoHourCard({ effect }: { effect: SeventyTwoHourEffect }) {
  return (
    <div className="rounded-3xl border border-gold-400/[0.08] bg-gradient-to-br from-white/[0.025] to-white/[0.01] p-6 sm:p-8">
      <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Exclusive Insight</p>
      <h3 className="mt-2 font-serif text-2xl font-light text-white">The 72-Hour Effect</h3>
      <p className="mt-2 text-[11px] text-dark-500">What happens to your body in the first three days</p>

      <div className="mt-8 space-y-6">
        {[
          { label: "Hours 1\u201324", title: "Arrival & Reset", text: effect.phase1, color: "border-gold-400/20" },
          { label: "Hours 24\u201348", title: "Deep Adaptation", text: effect.phase2, color: "border-gold-400/30" },
          { label: "Hours 48\u201372", title: "Transformation Begins", text: effect.phase3, color: "border-gold-400/40" },
        ].map((phase, i) => (
          <motion.div
            key={phase.label}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={`border-l-2 ${phase.color} pl-5`}
          >
            <div className="flex items-center gap-3">
              <span className="font-serif text-sm text-gold-400">{phase.label}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-dark-300">{phase.title}</span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-dark-400">{phase.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 5. HORMONE HEALTH FLAG (inline, not a panel)
// ═══════════════════════════════════════════════
export function HormoneHealthBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-pink-300">
      <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
      Women&rsquo;s Health
    </span>
  );
}
