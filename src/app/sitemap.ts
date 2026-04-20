import { MetadataRoute } from "next";
import { getAllRetreats, slugifyRegion, slugifyCountry } from "@/lib/data";
import { blogPosts } from "@/data/blog-posts";

const BASE_URL = "https://www.retreatvault.com";
const FALLBACK_DATE = new Date("2026-04-01");

/**
 * Generates sub-sitemap IDs for the sitemap index.
 *
 * ID 0 = static pages + blog posts + hub pages
 * ID 1+ = one per country (retreats grouped by country, sorted alphabetically)
 */
export async function generateSitemaps() {
  const retreats = await getAllRetreats();
  const countries = [
    ...new Set(retreats.map((r) => r.country).filter(Boolean)),
  ].sort();

  const ids = [{ id: 0 }];
  countries.forEach((_, i) => {
    ids.push({ id: i + 1 });
  });
  return ids;
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  if (id === 0) {
    const retreats = await getAllRetreats();

    const staticPages: MetadataRoute.Sitemap = [
      { url: BASE_URL, lastModified: new Date("2026-04-15"), changeFrequency: "weekly", priority: 1.0 },
      { url: `${BASE_URL}/retreats`, lastModified: new Date("2026-04-15"), changeFrequency: "weekly", priority: 0.9 },
      { url: `${BASE_URL}/blog`, lastModified: new Date("2026-04-15"), changeFrequency: "daily", priority: 0.8 },
      { url: `${BASE_URL}/quiz`, lastModified: new Date("2026-04-01"), changeFrequency: "monthly", priority: 0.8 },
      { url: `${BASE_URL}/methodology`, lastModified: new Date("2026-03-15"), changeFrequency: "monthly", priority: 0.6 },
      { url: `${BASE_URL}/compare`, lastModified: new Date("2026-04-10"), changeFrequency: "weekly", priority: 0.7 },
      { url: `${BASE_URL}/contact`, lastModified: new Date("2026-01-15"), changeFrequency: "yearly", priority: 0.5 },
    ];

    // Region hub pages
    const regions = [...new Set(retreats.map((r) => r.region).filter(Boolean))];
    const regionPages: MetadataRoute.Sitemap = regions.map((region) => ({
      url: `${BASE_URL}/retreats/region/${slugifyRegion(region)}`,
      lastModified: new Date("2026-04-15"),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));

    // Country hub pages
    const countries = [...new Set(retreats.map((r) => r.country).filter(Boolean))];
    const countryPages: MetadataRoute.Sitemap = countries.map((country) => ({
      url: `${BASE_URL}/retreats/country/${slugifyCountry(country)}`,
      lastModified: new Date("2026-04-15"),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updated_date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...regionPages, ...countryPages, ...blogPages];
  }

  // Sub-sitemaps 1+: retreats grouped by country
  const retreats = await getAllRetreats();
  const countries = [
    ...new Set(retreats.map((r) => r.country).filter(Boolean)),
  ].sort();

  const country = countries[id - 1];
  if (!country) return [];

  return retreats
    .filter((r) => r.country === country)
    .map((r) => ({
      url: `${BASE_URL}/retreats/${r.slug}`,
      lastModified: r.updated_at ? new Date(r.updated_at) : FALLBACK_DATE,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
}
