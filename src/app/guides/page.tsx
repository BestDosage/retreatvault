import { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/data/guides";

export const metadata: Metadata = {
  title: "Wellness Retreat Guides | Retreat Vault",
  description: "Data-driven guides to finding your perfect wellness retreat. Filtered by goal, budget, travel style, and personality — not marketing hype.",
  alternates: { canonical: "https://www.retreatvault.com/guides" },
};

const CATEGORY_LABELS: Record<string, string> = {
  persona: "By Travel Style",
  budget: "By Budget",
  goal: "By Wellness Goal",
  style: "By Experience",
};

const CATEGORY_ORDER = ["goal", "persona", "budget", "style"];

export default function GuidesIndex() {
  const grouped = new Map<string, typeof GUIDES>();
  for (const guide of GUIDES) {
    const list = grouped.get(guide.category) || [];
    list.push(guide);
    grouped.set(guide.category, list);
  }

  return (
    <main className="min-h-screen bg-dark-950">
      <section className="border-b border-white/[0.06] px-6 pb-16 pt-32 md:px-12 lg:px-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">
            Retreat Matchmaker
          </p>
          <h1 className="mt-4 font-serif text-4xl font-light text-white md:text-5xl lg:text-6xl">
            Find Your <span className="text-dark-400">Perfect Retreat</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-dark-300">
            We scored 9,400+ retreats across 15 categories. These guides cut through the noise — filtered by what actually matters for your specific goals, budget, and travel style.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          {CATEGORY_ORDER.map((cat) => {
            const guides = grouped.get(cat);
            if (!guides) return null;
            return (
              <div key={cat} className="mb-16 last:mb-0">
                <h2 className="font-serif text-2xl font-light text-white">
                  {CATEGORY_LABELS[cat] || cat}
                </h2>
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {guides.map((g) => (
                    <Link
                      key={g.slug}
                      href={`/guides/${g.slug}`}
                      className="group flex flex-col rounded-2xl border border-white/[0.04] bg-white/[0.02] p-8 transition-all duration-300 hover:border-gold-500/20 hover:bg-white/[0.04]"
                    >
                      <span className="font-serif text-[18px] font-medium text-white group-hover:text-gold-300 transition-colors">
                        {g.title}
                      </span>
                      <span className="mt-3 text-[13px] leading-relaxed text-dark-400">
                        {g.subtitle}
                      </span>
                      <span className="mt-auto pt-6 text-[11px] font-medium uppercase tracking-wider text-gold-500 group-hover:text-gold-400 transition-colors">
                        View Guide →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
