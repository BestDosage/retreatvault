import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllRetreats,
  getRegions,
  getCountriesInRegion,
  slugifyRegion,
  slugifyCountry,
} from "@/lib/data";
import { WellnessRetreat } from "@/lib/types";
import RetreatCard from "@/components/RetreatCard";

export const revalidate = 86400;
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

export async function generateStaticParams(): Promise<Params[]> {
  const regions = await getRegions();
  return regions.map((r) => ({ region: slugifyRegion(r.name) }));
}

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
              <span className="text-dark-300">{displayName}</span>
            </nav>

            <h1 className="font-serif text-4xl font-light text-white md:text-5xl lg:text-6xl">
              Wellness Retreats in {displayName}
            </h1>
            <p className="mt-4 text-lg text-dark-400">
              {regionRetreats.length} retreats across {countries.length} {countries.length === 1 ? "country" : "countries"}
            </p>
            {intro && (
              <p className="mt-6 max-w-3xl text-[15px] leading-relaxed text-dark-300">
                {intro}
              </p>
            )}
          </div>
        </section>

        {/* Countries in this region */}
        <section className="border-b border-white/[0.06] px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-serif text-2xl font-light text-white">
              Countries in {displayName}
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {countries.map((c) => (
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
          </div>
        </section>

        {/* Top 12 retreat cards */}
        <section className="border-b border-white/[0.06] px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-serif text-2xl font-light text-white">
              Top Retreats in {displayName}
            </h2>
            <p className="mt-2 text-[13px] text-dark-500">
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
            <h2 className="font-serif text-2xl font-light text-white">
              Complete {displayName} Directory
            </h2>
            <p className="mt-2 text-[13px] text-dark-500">
              Every retreat in {displayName}, organized by country
            </p>

            {Array.from(byCountry.entries())
              .sort(([, a], [, b]) => b.length - a.length)
              .map(([country, retreats]) => (
                <div key={country} className="mt-10">
                  <div className="flex items-center gap-4">
                    <h3 className="font-serif text-lg text-gold-400">
                      <a
                        href={`/retreats/country/${slugifyCountry(country)}`}
                        className="hover:text-gold-300 transition-colors"
                      >
                        {country}
                      </a>
                    </h3>
                    <span className="text-[11px] text-dark-600">
                      {retreats.length} {retreats.length === 1 ? "retreat" : "retreats"}
                    </span>
                  </div>

                  <div className="mt-4 overflow-x-auto">
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
      </main>
    </>
  );
}
