"use client";

import { useEffect, useRef, useState } from "react";
import { Chart, RadialLinearScale, PointElement, LineElement, Filler, Tooltip } from "chart.js";
import { Radar } from "react-chartjs-2";
import { motion, useInView } from "framer-motion";
import { CATEGORY_LABELS, RetreatScores } from "@/lib/types";

Chart.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

interface Props {
  scores: RetreatScores;
  name: string;
}

export default function RadarChart({ scores, name }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isInView) {
      const t = setTimeout(() => setAnimate(true), 200);
      return () => clearTimeout(t);
    }
  }, [isInView]);

  const entries = Object.entries(scores) as [keyof RetreatScores, { score: number }][];
  const labels = entries.map(([key]) => CATEGORY_LABELS[key]);
  const values = entries.map(([, v]) => (animate ? v.score : 0));

  const data = {
    labels,
    datasets: [
      {
        label: name,
        data: values,
        backgroundColor: "rgba(212, 175, 55, 0.08)",
        borderColor: "rgba(212, 175, 55, 0.6)",
        borderWidth: 1.5,
        pointBackgroundColor: "rgba(212, 175, 55, 0.8)",
        pointBorderColor: "transparent",
        pointRadius: 3,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "#d4af37",
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
        ticks: {
          stepSize: 2,
          display: false,
        },
        grid: {
          color: "rgba(255, 255, 255, 0.04)",
        },
        angleLines: {
          color: "rgba(255, 255, 255, 0.04)",
        },
        pointLabels: {
          color: "rgba(255, 255, 255, 0.4)",
          font: { size: 9, family: "Inter" },
        },
      },
    },
    plugins: {
      tooltip: {
        backgroundColor: "rgba(10, 10, 10, 0.9)",
        borderColor: "rgba(212, 175, 55, 0.2)",
        borderWidth: 1,
        titleFont: { family: "Inter", size: 11 },
        bodyFont: { family: "Inter", size: 11 },
        titleColor: "#d4af37",
        bodyColor: "#b0b0b0",
        padding: 10,
        cornerRadius: 8,
      },
      legend: { display: false },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="mx-auto max-w-md"
    >
      <Radar data={data} options={options} />
    </motion.div>
  );
}
