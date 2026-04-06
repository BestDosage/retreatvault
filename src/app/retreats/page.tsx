import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wellness Retreat Directory — 120+ Retreats Rated & Compared",
  description:
    "Browse every wellness retreat in our vault. Filter by region, price, and specialty. Each retreat scored 0-10 across nutrition, fitness, spa, medical, sleep & 11 more categories.",
};

import { Suspense } from "react";
import { getAllRetreats } from "@/lib/data";
import RetreatCard from "@/components/RetreatCard";
import RetreatFilters from "@/components/RetreatFilters";
import AnimateIn, { StaggerContainer, StaggerItem } from "@/components/AnimateIn";
import { WellnessRetreat } from "@/lib/types";

function filterAndSort(retreats: WellnessRetreat[], region: string | null, tier: string | null, sort: string | null): WellnessRetreat[] {
  let f = [...retreats];
  if (region && region !== "All") f = f.filter((r) => r.region === region);
  if (tier && tier !== "all") {
    const min: Record<string, number> = { elite: 9.0, exceptional: 8.0, highly_recommended: 7.0 };
    f = f.filter((r) => r.wrd_score >= (min[tier] || 0));
  }
  switch (sort) {
    case "score_asc": f.sort((a, b) => a.wrd_score - b.wrd_score); break;
    case "price_asc": f.sort((a, b) => a.price_min_per_night - b.price_min_per_night); break;
    case "price_desc": f.sort((a, b) => b.price_max_per_night - a.price_max_per_night); break;
    case "rating_desc": f.sort((a, b) => b.google_rating - a.google_rating); break;
    default: f.sort((a, b) => b.wrd_score - a.wrd_score);
  }
  return f;
}

export default async function RetreatsPage({ searchParams }: { searchParams: Promise<{ region?: string; tier?: string; sort?: string }> }) {
  const params = await searchParams;
  const all = await getAllRetreats();
  const filtered = filterAndSort(all, params.region || null, params.tier || null, params.sort || null);
  const regionLabel = params.region && params.region !== "All" ? params.region : null;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Wellness Retreat Directory",
    description:
      "Browse 120+ wellness retreats scored across 15 categories. Filter by region, price, and specialty on RetreatVault.",
    url: "https://www.retreatvault.com/retreats",
    numberOfItems: filtered.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: filtered.slice(0, 10).map((retreat, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: retreat.name,
      url: `https://www.retreatvault.com/retreats/${retreat.id}`,
    })),
  };

  return (
    <>
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
            {filtered.length} retreat{filtered.length !== 1 ? "s" : ""} independently scored and ranked
          </p>
        </AnimateIn>

        <div className="mt-10">
          <Suspense fallback={null}>
            <RetreatFilters />
          </Suspense>
        </div>

        {filtered.length === 0 ? (
          <div className="py-40 text-center">
            <p className="font-serif text-2xl text-dark-400">No retreats match your criteria</p>
            <a href="/retreats" className="mt-6 inline-block text-[11px] uppercase tracking-wider text-gold-400 hover:text-gold-300">
              Clear all filters
            </a>
          </div>
        ) : (
          <StaggerContainer className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" staggerDelay={0.08}>
            {filtered.map((retreat) => (
              <StaggerItem key={retreat.id}>
                <RetreatCard retreat={retreat} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        <div className="pb-20" />
      </div>
    </div>
    </>
  );
}
