"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chart, RadialLinearScale, PointElement, LineElement, Filler, Tooltip } from "chart.js";
import { Radar } from "react-chartjs-2";
import { CATEGORY_LABELS, RetreatScores } from "@/lib/types";

Chart.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

interface Props {
  scores: RetreatScores;
  name: string;
}

// Resolve design tokens from CSS custom properties so the chart canvas stays on
// the token palette (ink stroke, sage fill) instead of chart.js default blue.
function useTokens() {
  const [tokens, setTokens] = useState({
    ink: "oklch(0.24 0.015 85)",
    ink500: "oklch(0.50 0.012 85)",
    sage: "oklch(0.48 0.080 155)",
  });
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    setTokens({
      ink: read("--color-ink-900", "oklch(0.24 0.015 85)"),
      ink500: read("--color-ink-500", "oklch(0.50 0.012 85)"),
      sage: read("--color-sage-600", "oklch(0.48 0.080 155)"),
    });
  }, []);
  return tokens;
}

export default function RadarChart({ scores, name }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);
  const tokens = useTokens();

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setAnimate(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setAnimate(true), 200);
          obs.disconnect();
        }
      },
      { rootMargin: "-100px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Exclude categories with no data — a zero bar would misread as "scored zero".
  const entries = useMemo(
    () =>
      (Object.entries(scores) as [keyof RetreatScores, { score: number }][]).filter(
        ([, v]) => typeof v.score === "number" && v.score > 0
      ),
    [scores]
  );
  const labels = entries.map(([key]) => CATEGORY_LABELS[key]);
  const values = entries.map(([, v]) => (animate ? v.score : 0));

  const fill = `color-mix(in srgb, ${tokens.sage} 12%, transparent)`;
  const grid = `color-mix(in srgb, ${tokens.ink} 8%, transparent)`;

  const data = {
    labels,
    datasets: [
      {
        label: name,
        data: values,
        backgroundColor: fill,
        borderColor: tokens.ink,
        borderWidth: 1.5,
        pointBackgroundColor: tokens.sage,
        pointBorderColor: "transparent",
        pointRadius: 3,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: tokens.sage,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    animation: { duration: 1200, easing: "easeOutQuart" as const },
    scales: {
      r: {
        min: 0,
        max: 10,
        ticks: { stepSize: 2, display: false },
        grid: { color: grid },
        angleLines: { color: grid },
        pointLabels: {
          color: tokens.ink500,
          font: { size: 9, family: "'Hanken Grotesk', system-ui, sans-serif" },
        },
      },
    },
    plugins: {
      tooltip: {
        backgroundColor: tokens.ink,
        borderColor: fill,
        borderWidth: 1,
        titleFont: { family: "'Hanken Grotesk', system-ui, sans-serif", size: 11 },
        bodyFont: { family: "'Hanken Grotesk', system-ui, sans-serif", size: 11 },
        titleColor: "oklch(0.975 0.008 85)",
        bodyColor: "oklch(0.925 0.012 85)",
        padding: 10,
        cornerRadius: 8,
      },
      legend: { display: false },
    },
  };

  return (
    <div ref={ref} className="mx-auto max-w-md">
      <Radar data={data} options={options} />
    </div>
  );
}
