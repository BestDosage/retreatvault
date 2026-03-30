import { MetadataRoute } from "next";
import { getAllRetreats } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const retreats = await getAllRetreats();
  const baseUrl = "https://www.retreatvault.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/retreats`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/quiz`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/methodology`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
  ];

  const retreatPages: MetadataRoute.Sitemap = retreats.map((r) => ({
    url: `${baseUrl}/retreats/${r.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...retreatPages];
}
