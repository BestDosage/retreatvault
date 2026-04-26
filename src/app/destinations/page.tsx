import { Metadata } from "next";
import {
  getAllRetreats,
  getAllCountries,
  slugifyRegion,
  slugifyCountry,
} from "@/lib/data";
import { WellnessRetreat } from "@/lib/types";
import { getCountrySEO } from "@/data/country-seo";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Wellness Retreat Destinations Around the World | Retreat Vault",
  description:
    "Explore wellness retreat destinations across Asia, Europe, Central America, South America, North America, Africa, and Oceania. Compare countries by retreat count, average price, and top retreat types.",
  alternates: { canonical: "https://www.retreatvault.com/destinations" },
};

const REGION_ORDER = [
  "Asia",
  "Central America",
  "Europe",
  "North America",
  "South America",
  "Africa",
  "Oceania",
];

/** Map raw region values to display-friendly names */
function normalizeRegion(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower === "usa" || lower === "canada") return "North America";
  if (lower === "mexico") return "Central America";
  return raw;
}

interface CountryCard {
  country: string;
  slug: string;
  count: number;
  avgPrice: number;
  topType: string;
  region: string;
}

function deriveCountryCards(retreats: WellnessRetreat[]): CountryCard[] {
  const map = new Map<
    string,
    { country: string; slug: string; region: string; prices: number[]; typeCounts: Map<string, number> }
  >();

  for (const r of retreats) {
    const slug = slugifyCountry(r.country);
    let entry = map.get(slug);
    if (!entry) {
      entry = {
        country: r.country,
        slug,
        region: normalizeRegion(r.region),
        prices: [],
        typeCounts: new Map(),
      };
      map.set(slug, entry);
    }

    const avg = (r.price_min_per_night + r.price_max_per_night) / 2;
    if (avg > 0) entry.prices.push(avg);

    for (const tag of r.program_types || []) {
      entry.typeCounts.set(tag, (entry.typeCounts.get(tag) || 0) + 1);
    }
    for (const tag of r.specialty_tags || []) {
      entry.typeCounts.set(tag, (entry.typeCounts.get(tag) || 0) + 1);
    }
  }

  return Array.from(map.values()).map((e) => {
    const avgPrice =
      e.prices.length > 0
        ? Math.round(e.prices.reduce((a, b) => a + b, 0) / e.prices.length)
        : 0;
    let topType = "Wellness";
    let topCount = 0;
    for (const [type, count] of e.typeCounts) {
      if (count > topCount) {
        topCount = count;
        topType = type;
      }
    }
    return {
      country: e.country,
      slug: e.slug,
      count: e.prices.length || 0,
      avgPrice,
      topType,
      region: e.region,
    };
  });
}

// JSON-LD: all data is derived from known database values, not user input
function BreadcrumbJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.retreatvault.com" },
      { "@type": "ListItem", position: 2, name: "Destinations", item: "https://www.retreatvault.com/destinations" },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// JSON-LD: all data is derived from known database values and static strings
