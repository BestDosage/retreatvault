import { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/data/guides";
import { EDITORIAL_GUIDES } from "@/data/editorial-guides";

export const metadata: Metadata = {
  title: "Wellness Retreat Guides | Retreat Vault",
  description: "Guides to finding your perfect wellness retreat. Filtered by goal, budget, travel style, and personality — not marketing hype.",
  alternates: { canonical: "https://www.retreatvault.com/guides" },
};

const CATEGORY_LABELS: Record<string, string> = {
  persona: "By Travel Style",
  budget: "By Budget",
  goal: "By Wellness Goal",
  style: "By Experience",
  // Editorial guide categories
  cost: "Cost & Budget Guides",
  comparison: "Comparison Guides",
  planning: "Planning & Preparation",
  timing: "Timing & Logistics",
};

const CATEGORY_ORDER = ["goal", "persona", "budget", "style", "cost", "comparison", "planning", "timing"];

type GuideItem = {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  isEditorial?: boolean;
};

export default function GuidesIndex() {
  // Combine both guide types into a unified list
  const allGuides: GuideItem[] = [
    ...GUIDES.map((g) => ({
      slug: g.slug,
      title: g.title,
      subtitle: g.subtitle,
      category: g.category,
    })),
    ...EDITORIAL_GUIDES.map((g) => ({
      slug: g.slug,
      title: g.title,
      subtitle: g.subtitle,
      category: g.category,
      isEditorial: true,
    })),
  ];

  const grouped = new Map<string, GuideItem[]>();
  for (const guide of allGuides) {
    const list = grouped.get(guide.category) || [];
    list.push(guide);
    grouped.set(guide.category, list);
  }

  return (
    <main className="min-h-screen bg-cream-50">
      <section className="border-b border-cream-200 px-6 pb-16 pt-32 md:px-12 lg:px-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-sage-700">
            Retreat Matchmaker
          </p>
          <h1 className="mt-4 font-display text-4xl font-light text-ink-900 md:text-5xl lg:text-6xl">
            Find Your <span className="text-ink-500">Perfect Retreat</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-700">
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
                <h2 className="font-display text-2xl font-light text-ink-900">
                  {CATEGORY_LABELS[cat] || cat}
                </h2>
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {guides.map((g) => (
                    <Link
                      key={g.slug}
                      href={`/guides/${g.slug}`}
                      className="group flex flex-col rounded-2xl border border-cream-200 bg-cream-100 p-8 transition-all duration-300 hover:border-sage-700/20 hover:bg-cream-50"
                    >
                      {g.isEditorial && (
                        <span className="mb-2 w-fit rounded-full bg-sage-700/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-sage-700">
                          Guide
                        </span>
                      )}
                      <span className="font-display text-[18px] font-medium text-ink-900 group-hover:text-sage-600 transition-colors">
                        {g.title}
                      </span>
                      <span className="mt-3 text-[13px] leading-relaxed text-ink-500">
                        {g.subtitle}
                      </span>
                      <span className="mt-auto pt-6 text-[11px] font-medium uppercase tracking-wider text-sage-700 group-hover:text-sage-700 transition-colors">
                        {g.isEditorial ? "Read Guide" : "View Guide"} →
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
