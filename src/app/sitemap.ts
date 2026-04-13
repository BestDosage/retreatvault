import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { blogPosts } from "@/data/blog-posts";

const BASE_URL = "https://www.retreatvault.com";
const CHUNK_SIZE = 5000;

/** Direct Supabase client — bypasses unstable_cache to get fresh counts at build time. */
function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}

/** Fetch all retreat slugs directly (no unstable_cache). */
async function getAllRetreatSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let offset = 0;
  const PAGE = 1000;
  for (;;) {
    const { data, error } = await supabase()
      .from("retreats")
      .select("slug")
      .neq("slug", "test")
      .gt("wrd_score", 0)
      .order("slug")
      .range(offset, offset + PAGE - 1);
    if (error || !data || data.length === 0) break;
    for (const r of data) if (r.slug) slugs.push(r.slug);
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return slugs;
}

export async function generateSitemaps() {
  const slugs = await getAllRetreatSlugs();
  const total = 7 + blogPosts.length + slugs.length;
  const chunks = Math.max(1, Math.ceil(total / CHUNK_SIZE));
  return Array.from({ length: chunks }, (_, i) => ({ id: i }));
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllRetreatSlugs();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/retreats`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/quiz`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/methodology`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/compare`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];

  const retreatPages: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${BASE_URL}/retreats/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updated_date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const allUrls = [...staticPages, ...retreatPages, ...blogPages];
  const start = id * CHUNK_SIZE;
  return allUrls.slice(start, start + CHUNK_SIZE);
}
