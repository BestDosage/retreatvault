import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllRetreats,
  getAllCities,
  slugifyCity,
  slugifyCountry,
  slugifyRegion,
} from "@/lib/data";
import RetreatCard from "@/components/RetreatCard";
import LocationStats from "@/components/LocationStats";
import { deriveLocationStats } from "@/lib/location-intelligence";

export const revalidate = 86400;
export const dynamicParams = true;

type Params = { city: string };

// No generateStaticParams — render all city pages on-demand via ISR
// This avoids Supabase timeout during build and OOM on Vercel

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { city: citySlug } = await params;
  const retreats = await getAllRetreats();
  const cities = getAllCities(retreats);
  const match = cities.find((c) => c.slug === citySlug);
  if (!match) return { title: "City Not Found" };

  return {
    title: `Best Wellness Retreats in ${match.city}, ${match.country} | Retreat Vault`,
    description: `Discover ${match.count} top-rated wellness retreats in ${match.city}. Compare scores, prices, and specialties to find your perfect retreat in ${match.city}.`,
    alternates: { canonical: `https://www.retreatvault.com/retreats/city/${citySlug}` },
  };
}

// JSON-LD structured data built entirely from known static slugs, not user input
function BreadcrumbJsonLd({
  citySlug,
  cityName,
  countrySlug,
  countryName,
  regionSlug,
  regionName,
}: {
  citySlug: string;
  cityName: string;
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
      { "@type": "ListItem", position: 5, name: `${cityName} Retreats`, item: `https://www.retreatvault.com/retreats/city/${citySlug}` },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function CityPage({ params }: { params: Promise<Params> }) {
  const { city: citySlug } = await params;
  const allRetreats = await getAllRetreats();
  const cities = getAllCities(allRetreats);
  const match = cities.find((c) => c.slug === citySlug);
  if (!match) notFound();

  const { city: cityName, country: countryName, region: regionName } = match;
  const countrySlug = slugifyCountry(countryName);
  const regionSlug = slugifyRegion(regionName);

  const cityRetreats = allRetreats.filter(
    (r) => slugifyCity(r.city) === citySlug
  );
  if (cityRetreats.length === 0) notFound();

  // Other cities in the same country for cross-linking
  const siblingCities = cities.filter(
    (c) => slugifyCountry(c.country) === countrySlug && c.slug !== citySlug
  );

  const stats = deriveLocationStats(cityRetreats);

  return (
    <>
      <BreadcrumbJsonLd
        citySlug={citySlug}
        cityName={cityName}
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
            <nav className="mb-8 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-dark-400">
              <a href="/" className="transition-colors hover:text-gold-400">Home</a>
              <span className="text-dark-700">/</span>
              <a href="/retreats" className="transition-colors hover:text-gold-400">Retreats</a>
              <span className="text-dark-700">/</span>
              <a href={`/retreats/region/${regionSlug}`} className="transition-colors hover:text-gold-400">
                {regionName}
              </a>
              <span className="text-dark-700">/</span>
              <a href={`/retreats/country/${countrySlug}`} className="transition-colors hover:text-gold-400">
                {countryName}
              </a>
              <span className="text-dark-700">/</span>
              <span className="text-dark-300">{cityName}</span>
            </nav>

            <h1 className="font-serif text-4xl font-light text-white md:text-5xl lg:text-6xl">
              Wellness Retreats in {cityName}
            </h1>
            <p className="mt-4 text-lg text-dark-400">
              {cityRetreats.length} {cityRetreats.length === 1 ? "retreat" : "retreats"} in {cityName}, {countryName}
            </p>
          </div>
        </section>

        {/* Location intelligence */}
        <section className="border-b border-white/[0.06] px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Market Intelligence</p>
            <h2 className="mt-3 font-serif text-2xl font-light text-white">
              {cityName} Wellness Market
            </h2>
            <div className="mt-8">
              <LocationStats stats={stats} locationName={cityName} />
            </div>
          </div>
        </section>

        {/* Retreat cards */}
        <section className="border-b border-white/[0.06] px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cityRetreats.map((retreat) => (
                <RetreatCard key={retreat.slug} retreat={retreat} />
              ))}
            </div>
          </div>
        </section>

        {/* Cross-link to other cities in the same country */}
        {siblingCities.length > 0 && (
          <section className="border-t border-white/[0.06] px-6 py-16 md:px-12 lg:px-20">
            <div className="mx-auto max-w-7xl">
              <h2 className="font-serif text-2xl font-light text-white">
                More Cities in {countryName}
              </h2>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {siblingCities.map((c) => (
                  <a
                    key={c.slug}
                    href={`/retreats/city/${c.slug}`}
                    className="group flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition-all hover:border-gold-400/30 hover:bg-white/[0.04]"
                  >
                    <span className="font-serif text-[15px] text-white group-hover:text-gold-400 transition-colors">
                      {c.city}
                    </span>
                    <span className="ml-3 text-[12px] text-dark-400">
                      {c.count}
                    </span>
                  </a>
                ))}
              </div>
              <div className="mt-8">
                <a
                  href={`/retreats/country/${countrySlug}`}
                  className="text-[13px] text-dark-400 hover:text-gold-400 transition-colors"
                >
                  &larr; View all {countryName} retreats
                </a>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
