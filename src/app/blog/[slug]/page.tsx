import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blogPosts } from "@/data/blog-posts";
import { getAllRetreats } from "@/lib/data";
import BlogPostClient from "./BlogPostClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.title,
    description: post.meta_description,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const otherPosts = blogPosts.filter((p) => p.slug !== slug).slice(0, 2);

  // Fetch retreat data for inline images
  const allRetreats = await getAllRetreats();
  const retreatImageMap: Record<string, { name: string; image: string; slug: string }> = {};
  for (const r of allRetreats) {
    retreatImageMap[r.slug] = {
      name: r.name,
      image: r.hero_image_url,
      slug: r.slug,
    };
  }

  return (
    <BlogPostClient
      post={post}
      relatedPosts={otherPosts}
      retreatImages={retreatImageMap}
    />
  );
}
