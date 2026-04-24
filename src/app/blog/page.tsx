import type { Metadata } from "next";
import { blogPosts as basePosts } from "@/data/blog-posts";
import { retreatBlogPosts } from "@/data/retreat-blog-posts";

const blogPosts = [...retreatBlogPosts, ...basePosts];
import { getAllRetreats } from "@/lib/data";
import BlogListClient from "./BlogListClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Wellness Retreat Insights — Evidence-Based Guides & Analysis",
  description:
    "Honest, science-backed guides to choosing wellness retreats. Cost breakdowns, scam red flags, burnout recovery, and comparison guides — written by an analytical chemist.",
};

export default async function BlogPage() {
  const allRetreats = await getAllRetreats();
  const retreatImageMap: Record<string, { name: string; image: string }> = {};
  for (const r of allRetreats) {
    retreatImageMap[r.slug] = { name: r.name, image: r.hero_image_url };
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.retreatvault.com" },
      { "@type": "ListItem", position: 2, name: "Journal" },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BlogListClient posts={blogPosts} retreatImages={retreatImageMap} />
    </>
  );
}
