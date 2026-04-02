import type { Metadata } from "next";
import { blogPosts } from "@/data/blog-posts";
import BlogListClient from "./BlogListClient";

export const metadata: Metadata = {
  title: "Wellness Retreat Insights — Evidence-Based Guides & Analysis",
  description:
    "Honest, science-backed guides to choosing wellness retreats. Cost breakdowns, scam red flags, burnout recovery, and comparison guides — written by an analytical chemist.",
};

export default function BlogPage() {
  return <BlogListClient posts={blogPosts} />;
}
