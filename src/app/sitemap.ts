import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { blogPosts } from "@/data/blog-posts";
import { GUIDES } from "@/data/guides";
import { EDITORIAL_GUIDES } from "@/data/editorial-guides";

export const revalidate = 3600; // ISR — regenerate sitemaps hourly, not at build time

const BASE_URL = "https://www.retreatvault.com";
const FALLBACK_DATE = new Date("2026-04-01");

/** All 15 retreat type slugs for /retreats/type/[type] pages. */
export const RETREAT_TYPE_SLUGS = [
  "yoga",
  "meditation",
  "detox",
  "ayahuasca",
  "silent",
  "wellness",
  "fitness",
  "weight-loss",
  "spiritual",
  "ayurveda",
  "plant-medicine",
  "breathwork",
  "fasting",
  "couples",
  "luxury",
] as const;

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
  const all: string[] = [];
  let offset = 0;
  const PAGE = 1000;
  for (;;) {
    const { data } = await db()
      .from("retreats")
      .select("country")
      .neq("slug", "test")
      .gt("wrd_score", 0)
      .range(offset, offset + PAGE - 1);
    if (!data || data.length === 0) break;
    for (const r of data) if (r.country) all.push(r.country);
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return [...new Set(all)].sort();
}

/** Fetch total retreat count. */
async function getRetreatCount(): Promise<number> {
  const { count } = await db()
    .from("retreats")
    .select("id", { count: "exact", head: true })
    .neq("slug", "test")
    .gt("wrd_score", 0);
  return count ?? 0;
}

/** Fetch a page of retreat slugs ordered alphabetically. */
async function getRetreatSlugsPage(offset: number, limit: number): Promise<{ slug: string; updated_at: string | null }[]> {
  const { data } = await db()
    .from("retreats")
    .select("slug, updated_at")
    .neq("slug", "test")
    .gt("wrd_score", 0)
    .order("slug")
    .range(offset, offset + limit - 1);
  if (!data) return [];
  return data.filter((r: any) => r.slug).map((r: any) => ({ slug: r.slug, updated_at: r.updated_at }));
}

/** Fetch distinct regions (lightweight). */
async function getDistinctRegions(): Promise<string[]> {
  const all: string[] = [];
  let offset = 0;
  const PAGE = 1000;
  for (;;) {
    const { data } = await db()
      .from("retreats")
      .select("region")
      .neq("slug", "test")
      .gt("wrd_score", 0)
      .range(offset, offset + PAGE - 1);
    if (!data || data.length === 0) break;
    for (const r of data) if (r.region) all.push(r.region);
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return [...new Set(all)].sort();
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const RETREATS_PER_SITEMAP = 1000;
const RETREAT_SITEMAPS = 10; // ~9,400 retreats / 1,000 per sitemap

/**
 * Sitemap index: ID 0 = static + blog + hub pages, ID 1-10 = retreat chunks (~1000 each).
 * Hardcoded count to avoid Supabase timeout during Vercel build.
 */
export async function generateSitemaps() {
  return Array.from({ length: RETREAT_SITEMAPS + 1 }, (_, i) => ({ id: i }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  if (id === 0) {
    const staticPages: MetadataRoute.Sitemap = [
      { url: BASE_URL, lastModified: new Date("2026-04-15"), changeFrequency: "weekly", priority: 1.0 },
      { url: `${BASE_URL}/retreats`, lastModified: new Date("2026-04-15"), changeFrequency: "weekly", priority: 0.9 },
      { url: `${BASE_URL}/destinations`, lastModified: new Date("2026-04-26"), changeFrequency: "weekly", priority: 0.9 },
      { url: `${BASE_URL}/blog`, lastModified: new Date("2026-04-15"), changeFrequency: "daily", priority: 0.8 },
      { url: `${BASE_URL}/quiz`, lastModified: new Date("2026-04-01"), changeFrequency: "monthly", priority: 0.8 },
      { url: `${BASE_URL}/methodology`, lastModified: new Date("2026-03-15"), changeFrequency: "monthly", priority: 0.6 },
      { url: `${BASE_URL}/compare`, lastModified: new Date("2026-04-10"), changeFrequency: "weekly", priority: 0.7 },
      { url: `${BASE_URL}/contact`, lastModified: new Date("2026-01-15"), changeFrequency: "yearly", priority: 0.5 },
    ];

    // Retreat type pages: /retreats/type/[type]
    const typePages: MetadataRoute.Sitemap = RETREAT_TYPE_SLUGS.map((type) => ({
      url: `${BASE_URL}/retreats/type/${type}`,
      lastModified: new Date("2026-04-26"),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));

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

    const guideIndexPage: MetadataRoute.Sitemap = [
      { url: `${BASE_URL}/guides`, lastModified: new Date("2026-04-15"), changeFrequency: "weekly", priority: 0.8 },
    ];

    const guidePages: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
      url: `${BASE_URL}/guides/${guide.slug}`,
      lastModified: new Date("2026-04-15"),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const editorialGuidePages: MetadataRoute.Sitemap = EDITORIAL_GUIDES.map((guide) => ({
      url: `${BASE_URL}/guides/${guide.slug}`,
      lastModified: new Date(guide.updatedDate),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

    return [...staticPages, ...typePages, ...regionPages, ...countryPages, ...blogPages, ...guideIndexPage, ...guidePages, ...editorialGuidePages];
  }

  // Sub-sitemaps 1+: retreat chunks of ~1000
  const offset = (id - 1) * RETREATS_PER_SITEMAP;
  const slugs = await getRetreatSlugsPage(offset, RETREATS_PER_SITEMAP);
  return slugs.map((r) => ({
    url: `${BASE_URL}/retreats/${r.slug}`,
    lastModified: r.updated_at ? new Date(r.updated_at) : FALLBACK_DATE,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
}