function CollectionPageJsonLd({ totalRetreats, countries }: { totalRetreats: number; countries: CountryCard[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Wellness Retreat Destinations Around the World",
    description: `Explore ${countries.length} countries with ${totalRetreats.toLocaleString()} wellness retreats worldwide.`,
    url: "https://www.retreatvault.com/destinations",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: countries.length,
      itemListElement: countries.slice(0, 20).map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `Wellness Retreats in ${c.country}`,
        url: `https://www.retreatvault.com/retreats/country/${c.slug}`,
      })),
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function DestinationsPage() {
  const allRetreats = await getAllRetreats();
  const countries = deriveCountryCards(allRetreats);
  const totalRetreats = allRetreats.length;

  // Fix counts using the canonical getAllCountries
  const canonicalCountries = getAllCountries(allRetreats);
  const countMap = new Map(canonicalCountries.map((c) => [c.slug, c.count]));
  for (const card of countries) {
    card.count = countMap.get(card.slug) || card.count;
  }

  // Group by region
  const byRegion = new Map<string, CountryCard[]>();
  for (const region of REGION_ORDER) {
    byRegion.set(region, []);
  }
  for (const card of countries) {
    const regionList = byRegion.get(card.region);
    if (regionList) {
      regionList.push(card);
    } else {
      // Unknown region fallback
      const other = byRegion.get("Oceania") || [];
      other.push(card);
      byRegion.set("Oceania", other);
    }
  }
  // Sort each region's countries by count descending
  for (const [, list] of byRegion) {
    list.sort((a, b) => b.count - a.count);
  }

  const totalCountries = countries.length;

  return (
    <>
      <BreadcrumbJsonLd />
      <CollectionPageJsonLd totalRetreats={totalRetreats} countries={countries.sort((a, b) => b.count - a.count)} />

      <main className="min-h-screen bg-dark-950">
        {/* Hero */}
        <section className="border-b border-white/[0.06] px-6 pb-16 pt-32 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <nav className="mb-8 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-dark-400">
              <a href="/" className="transition-colors hover:text-gold-400">Home</a>
              <span className="text-dark-700">/</span>
              <span className="text-dark-300">Destinations</span>
            </nav>

            <h1 className="font-serif text-4xl font-light text-white md:text-5xl lg:text-6xl">
              Wellness Retreat Destinations Around the World
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-dark-400">
              {totalRetreats.toLocaleString()} retreats across {totalCountries} countries, scored and ranked by Retreat Vault.
              Find your perfect destination by region, budget, or retreat type.
            </p>
          </div>
        </section>

        {/* Quick region nav */}
        <section className="border-b border-white/[0.06] px-6 py-6 md:px-12 lg:px-20">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-dark-500">Jump to:</span>
            {REGION_ORDER.filter((r) => (byRegion.get(r)?.length || 0) > 0).map((region) => (
              <a
                key={region}
                href={`#${region.toLowerCase().replace(/\s+/g, "-")}`}
                className="rounded-full border border-white/[0.08] px-4 py-1.5 text-[12px] text-dark-300 transition-all hover:border-gold-400/30 hover:text-gold-400"
              >
                {region}
              </a>
            ))}
          </div>
        </section>

        {/* Region sections */}
        {REGION_ORDER.map((region) => {
          const regionCountries = byRegion.get(region) || [];
          if (regionCountries.length === 0) return null;
          const regionTotal = regionCountries.reduce((sum, c) => sum + c.count, 0);
          return (
            <section
              key={region}
              id={region.toLowerCase().replace(/\s+/g, "-")}
              className="border-b border-white/[0.06] px-6 py-16 md:px-12 lg:px-20"
            >
              <div className="mx-auto max-w-7xl">
                <div className="flex items-baseline gap-4">
                  <h2 className="font-serif text-3xl font-light text-white">{region}</h2>
                  <span className="text-[12px] text-dark-400">
                    {regionTotal.toLocaleString()} retreats in {regionCountries.length} {regionCountries.length === 1 ? "country" : "countries"}
                  </span>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {regionCountries.map((card) => {
                    const seoData = getCountrySEO(card.slug);
                    return (
                      <a
                        key={card.slug}
                        href={`/retreats/country/${card.slug}`}
                        className="group flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-gold-400/30 hover:bg-white/[0.04]"
                      >
                        <div>
                          <h3 className="font-serif text-xl text-white transition-colors group-hover:text-gold-400">
                            {card.country}
                          </h3>
                          <p className="mt-1 text-[13px] text-dark-400">
                            {card.count} {card.count === 1 ? "retreat" : "retreats"}
                          </p>
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                          {card.avgPrice > 0 && (
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.2em] text-dark-500">Avg Price</p>
                              <p className="mt-0.5 font-serif text-[15px] text-gold-400">
                                ${card.avgPrice.toLocaleString()}<span className="text-[11px] text-dark-400">/night</span>
                              </p>
                            </div>
                          )}
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-dark-500">Top Type</p>
                            <p className="mt-0.5 text-[13px] text-dark-300">
                              {seoData?.topTypes[0] || card.topType}
                            </p>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}

        {/* Bottom CTA */}
        <section className="px-6 py-20 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-3xl font-light text-white">
              Not Sure Where to Go?
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-dark-300">
              Take our wellness retreat quiz to get personalized destination recommendations
              based on your goals, budget, and travel preferences.
            </p>
            <a
              href="/quiz"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold-500 px-8 py-3 text-[14px] font-medium text-dark-950 transition-all hover:bg-gold-400"
            >
              Take the Quiz
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
