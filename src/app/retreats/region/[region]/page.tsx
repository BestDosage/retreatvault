import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllRetreats,
  getRegions,
  getCountriesInRegion,
  slugifyRegion,
  slugifyCountry,
} from "@/lib/data";
import { WellnessRetreat, isScorePublic } from "@/lib/types";
import RetreatCard from "@/components/RetreatCard";
import LocationStats from "@/components/LocationStats";
import { deriveLocationStats } from "@/lib/location-intelligence";

export const revalidate = 3600;
export const dynamicParams = true;

const REGION_DISPLAY: Record<string, string> = {
  usa: "USA",
  europe: "Europe",
  canada: "Canada",
  mexico: "Mexico",
  asia: "Asia",
};

const REGION_INTROS: Record<string, string> = {
  usa: "From the desert canyons of Arizona to the misty coastlines of Big Sur, the United States is home to some of the world's most ambitious wellness retreats. Whether you seek clinical precision or spiritual depth, these properties deliver transformative experiences across every landscape.",
  europe: "Europe's wellness tradition stretches back centuries, from Alpine thermal baths to Mediterranean seaside sanctuaries. The continent offers an unmatched blend of ancient healing wisdom and modern luxury, with retreats set among some of the most beautiful landscapes on earth.",
  canada: "Canada's vast wilderness provides the perfect backdrop for deep restoration. From British Columbia's old-growth forests to Ontario's lakeside escapes, Canadian retreats emphasize nature immersion, holistic health, and a quieter pace of transformation.",
  mexico: "Mexico's wellness scene blends indigenous healing traditions with world-class hospitality. Cenote-fed spas, Pacific-coast yoga shalas, and jungle retreat centers offer powerful experiences rooted in Mesoamerican culture and the country's extraordinary natural beauty.",
  asia: "Asia is the spiritual heartland of global wellness. From Ayurvedic traditions in India and Sri Lanka to Thai healing arts and Balinese ceremony, the continent offers the deepest roots and most diverse modalities of any region in the world.",
};

type Params = { region: string };

// No generateStaticParams — only 5 regions, render on-demand via dynamicParams + ISR

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { region } = await params;
  const displayName = REGION_DISPLAY[region] || region;
  return {
    title: `Best Wellness Retreats in ${displayName} | Retreat Vault`,
    description: `Explore ${displayName}'s top-rated wellness retreats, scored and ranked by Retreat Vault. Compare programs, prices, and reviews across every country in ${displayName}.`,
    alternates: { canonical: `https://www.retreatvault.com/retreats/region/${region}` },
  };
}

