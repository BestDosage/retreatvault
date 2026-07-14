import type { Metadata } from "next";

// Refresh once per hour — filter UI uses client-side searchParams so the
// underlying data fetch can be cached safely
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Wellness Retreat Directory — 120+ Retreats Rated & Compared",
  description:
    "Browse every wellness retreat in our vault. Filter by region, price, and specialty. Each retreat scored 0-10 across nutrition, fitness, spa, medical, sleep & 11 more categories.",
};

import { Suspense } from "react";
import { queryRetreatsForDirectory } from "@/lib/data";
import RetreatCard from "@/components/RetreatCard";
import RetreatFilters from "@/components/RetreatFilters";
import AnimateIn, { StaggerContainer, StaggerItem } from "@/components/AnimateIn";

const PAGE_SIZE = 60;

export default async function RetreatsPage({ searchParams }: { searchParams: Promise<{ region?: string; tag?: string; budget?: string; page?: string }> }) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);

  // Query Supabase directly for the 60 rows we need, filters applied
  // server-side. No more bulk-loading 9,409 rows into lambda memory.
  const { retreats: paginated, total } = await queryRetreatsForDirectory({
    region: params.region || null,
    tag: params.tag || null,
    budget: params.budget || null,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  const regionLabel = params.region && params.region !== "All" ? params.region : null;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  // Applied-filters summary — gives researchers the scent of current state.
  // Labels mirror the controls in RetreatFilters.tsx.
  const TAG_LABELS: Record<string, string> = {
    "Best for Burnout": "Burnout Recovery",
    "Best for Longevity": "Longevity",
    "Best for Biohackers": "Biohackers",
    "Best for Couples": "Couples",
    "Best First Retreat": "First Retreat",
    "Best for Fitness": "Fitness",
    "Best for Nutrition": "Nutrition",
    "Best for Spa": "Spa",
    "Best for Meditation": "Meditation",
  };
  const BUDGET_LABELS: Record<string, string> = {
    accessible: "Under $500",
    mid: "$500–$1,500",
    premium: "$1,500–$3,000",
    ultra: "$3,000+",
  };
  const summaryParts = [
    regionLabel,
    params.tag && params.tag !== "all" ? TAG_LABELS[params.tag] || null : null,
    params.budget && params.budget !== "all" ? BUDGET_LABELS[params.budget] || null : null,
  ].filter(Boolean);

  // Build query string preserving filters
  const baseQuery = new URLSearchParams();
  if (params.region) baseQuery.set("region", params.region);
  if (params.tag) baseQuery.set("tag", params.tag);
  if (params.budget) baseQuery.set("budget", params.budget);
  const buildPageUrl = (p: number) => {
    const q = new URLSearchParams(baseQuery);
    if (p > 1) q.set("page", String(p));
    const qs = q.toString();
    return `/retreats${qs ? `?${qs}` : ""}`;
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Wellness Retreat Directory",
    description:
      "Browse 9,400+ wellness retreats scored across 15 categories. Filter by region, price, and specialty on RetreatVault.",
    url: "https://www.retreatvault.com/retreats",
    numberOfItems: total,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: paginated.slice(0, 10).map((retreat, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: retreat.name,
      url: `https://www.retreatvault.com/retreats/${retreat.id}`,
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.retreatvault.com" },
      { "@type": "ListItem", position: 2, name: "Retreats" },
    ],
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
    />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
    />
    <div className="min-h-screen bg-cream-50 pt-28 text-ink-900">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <AnimateIn>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sage-700">Directory</p>
        </AnimateIn>
        <AnimateIn delay={0.1}>
          <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,4rem)] leading-[1.03] tracking-tight text-ink-900">
            {regionLabel ? (
              <>{regionLabel} <span className="text-ink-500">retreats</span></>
            ) : (
              <>All <span className="text-ink-500">retreats</span></>
            )}
          </h1>
        </AnimateIn>
        <AnimateIn delay={0.15}>
          <p className="mt-4 max-w-md text-[14px] leading-relaxed text-ink-700">
            Every property independently scored across 15 weighted categories. No paid placements.
          </p>
        </AnimateIn>

        {/* RetreatFilters is a DIRECT child of the max-width container so its
            position:sticky containing block spans the whole grid. Wrapping it in
            its own short div made that wrapper the containing block and the
            toolbar scrolled away instantly (never stuck). Top spacing lives on
            the toolbar's own root now. */}
        <Suspense fallback={null}>
          <RetreatFilters />
        </Suspense>

        {/* Result count + applied-filters summary — the scent of state */}
        <p className="mt-6 text-sm tabular-nums text-ink-500">
          <span className="font-medium text-ink-700">{total.toLocaleString()}</span>{" "}
          {total === 1 ? "retreat" : "retreats"}
          {summaryParts.length > 0 && (
            <span> · {summaryParts.join(" · ")}</span>
          )}
        </p>

        {paginated.length === 0 ? (
          <div className="py-40 text-center">
            <p className="font-display text-2xl text-ink-700">No retreats match your criteria</p>
            <a href="/retreats" className="mt-6 inline-block text-[11px] font-semibold uppercase tracking-[0.18em] text-sage-700 transition-colors hover:text-sage-600">
              Clear all filters
            </a>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {paginated.map((retreat) => (
                <RetreatCard key={retreat.id} retreat={retreat} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="mt-16 flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[0.15em] text-ink-500">
                {safePage > 1 && (
                  <a href={buildPageUrl(safePage - 1)} className="rounded-full border border-cream-200 px-4 py-2 transition-colors hover:border-sage-600/40 hover:text-sage-700">
                    ← Prev
                  </a>
                )}
                <span className="px-4 py-2 tabular-nums">
                  Page {safePage} of {totalPages}
                </span>
                {safePage < totalPages && (
                  <a href={buildPageUrl(safePage + 1)} className="rounded-full border border-cream-200 px-4 py-2 transition-colors hover:border-sage-600/40 hover:text-sage-700">
                    Next →
                  </a>
                )}
              </nav>
            )}
          </>
        )}

        <div className="pb-28" />
      </div>
    </div>
    </>
  );
}
