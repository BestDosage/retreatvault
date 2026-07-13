"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
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
// Shared editorial section scaffolding
// Rule-separated, asymmetric 1fr/2fr on md+, single column < 768px.
// ═══════════════════════════════════════════════
function PanelSection({
  eyebrow, title, score, children,
}: {
  eyebrow: string;
  title: string;
  score?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-cream-200 pt-8">
      <div className="grid gap-6 md:grid-cols-[1fr_2fr] md:gap-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">{eyebrow}</p>
          <h3 className="mt-2 font-display text-xl text-ink-900">{title}</h3>
          {score !== undefined && (
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-3xl tabular-nums text-ink-900">{score.toFixed(1)}</span>
              <span className="text-sm text-ink-500">/10</span>
            </div>
          )}
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

function Disclaimer({ children }: { children: React.ReactNode }) {
  return <p className="mt-6 text-[11px] italic leading-relaxed text-ink-500">{children}</p>;
}

// ═══════════════════════════════════════════════
// 1. LONGEVITY TECHNOLOGY INDEX
// ═══════════════════════════════════════════════
export function LongevityPanel({ data }: { data: LongevityIndex }) {
  return (
    <PanelSection eyebrow="Estimated Index" title="Longevity Technology" score={data.score}>
      <div className="grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
        {data.technologies.map((tech) => (
          <div key={tech.name} className="flex items-center gap-2.5 border-b border-cream-200 pb-2.5">
            <span aria-hidden className={`text-sm ${tech.available ? "text-sage-600" : "text-ink-500/40"}`}>
              {tech.available ? "✓" : "–"}
            </span>
            <span className={`text-[13px] ${tech.available ? "text-ink-700" : "text-ink-500"}`}>
              {tech.name}
            </span>
          </div>
        ))}
      </div>
      <Disclaimer>Estimated from scoring data. May not reflect actual offerings.</Disclaimer>
    </PanelSection>
  );
}

// ═══════════════════════════════════════════════
// Reduced-motion-aware meter
// ═══════════════════════════════════════════════
function Meter({ score }: { score: number }) {
  const reduce = useReducedMotion();
  const pct = `${(score / 10) * 100}%`;
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-cream-200">
      <motion.div
        initial={reduce ? false : { width: 0 }}
        whileInView={{ width: pct }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full bg-sage-600"
        style={reduce ? { width: pct } : undefined}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════
// 2. DIGITAL DETOX SCORE
// ═══════════════════════════════════════════════
export function DigitalDetoxPanel({ data }: { data: DigitalDetoxData }) {
  return (
    <PanelSection eyebrow="Estimated Index" title="Digital Detox Score" score={data.score}>
      <Meter score={data.score} />
      <div className="mt-5 space-y-0">
        {data.factors.map((f) => (
          <div key={f.name} className="flex items-center justify-between border-b border-cream-200 py-2.5 text-[13px]">
            <span className="text-ink-500">{f.name}</span>
            <span className="text-ink-700">{f.value}</span>
          </div>
        ))}
      </div>
      <Disclaimer>Estimated from scoring data. May not reflect actual offerings.</Disclaimer>
    </PanelSection>
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
  const includedServices = data.comparisons.filter((c) => c.included);
  const notIncluded = data.comparisons.filter((c) => !c.included);

  return (
    <PanelSection eyebrow="Value Analysis" title="Is This Retreat Worth It?">
      <p className="max-w-[60ch] text-sm leading-relaxed text-ink-700">
        This retreat bundles multiple wellness services into one price. Here&rsquo;s what it would cost to book the same services individually at home &mdash; personal trainer, nutritionist, spa, meals, and accommodation &mdash; compared to the all-in retreat price.
      </p>

      {/* Day selector */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs text-ink-500">Trip length:</span>
        {[3, 5, 7, 14].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors duration-150 ease-out ${
              days === d
                ? "bg-ink-900 text-cream-50"
                : "text-ink-500 ring-1 ring-ink-900/15 hover:text-ink-900"
            }`}
          >
            {d} days
          </button>
        ))}
      </div>

      {/* Comparison — two figures separated by a rule, no nested cards */}
      <div className="mt-7 grid gap-px overflow-hidden rounded-2xl bg-cream-200 sm:grid-cols-2">
        <div className="bg-cream-50 p-5">
          <div className="text-[10px] uppercase tracking-[0.16em] text-sage-700">All-In Retreat Price</div>
          <div className="mt-1.5 font-display text-3xl tabular-nums text-ink-900">${retreatTotal.toLocaleString()}</div>
          <div className="text-xs tabular-nums text-ink-500">${data.retreatCostPerDay.toLocaleString()}/day &times; {days} days</div>
          <div className="mt-2 text-xs text-ink-500">Everything below, included.</div>
        </div>
        <div className="bg-cream-50 p-5">
          <div className="text-[10px] uppercase tracking-[0.16em] text-ink-500">Booking Each Service at Home</div>
          <div className="mt-1.5 font-display text-3xl tabular-nums text-ink-500 line-through decoration-ink-500/30">${separateTotal.toLocaleString()}</div>
          <div className="text-xs tabular-nums text-ink-500">${data.totalSeparateCost.toLocaleString()}/day &times; {days} days</div>
          <div className="mt-2 text-xs text-ink-500">Hiring each professional separately.</div>
        </div>
      </div>

      {savings > 0 && (
        <div className="mt-4 rounded-2xl bg-sage-100 px-5 py-4 text-center">
          <div className="font-display text-lg tabular-nums text-sage-700">
            You save ${savings.toLocaleString()}
          </div>
          <div className="mt-0.5 text-xs text-sage-700/80">
            That&rsquo;s {data.savingsPercent}% less than booking the same services individually
          </div>
        </div>
      )}

      {/* What's included breakdown */}
      <div className="mt-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">What&rsquo;s bundled in your retreat price</p>
        <div className="mt-3">
          {includedServices.map((c) => (
            <div key={c.service} className="flex items-center justify-between gap-4 border-b border-cream-200 py-2.5">
              <div className="flex items-center gap-2.5">
                <span aria-hidden className="text-sage-600">{"✓"}</span>
                <span className="text-[13px] text-ink-700">{c.service}</span>
              </div>
              <span className="text-xs text-ink-500">
                would cost <span className="tabular-nums text-ink-700">${c.dailyCost}/day</span> at home
              </span>
            </div>
          ))}
          {notIncluded.map((c) => (
            <div key={c.service} className="flex items-center justify-between gap-4 border-b border-cream-200 py-2.5 opacity-50">
              <div className="flex items-center gap-2.5">
                <span aria-hidden className="text-ink-500">{"–"}</span>
                <span className="text-[13px] text-ink-500">{c.service}</span>
              </div>
              <span className="text-xs text-ink-500">Not included</span>
            </div>
          ))}
        </div>
      </div>
    </PanelSection>
  );
}

// ═══════════════════════════════════════════════
// 4. SLEEP SCIENCE RATING
// ═══════════════════════════════════════════════
export function SleepSciencePanel({ data }: { data: SleepScienceData }) {
  const [expanded, setExpanded] = useState(false);
  const reduce = useReducedMotion();

  return (
    <PanelSection eyebrow="Estimated Profile" title="Sleep Science Rating" score={data.score}>
      <Meter score={data.score} />

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 text-xs font-medium text-sage-700 underline-offset-4 transition-colors duration-150 ease-out hover:text-sage-600 hover:underline"
      >
        {expanded ? "Hide details" : "Show sub-factors"} {expanded ? "▲" : "▼"}
      </button>

      {expanded && (
        <motion.div
          initial={reduce ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3"
        >
          {data.factors.map((f) => (
            <div key={f.name} className="flex items-center justify-between gap-4 border-b border-cream-200 py-2.5">
              <div>
                <div className="text-[13px] text-ink-700">{f.name}</div>
                <div className="text-xs text-ink-500">{f.detail}</div>
              </div>
              <span className="font-display text-base tabular-nums text-ink-900">{f.score}</span>
            </div>
          ))}
        </motion.div>
      )}
      <Disclaimer>Estimated from scoring data. May not reflect actual offerings.</Disclaimer>
    </PanelSection>
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
    <PanelSection eyebrow="Guest Match" title="This retreat is best for">
      <dl className="grid gap-x-10 gap-y-0 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.label} className="flex items-baseline justify-between gap-4 border-b border-cream-200 py-3">
            <dt className="text-xs text-ink-500">{f.label}</dt>
            <dd className="text-right text-[13px] font-medium text-ink-900">{f.value}</dd>
          </div>
        ))}
      </dl>
    </PanelSection>
  );
}

// ═══════════════════════════════════════════════
// 7. SEASONAL PERFORMANCE CHART
// ═══════════════════════════════════════════════
export function SeasonalChart({ months }: { months: MonthData[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  // Resolve on-palette chart colors from the CSS token custom properties
  // (canvas paint can't use Tailwind classes), matching RadarChart's approach.
  const [colors, setColors] = useState({
    strong: "rgba(66,105,82,0.75)",
    soft: "rgba(66,105,82,0.28)",
    tick: "rgba(122,115,106,1)",
    tipBg: "rgba(250,247,240,1)",
    tipBorder: "rgba(122,115,106,0.25)",
    tipTitle: "rgba(45,42,38,1)",
    tipBody: "rgba(90,84,76,1)",
  });
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const v = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb;
    const sage = v("--color-sage-600", "rgb(66 105 82)");
    const ink500 = v("--color-ink-500", "rgb(122 115 106)");
    const ink900 = v("--color-ink-900", "rgb(45 42 38)");
    const ink700 = v("--color-ink-700", "rgb(90 84 76)");
    const cream = v("--color-cream-50", "rgb(250 247 240)");
    setColors({
      strong: `color-mix(in oklab, ${sage} 78%, transparent)`,
      soft: `color-mix(in oklab, ${sage} 28%, transparent)`,
      tick: ink500,
      tipBg: cream,
      tipBorder: `color-mix(in oklab, ${ink500} 30%, transparent)`,
      tipTitle: ink900,
      tipBody: ink700,
    });
  }, []);

  const data = {
    labels: months.map((m) => m.month),
    datasets: [
      {
        label: "Weather",
        data: isInView ? months.map((m) => m.weather) : months.map(() => 0),
        backgroundColor: colors.strong,
        borderRadius: 3,
        barPercentage: 0.7,
      },
      {
        label: "Value",
        data: isInView ? months.map((m) => m.pricing) : months.map(() => 0),
        backgroundColor: colors.soft,
        borderRadius: 3,
        barPercentage: 0.7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: "easeOutQuart" as const },
    scales: {
      x: { grid: { display: false }, ticks: { color: colors.tick, font: { size: 10 } } },
      y: { display: false, max: 12 },
    },
    plugins: {
      tooltip: {
        backgroundColor: colors.tipBg,
        borderColor: colors.tipBorder,
        borderWidth: 1,
        titleFont: { size: 11 },
        bodyFont: { size: 11 },
        titleColor: colors.tipTitle,
        bodyColor: colors.tipBody,
        padding: 10,
        cornerRadius: 8,
      },
      legend: { display: false },
    },
  };

  const seasonal = months.filter((m) => m.programs);

  return (
    <section ref={ref} className="border-t border-cream-200 pt-8">
      <div className="grid gap-6 md:grid-cols-[1fr_2fr] md:gap-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">Estimated Timing</p>
          <h3 className="mt-2 font-display text-xl text-ink-900">Best Months to Visit</h3>
          <div className="mt-3 flex gap-4 text-xs text-ink-500">
            <span><span className="mr-1.5 inline-block h-2 w-2 rounded-sm bg-sage-600" />Weather</span>
            <span><span className="mr-1.5 inline-block h-2 w-2 rounded-sm bg-sage-100" />Value</span>
          </div>
        </div>
        <div>
          <div className="h-40">
            <Bar data={data} options={options} />
          </div>
          {seasonal.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {seasonal.map((m) => (
                <span key={m.month} className="rounded-full bg-sage-100 px-3 py-1 text-[11px] text-sage-700">
                  {m.month}: {m.programs}
                </span>
              ))}
            </div>
          )}
          <Disclaimer>Estimated from location data. Check with the retreat for actual seasonal details.</Disclaimer>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════
// 8. VAULT SCORE SPARKLINE
// ═══════════════════════════════════════════════
export function ScoreSparkline({ history, categoryHighlights }: { history: ScoreHistoryPoint[]; categoryHighlights?: { label: string; direction: "up" | "down"; amount: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
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

  const startScore = history[0].score;
  const endScore = history[history.length - 1].score;
  const trend = endScore - startScore;
  const up = trend >= 0;

  return (
    <section ref={ref} className="border-t border-cream-200 pt-8">
      <div className="grid gap-6 md:grid-cols-[1fr_2fr] md:gap-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">Projected Trend</p>
          <h3 className="mt-2 font-display text-xl text-ink-900">Vault Score Trajectory</h3>
          <div className="mt-3 flex items-center gap-2.5 text-sm">
            <span className="tabular-nums text-ink-500">{startScore.toFixed(1)}</span>
            <span aria-hidden className="text-ink-500">&rarr;</span>
            <span className="font-display text-lg tabular-nums text-ink-900">{endScore.toFixed(1)}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${up ? "bg-sage-100 text-sage-700" : "bg-cream-200 text-ink-500"}`}>
              {up ? "Improving" : "Declining"}
            </span>
          </div>
        </div>
        <div>
          <div className="text-sage-600">
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 50 }}>
              <motion.polyline
                points={points.join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                animate={inView || reduce ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
          </div>
          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-ink-500">
            <span>2024</span>
            <span>2026</span>
          </div>

          {categoryHighlights && categoryHighlights.length > 0 && (
            <div className="mt-5 border-t border-cream-200 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">Key Changes</p>
              <div className="mt-2">
                {categoryHighlights.map((ch) => (
                  <div key={ch.label} className="flex items-center justify-between border-b border-cream-200 py-2">
                    <span className="text-[13px] text-ink-700">{ch.label}</span>
                    <span className={`text-[13px] font-medium tabular-nums ${ch.direction === "up" ? "text-sage-700" : "text-ink-500"}`}>
                      {ch.direction === "up" ? "↑" : "↓"} {ch.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Disclaimer>Projected from current data. Not based on historical measurements.</Disclaimer>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════
// 9. THE 72-HOUR EFFECT
// ═══════════════════════════════════════════════
export function SeventyTwoHourCard({ effect }: { effect: SeventyTwoHourEffect }) {
  const reduce = useReducedMotion();
  const phases = [
    { label: "Hours 1–24", title: "Arrival & Reset", text: effect.phase1 },
    { label: "Hours 24–48", title: "Deep Adaptation", text: effect.phase2 },
    { label: "Hours 48–72", title: "Transformation Begins", text: effect.phase3 },
  ];

  return (
    <PanelSection eyebrow="What to Expect" title="The 72-Hour Effect">
      <p className="max-w-[60ch] text-sm leading-relaxed text-ink-700">
        A general guide to the retreat experience based on available programs.
      </p>
      <div className="mt-6">
        {phases.map((phase, i) => (
          <motion.div
            key={phase.label}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: reduce ? 0 : i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-cream-200 py-5 first:border-t-0 first:pt-0"
          >
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-display text-base tabular-nums text-ink-900">{phase.label}</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sage-700">{phase.title}</span>
            </div>
            <p className="mt-2 max-w-[60ch] text-[13px] leading-relaxed text-ink-700">{phase.text}</p>
          </motion.div>
        ))}
      </div>
      <Disclaimer>Estimated from scoring data. Individual experiences vary.</Disclaimer>
    </PanelSection>
  );
}

// ═══════════════════════════════════════════════
// 5. HORMONE HEALTH FLAG (inline, not a panel)
// ═══════════════════════════════════════════════
export function HormoneHealthBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-sage-700">
      <span className="h-1.5 w-1.5 rounded-full bg-sage-600" />
      Women&rsquo;s Health
    </span>
  );
}
