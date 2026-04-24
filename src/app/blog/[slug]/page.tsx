import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blogPosts as basePosts } from "@/data/blog-posts";
import { retreatBlogPosts } from "@/data/retreat-blog-posts";

const blogPosts = [...retreatBlogPosts, ...basePosts];
import { getAllRetreats } from "@/lib/data";
import BlogPostClient from "./BlogPostClient";

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

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
    alternates: { canonical: `/blog/${slug}` },
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

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.retreatvault.com" },
      { "@type": "ListItem", position: 2, name: "Journal", item: "https://www.retreatvault.com/blog" },
      { "@type": "ListItem", position: 3, name: post.title },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BlogPostClient
        post={post}
        relatedPosts={otherPosts}
        retreatImages={retreatImageMap}
      />
    </>
  );
}