function BreadcrumbJsonLd({ region, displayName }: { region: string; displayName: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.retreatvault.com" },
      { "@type": "ListItem", position: 2, name: "Retreats", item: "https://www.retreatvault.com/retreats" },
      { "@type": "ListItem", position: 3, name: `${displayName} Retreats`, item: `https://www.retreatvault.com/retreats/region/${region}` },
    ],
  };
  return (
    <script
      type="application/ld+json"
      // Safe: data is built from static strings and known-safe slugs, not user input
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function RegionPage({ params }: { params: Promise<Params> }) {
  const { region } = await params;
  const displayName = REGION_DISPLAY[region];
  if (!displayName) notFound();

  const allRetreats = await getAllRetreats();
  const regionRetreats = allRetreats.filter(
    (r) => slugifyRegion(r.region) === region
  );
  if (regionRetreats.length === 0) notFound();

  const countries = getCountriesInRegion(allRetreats, region);
  const top12 = regionRetreats.slice(0, 12);
  const intro = REGION_INTROS[region] || "";
  const stats = deriveLocationStats(regionRetreats);

  // Group all retreats by country for the compact list
  const byCountry = new Map<string, WellnessRetreat[]>();
  regionRetreats.forEach((r) => {
    const list = byCountry.get(r.country) || [];
    list.push(r);
    byCountry.set(r.country, list);
  });

  return (
    <>
      <BreadcrumbJsonLd region={region} displayName={displayName} />

      <main className="min-h-screen bg-cream-50">
        {/* Hero */}
        <section className="border-b border-cream-200 px-6 pb-16 pt-32 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            {/* Breadcrumb */}
            <nav className="mb-8 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink-500">
              <a href="/" className="transition-colors hover:text-sage-700">Home</a>
              <span className="text-cream-200">/</span>
              <a href="/retreats" className="transition-colors hover:text-sage-700">Retreats</a>
              <span className="text-cream-200">/</span>
              <span className="text-ink-700">{displayName}</span>
            </nav>

            <h1 className="font-display text-4xl font-light text-ink-900 md:text-5xl lg:text-6xl">
              Wellness Retreats in {displayName}
            </h1>
            <p className="mt-4 text-lg text-ink-500">
              {regionRetreats.length} retreats across {countries.length} {countries.length === 1 ? "country" : "countries"}
            </p>
            {intro && (
              <p className="mt-6 max-w-3xl text-[15px] leading-relaxed text-ink-700">
                {intro}
              </p>
            )}
          </div>
        </section>

        {/* Location intelligence */}
        <section className="border-b border-cream-200 px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-sage-700">Market Intelligence</p>
            <h2 className="mt-3 font-display text-2xl font-light text-ink-900">
              {displayName} at a Glance
            </h2>
            <div className="mt-8">
              <LocationStats stats={stats} locationName={displayName} />
            </div>
          </div>
        </section>

        {/* Countries in this region */}
        <section className="border-b border-cream-200 px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display text-2xl font-light text-ink-900">
              Countries in {displayName}
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {countries.map((c) => (
                <a
                  key={c.slug}
                  href={`/retreats/country/${c.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-cream-200 bg-cream-100 px-5 py-4 transition-all hover:border-sage-700/30 hover:bg-cream-50"
                >
                  <span className="font-display text-[15px] text-ink-900 group-hover:text-sage-700 transition-colors">
                    {c.country}
                  </span>
                  <span className="ml-3 text-[12px] text-ink-500">
                    {c.count}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Top 12 retreat cards */}
        <section className="border-b border-cream-200 px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display text-2xl font-light text-ink-900">
              Top Retreats in {displayName}
            </h2>
            <p className="mt-2 text-[13px] text-ink-700">
              Ranked by Retreat Vault score
            </p>
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {top12.map((retreat) => (
                <RetreatCard key={retreat.slug} retreat={retreat} />
              ))}
            </div>
          </div>
        </section>

        {/* Complete directory — compact list grouped by country */}
        <section className="px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display text-2xl font-light text-ink-900">
              Complete {displayName} Directory
            </h2>
            <p className="mt-2 text-[13px] text-ink-700">
              Every retreat in {displayName}, organized by country
            </p>

            {Array.from(byCountry.entries())
              .sort(([, a], [, b]) => b.length - a.length)
              .map(([country, retreats]) => (
                <div key={country} className="mt-10">
                  <div className="flex items-center gap-4">
                    <h3 className="font-display text-lg text-sage-700">
                      <a
                        href={`/retreats/country/${slugifyCountry(country)}`}
                        className="hover:text-sage-600 transition-colors"
                      >
                        {country}
                      </a>
                    </h3>
                    <span className="text-[11px] text-ink-500">
                      {retreats.length} {retreats.length === 1 ? "retreat" : "retreats"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {retreats.map((r) => (
                      <a
                        key={r.slug}
                        href={`/retreats/${r.slug}`}
                        className="group flex flex-col gap-1 rounded-xl border border-cream-200 bg-cream-100 p-4 transition-all hover:border-sage-700/20 hover:bg-cream-50 md:flex-row md:items-center md:gap-6 md:rounded-none md:border-0 md:border-b md:bg-transparent md:px-0 md:py-3"
                      >
                        <span className="text-[14px] font-medium text-ink-900 group-hover:text-sage-700 transition-colors md:flex-1">
                          {r.name}
                        </span>
                        <span className="text-[13px] text-ink-700 md:w-40">
                          {r.city}
                        </span>
                        <div className="flex items-center justify-between md:contents">
                          <span className="font-display text-[14px] text-sage-700 md:w-20 md:text-right">
                            {isScorePublic(r.wrd_score) ? r.wrd_score.toFixed(1) : "Listed"}
                          </span>
                          <span className="text-[13px] text-ink-700 md:w-48 md:text-right">
                            ${r.price_min_per_night.toLocaleString()}
                            {r.price_min_per_night !== r.price_max_per_night && (
                              <span className="text-ink-500">
                                &ndash;${r.price_max_per_night.toLocaleString()}
                              </span>
                            )}
                            <span className="ml-1 text-[11px] text-ink-500">/night</span>
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </section>
      </main>
    </>
  );
}
