import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { blogPosts } from "@/data/blog-posts";

const BASE_URL = "https://www.retreatvault.com";
const FALLBACK_DATE = new Date("2026-04-01");

/** Direct Supabase client — bypasses unstable_cache to avoid 2MB limit. */
function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}

/** Fetch distinct countries from retreats table (lightweight). */
async function getDistinctCountries(): Promise<string[]> {
  const { data } = await db()
    .from("retreats")
    .select("country")
    .neq("slug", "test")
    .gt("wrd_score", 0);
  if (!data) return [];
  const countries = [...new Set(data.map((r: any) => r.country).filter(Boolean))].sort();
  return countries as string[];
}

/** Fetch slugs + country + updated_at for one country (lightweight). */
async function getRetreatSlugsByCountry(country: string): Promise<{ slug: string; updated_at: string | null }[]> {
  const slugs: { slug: string; updated_at: string | null }[] = [];
  let offset = 0;
  const PAGE = 1000;
  for (;;) {
    const { data, error } = await db()
      .from("retreats")
      .select("slug, updated_at")
      .eq("country", country)
      .neq("slug", "test")
      .gt("wrd_score", 0)
      .order("slug")
      .range(offset, offset + PAGE - 1);
    if (error || !data || data.length === 0) break;
    for (const r of data) if (r.slug) slugs.push({ slug: r.slug, updated_at: r.updated_at });
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return slugs;
}

/** Fetch distinct regions (lightweight). */
async function getDistinctRegions(): Promise<string[]> {
  const { data } = await db()
    .from("retreats")
    .select("region")
    .neq("slug", "test")
    .gt("wrd_score", 0);
  if (!data) return [];
  return [...new Set(data.map((r: any) => r.region).filter(Boolean))].sort() as string[];
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Sitemap index: ID 0 = static + blog + hub pages, ID 1+ = one per country.
 */
export async function generateSitemaps() {
  const countries = await getDistinctCountries();
  const ids = [{ id: 0 }];
  countries.forEach((_, i) => ids.push({ id: i + 1 }));
  return ids;
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  if (id === 0) {
    const staticPages: MetadataRoute.Sitemap = [
      { url: BASE_URL, lastModified: new Date("2026-04-15"), changeFrequency: "weekly", priority: 1.0 },
      { url: `${BASE_URL}/retreats`, lastModified: new Date("2026-04-15"), changeFrequency: "weekly", priority: 0.9 },
      { url: `${BASE_URL}/blog`, lastModified: new Date("2026-04-15"), changeFrequency: "daily", priority: 0.8 },
      { url: `${BASE_URL}/quiz`, lastModified: new Date("2026-04-01"), changeFrequency: "monthly", priority: 0.8 },
      { url: `${BASE_URL}/methodology`, lastModified: new Date("2026-03-15"), changeFrequency: "monthly", priority: 0.6 },
      { url: `${BASE_URL}/compare`, lastModified: new Date("2026-04-10"), changeFrequency: "weekly", priority: 0.7 },
      { url: `${BASE_URL}/contact`, lastModified: new Date("2026-01-15"), changeFrequency: "yearly", priority: 0.5 },
    ];

    const regions = await getDistinctRegions();
    const regionPages: MetadataRoute.Sitemap = regions.map((region) => ({
      url: `${BASE_URL}/retreats/region/${slugify(region)}`,
      lastModified: new Date("2026-04-15"),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));

    const countries = await getDistinctCountries();
    const countryPages: MetadataRoute.Sitemap = countries.map((country) => ({
      url: `${BASE_URL}/retreats/country/${slugify(country)}`,
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

  // Sub-sitemaps 1+: retreats by country
  const countries = await getDistinctCountries();
  const country = countries[id - 1];
  if (!country) return [];

  const slugs = await getRetreatSlugsByCountry(country);
  return slugs.map((r) => ({
    url: `${BASE_URL}/retreats/${r.slug}`,
    lastModified: r.updated_at ? new Date(r.updated_at) : FALLBACK_DATE,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
}
