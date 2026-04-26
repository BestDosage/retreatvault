import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllRetreats,
  getAllCountries,
  getCountriesInRegion,
  slugifyRegion,
  slugifyCountry,
} from "@/lib/data";
import { WellnessRetreat } from "@/lib/types";
import RetreatCard from "@/components/RetreatCard";
import LocationStats from "@/components/LocationStats";
import { deriveLocationStats } from "@/lib/location-intelligence";
import { getCountrySEO, CountrySEOData } from "@/data/country-seo";

export const revalidate = 86400;
export const dynamicParams = true;

type Params = { country: string };

// No generateStaticParams — render on-demand via dynamicParams + ISR

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { country: countrySlug } = await params;
  const retreats = await getAllRetreats();
  const countries = getAllCountries(retreats);
  const match = countries.find((c) => c.slug === countrySlug);
  const displayName = match?.country || countrySlug;

  return {
    title: `Best Wellness Retreats in ${displayName} | Retreat Vault`,
    description: `Discover ${match?.count || ""} top-rated wellness retreats in ${displayName}. Compare scores, prices, and reviews to find your perfect retreat.`,
    alternates: { canonical: `https://www.retreatvault.com/retreats/country/${countrySlug}` },
  };
}

function BreadcrumbJsonLd({
  countrySlug,
  countryName,
  regionSlug,
  regionName,
}: {
  countrySlug: string;
  countryName: string;
  regionSlug: string;
  regionName: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.retreatvault.com" },
      { "@type": "ListItem", position: 2, name: "Retreats", item: "https://www.retreatvault.com/retreats" },
      { "@type": "ListItem", position: 3, name: `${regionName} Retreats`, item: `https://www.retreatvault.com/retreats/region/${regionSlug}` },
      { "@type": "ListItem", position: 4, name: `${countryName} Retreats`, item: `https://www.retreatvault.com/retreats/country/${countrySlug}` },
    ],
  };
  // JSON-LD structured data built entirely from known static slugs, not user input
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function FAQJsonLd({ seoData }: { seoData: CountrySEOData }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: seoData.faqItems.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
  // Safe: data sourced from static country-seo.ts file, not user input
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function CountrySEOContent({
  seoData,
  countryName,
  retreatCount,
  priceStats,
  typeCounts,
}: {
  seoData: CountrySEOData;
  countryName: string;
  retreatCount: number;
  priceStats: { min: number; max: number; avg: number };
  typeCounts: { type: string; count: number }[];
}) {
  return (
    <>
      {/* About section */}
      <section className="border-b border-white/[0.06] px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Destination Guide</p>
          <h2 className="mt-3 font-serif text-2xl font-light text-white">
            Why {countryName} for a Wellness Retreat
          </h2>
          <div className="mt-6 max-w-3xl space-y-4">
            {seoData.description.map((paragraph, i) => (
              <p key={i} className="text-[15px] leading-relaxed text-dark-300">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Cost + Best Time + Types grid */}
      <section className="border-b border-white/[0.06] px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Cost Overview */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-500">Cost Overview</p>
              <h3 className="mt-2 font-serif text-lg text-white">Budget Guide</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-dark-300">
                {seoData.avgBudget}
              </p>
              {priceStats.avg > 0 && (
                <div className="mt-4 border-t border-white/[0.06] pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-dark-400">From data ({retreatCount} retreats)</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-serif text-2xl text-gold-400">${priceStats.avg.toLocaleString()}</span>
                    <span className="text-[12px] text-dark-400">avg/night</span>
                  </div>
                  <p className="mt-1 text-[12px] text-dark-500">
                    Range: ${priceStats.min.toLocaleString()} &ndash; ${priceStats.max.toLocaleString()}/night
                  </p>
                </div>
              )}
            </div>

            {/* Best Time to Visit */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-500">When to Go</p>
              <h3 className="mt-2 font-serif text-lg text-white">Best Time to Visit</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-dark-300">
                {seoData.bestTimeToVisit}
              </p>
            </div>

            {/* Popular Retreat Types */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-500">Retreat Types</p>
              <h3 className="mt-2 font-serif text-lg text-white">Popular in {countryName}</h3>
              <div className="mt-4 space-y-2">
                {seoData.topTypes.map((type) => {
                  const match = typeCounts.find(
                    (t) => t.type.toLowerCase() === type.toLowerCase()
                  );
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-[14px] text-dark-300">{type}</span>
                      {match && (
                        <span className="text-[12px] text-dark-500">{match.count} retreats</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-b border-white/[0.06] px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Common Questions</p>
          <h2 className="mt-3 font-serif text-2xl font-light text-white">
            FAQ: Wellness Retreats in {countryName}
          </h2>
          <div className="mt-8 max-w-3xl space-y-6">
            {seoData.faqItems.map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] open:bg-white/[0.04]"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-5 text-[15px] font-medium text-white transition-colors hover:text-gold-400">
                  {faq.question}
                  <span className="ml-4 text-dark-500 transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="px-6 pb-5">
                  <p className="text-[14px] leading-relaxed text-dark-300">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default async function CountryPage({ params }: { params: Promise<Params> }) {
  const { country: countrySlug } = await params;
  const allRetreats = await getAllRetreats();
  const countries = getAllCountries(allRetreats);
  const match = countries.find((c) => c.slug === countrySlug);
  if (!match) notFound();

  const { country: countryName, region: regionName } = match;
  const regionSlug = slugifyRegion(regionName);

  const countryRetreats = allRetreats.filter(
    (r) => slugifyCountry(r.country) === countrySlug
  );
  if (countryRetreats.length === 0) notFound();

  // Sibling countries in the same region
  const siblingCountries = getCountriesInRegion(allRetreats, regionName).filter(
    (c) => c.slug !== countrySlug
  );

  // Group retreats by city
  const byCity = new Map<string, WellnessRetreat[]>();
  countryRetreats.forEach((r) => {
    const city = r.city || "Other";
    const list = byCity.get(city) || [];
    list.push(r);
    byCity.set(city, list);
  });

  const stats = deriveLocationStats(countryRetreats);
  const useCards = countryRetreats.length <= 30;

  // SEO content for top countries
  const seoData = getCountrySEO(countrySlug);

  // Derive price stats from actual data
  const prices = countryRetreats
    .map((r) => (r.price_min_per_night + r.price_max_per_night) / 2)
    .filter((p) => p > 0);
  const priceStats = {
    min: prices.length > 0 ? Math.round(Math.min(...prices)) : 0,
    max: prices.length > 0 ? Math.round(Math.max(...prices)) : 0,
    avg: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
  };

  // Derive type counts from actual data
  const typeCountMap = new Map<string, number>();
  for (const r of countryRetreats) {
    for (const tag of [...(r.program_types || []), ...(r.specialty_tags || [])]) {
      typeCountMap.set(tag, (typeCountMap.get(tag) || 0) + 1);
    }
  }
  const typeCounts = Array.from(typeCountMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <>
      <BreadcrumbJsonLd
        countrySlug={countrySlug}
        countryName={countryName}
        regionSlug={regionSlug}
        regionName={regionName}
      />
      {seoData && <FAQJsonLd seoData={seoData} />}

      <main className="min-h-screen bg-dark-950">
        {/* Hero */}
        <section className="border-b border-white/[0.06] px-6 pb-16 pt-32 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            {/* Breadcrumb */}
            <nav className="mb-8 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-dark-400">
              <a href="/" className="transition-colors hover:text-gold-400">Home</a>
              <span className="text-dark-700">/</span>
              <a href="/retreats" className="transition-colors hover:text-gold-400">Retreats</a>
              <span className="text-dark-700">/</span>
              <a href={`/retreats/region/${regionSlug}`} className="transition-colors hover:text-gold-400">
                {regionName}
              </a>
              <span className="text-dark-700">/</span>
              <span className="text-dark-300">{countryName}</span>
            </nav>

            <h1 className="font-serif text-4xl font-light text-white md:text-5xl lg:text-6xl">
              Wellness Retreats in {countryName}
            </h1>
            <p className="mt-4 text-lg text-dark-400">
              {countryRetreats.length} {countryRetreats.length === 1 ? "retreat" : "retreats"} across {byCity.size} {byCity.size === 1 ? "city" : "cities"}
            </p>
          </div>
        </section>

        {/* Location intelligence */}
        <section className="border-b border-white/[0.06] px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Market Intelligence</p>
            <h2 className="mt-3 font-serif text-2xl font-light text-white">
              {countryName} Wellness Market
            </h2>
            <div className="mt-8">
              <LocationStats stats={stats} locationName={countryName} />
            </div>
          </div>
        </section>

        {/* SEO content sections (top 15 countries) */}
        {seoData && (
          <CountrySEOContent
            seoData={seoData}
            countryName={countryName}
            retreatCount={countryRetreats.length}
            priceStats={priceStats}
            typeCounts={typeCounts}
          />
        )}

        {/* Main content */}
        {useCards ? (
          /* Card view for smaller collections */
          <>
            {Array.from(byCity.entries())
              .sort(([, a], [, b]) => b.length - a.length)
              .map(([city, retreats]) => (
                <section
                  key={city}
                  className="border-b border-white/[0.06] px-6 py-16 md:px-12 lg:px-20"
                >
                  <div className="mx-auto max-w-7xl">
                    {byCity.size > 1 && (
                      <div className="mb-8 flex items-center gap-4">
                        <h2 className="font-serif text-xl font-light text-gold-400">
                          {city}
                        </h2>
                        <span className="text-[11px] text-dark-400">
                          {retreats.length} {retreats.length === 1 ? "retreat" : "retreats"}
                        </span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {retreats.map((retreat) => (
                        <RetreatCard key={retreat.slug} retreat={retreat} />
                      ))}
                    </div>
                  </div>
                </section>
              ))}
          </>
        ) : (
          /* Compact list view for larger collections */
          <section className="px-6 py-16 md:px-12 lg:px-20">
            <div className="mx-auto max-w-7xl">
              {Array.from(byCity.entries())
                .sort(([, a], [, b]) => b.length - a.length)
                .map(([city, retreats]) => (
                  <div key={city} className="mt-10 first:mt-0">
                    {byCity.size > 1 && (
                      <div className="flex items-center gap-4 mb-4">
                        <h2 className="font-serif text-lg text-gold-400">
                          {city}
                        </h2>
                        <span className="text-[11px] text-dark-400">
                          {retreats.length} {retreats.length === 1 ? "retreat" : "retreats"}
                        </span>
                      </div>
                    )}
                    <div className="space-y-2">
                      {retreats.map((r) => (
                        <a
                          key={r.slug}
                          href={`/retreats/${r.slug}`}
                          className="group flex flex-col gap-1 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all hover:border-gold-400/20 hover:bg-white/[0.04] md:flex-row md:items-center md:gap-6 md:rounded-none md:border-0 md:border-b md:bg-transparent md:px-0 md:py-3"
                        >
                          <span className="text-[14px] font-medium text-white group-hover:text-gold-400 transition-colors md:flex-1">
                            {r.name}
                          </span>
                          <span className="text-[13px] text-dark-300 md:w-40">
                            {r.city}
                          </span>
                          <div className="flex items-center justify-between md:contents">
                            <span className="font-serif text-[14px] text-gold-400 md:w-20 md:text-right">
                              {r.wrd_score.toFixed(1)}
                            </span>
                            <span className="text-[13px] text-dark-200 md:w-48 md:text-right">
                              ${r.price_min_per_night.toLocaleString()}
                              {r.price_min_per_night !== r.price_max_per_night && (
                                <span className="text-dark-400">
                                  &ndash;${r.price_max_per_night.toLocaleString()}
                                </span>
                              )}
                              <span className="ml-1 text-[11px] text-dark-400">/night</span>
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Cross-link to other countries in the same region */}
        {siblingCountries.length > 0 && (
          <section className="border-t border-white/[0.06] px-6 py-16 md:px-12 lg:px-20">
            <div className="mx-auto max-w-7xl">
              <h2 className="font-serif text-2xl font-light text-white">
                More Countries in {regionName}
              </h2>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {siblingCountries.map((c) => (
                  <a
                    key={c.slug}
                    href={`/retreats/country/${c.slug}`}
                    className="group flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition-all hover:border-gold-400/30 hover:bg-white/[0.04]"
                  >
                    <span className="font-serif text-[15px] text-white group-hover:text-gold-400 transition-colors">
                      {c.country}
                    </span>
                    <span className="ml-3 text-[12px] text-dark-400">
                      {c.count}
                    </span>
                  </a>
                ))}
              </div>
              <div className="mt-8">
                <a
                  href={`/retreats/region/${regionSlug}`}
                  className="text-[13px] text-dark-400 hover:text-gold-400 transition-colors"
                >
                  &larr; View all {regionName} retreats
                </a>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
