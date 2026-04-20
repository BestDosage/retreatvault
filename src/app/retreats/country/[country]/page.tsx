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

  const useCards = countryRetreats.length <= 30;

  return (
    <>
      <BreadcrumbJsonLd
        countrySlug={countrySlug}
        countryName={countryName}
        regionSlug={regionSlug}
        regionName={regionName}
      />

      <main className="min-h-screen bg-dark-950">
        {/* Hero */}
        <section className="border-b border-white/[0.06] px-6 pb-16 pt-32 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            {/* Breadcrumb */}
            <nav className="mb-8 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-dark-500">
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
                        <span className="text-[11px] text-dark-600">
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
                        <span className="text-[11px] text-dark-600">
                          {retreats.length} {retreats.length === 1 ? "retreat" : "retreats"}
                        </span>
                      </div>
                    )}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.2em] text-dark-600">
                            <th className="pb-3 pr-6 font-medium">Name</th>
                            <th className="pb-3 pr-6 font-medium">City</th>
                            <th className="pb-3 pr-6 font-medium text-right">Score</th>
                            <th className="pb-3 pr-6 font-medium text-right">Price</th>
                            <th className="pb-3 font-medium" />
                          </tr>
                        </thead>
                        <tbody>
                          {retreats.map((r) => (
                            <tr
                              key={r.slug}
                              className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]"
                            >
                              <td className="py-3 pr-6">
                                <a
                                  href={`/retreats/${r.slug}`}
                                  className="text-[14px] font-medium text-white hover:text-gold-400 transition-colors"
                                >
                                  {r.name}
                                </a>
                              </td>
                              <td className="py-3 pr-6 text-[13px] text-dark-400">
                                {r.city}
                              </td>
                              <td className="py-3 pr-6 text-right">
                                <span className="font-serif text-[14px] text-gold-400">
                                  {r.wrd_score.toFixed(1)}
                                </span>
                              </td>
                              <td className="py-3 pr-6 text-right text-[13px] text-dark-300">
                                ${r.price_min_per_night.toLocaleString()}
                                {r.price_min_per_night !== r.price_max_per_night && (
                                  <span className="text-dark-500">
                                    &ndash;${r.price_max_per_night.toLocaleString()}
                                  </span>
                                )}
                                <span className="ml-1 text-[10px] text-dark-600">/night</span>
                              </td>
                              <td className="py-3 text-right">
                                <a
                                  href={`/retreats/${r.slug}`}
                                  className="text-[11px] text-dark-500 hover:text-gold-400 transition-colors"
                                >
                                  View full review &rarr;
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                    <span className="ml-3 text-[12px] text-dark-500">
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
