import { MetadataRoute } from "next";
import { getAllRetreats } from "@/lib/data";
import { blogPosts } from "@/data/blog-posts";

const BASE_URL = "https://www.retreatvault.com";
const CHUNK_SIZE = 5000;

export async function generateSitemaps() {
  const retreats = await getAllRetreats();
  const total = 7 + blogPosts.length + retreats.length;
  const chunks = Math.max(1, Math.ceil(total / CHUNK_SIZE));
  return Array.from({ length: chunks }, (_, i) => ({ id: i }));
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const retreats = await getAllRetreats();
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

  const retreatPages: MetadataRoute.Sitemap = retreats.map((r) => ({
    url: `${BASE_URL}/retreats/${r.slug}`,
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
