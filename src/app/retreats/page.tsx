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
    <div className="min-h-screen pt-28">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <AnimateIn>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-500">Directory</p>
        </AnimateIn>
        <AnimateIn delay={0.1}>
          <h1 className="mt-4 font-serif text-5xl font-light text-white sm:text-6xl">
            {regionLabel ? (
              <>{regionLabel} <span className="text-dark-400">Retreats</span></>
            ) : (
              <>All <span className="text-dark-400">Retreats</span></>
            )}
          </h1>
        </AnimateIn>
        <AnimateIn delay={0.15}>
          <p className="mt-4 text-[13px] text-dark-400">
            {total.toLocaleString()} retreat{total !== 1 ? "s" : ""} independently scored and ranked
          </p>
        </AnimateIn>

        <div className="mt-10">
          <Suspense fallback={null}>
            <RetreatFilters />
          </Suspense>
        </div>

        {paginated.length === 0 ? (
          <div className="py-40 text-center">
            <p className="font-serif text-2xl text-dark-400">No retreats match your criteria</p>
            <a href="/retreats" className="mt-6 inline-block text-[11px] uppercase tracking-wider text-gold-400 hover:text-gold-300">
              Clear all filters
            </a>
          </div>
        ) : (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginated.map((retreat) => (
                <RetreatCard key={retreat.id} retreat={retreat} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="mt-16 flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider text-dark-400">
                {safePage > 1 && (
                  <a href={buildPageUrl(safePage - 1)} className="rounded border border-dark-700 px-4 py-2 hover:border-gold-500 hover:text-gold-300">
                    ← Prev
                  </a>
                )}
                <span className="px-4 py-2">
                  Page {safePage} of {totalPages}
                </span>
                {safePage < totalPages && (
                  <a href={buildPageUrl(safePage + 1)} className="rounded border border-dark-700 px-4 py-2 hover:border-gold-500 hover:text-gold-300">
                    Next →
                  </a>
                )}
              </nav>
            )}
          </>
        )}

        <div className="pb-20" />
      </div>
    </div>
    </>
  );
}
