"use client";

import { BlogPost } from "@/lib/types";
import AnimateIn, { StaggerContainer, StaggerItem } from "@/components/AnimateIn";

const categoryColors: Record<string, string> = {
  trust: "text-amber-400",
  budget: "text-emerald-400",
  condition: "text-rose-400",
  decision: "text-sky-400",
  science: "text-violet-400",
};

export default function BlogListClient({ posts }: { posts: BlogPost[] }) {
  return (
    <div className="min-h-screen pt-28">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <AnimateIn>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-500">
            Insights
          </p>
        </AnimateIn>
        <AnimateIn delay={0.1}>
          <h1 className="mt-4 font-serif text-5xl font-light text-white sm:text-6xl">
            The Vault Journal
          </h1>
        </AnimateIn>
        <AnimateIn delay={0.2}>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-dark-300">
            Honest, science-backed guides to choosing the right wellness retreat.
            No sponsored content. No pay-to-play. Just an analytical chemist
            doing what chemists do — testing claims.
          </p>
        </AnimateIn>

        <div className="line-gold mt-12" />

        {/* Posts Grid */}
        <StaggerContainer className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 pb-24">
          {posts.map((post) => (
            <StaggerItem key={post.slug}>
              <a
                href={`/blog/${post.slug}`}
                className="group block overflow-hidden rounded-lg border border-white/[0.04] bg-dark-900 transition-all duration-500 hover:border-gold-700/30 hover:bg-dark-800"
              >
                {/* Image placeholder */}
                <div className="aspect-[16/9] overflow-hidden bg-dark-800">
                  <div className="flex h-full items-center justify-center">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-dark-500">
                      {post.category_label}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[9px] font-semibold uppercase tracking-[0.3em] ${categoryColors[post.category] || "text-gold-500"}`}
                    >
                      {post.category_label}
                    </span>
                    <span className="text-[10px] text-dark-500">
                      {post.read_time_minutes} min read
                    </span>
                  </div>

                  <h2 className="mt-3 font-serif text-xl font-light leading-snug text-white transition-colors duration-500 group-hover:text-gold-400">
                    {post.title}
                  </h2>

                  <p className="mt-3 text-[13px] leading-relaxed text-dark-400 line-clamp-3">
                    {post.subtitle}
                  </p>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-[11px] text-dark-500">
                      {post.author}
                    </span>
                    <span className="text-[10px] text-dark-500">
                      {new Date(post.published_date).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </span>
                  </div>
                </div>
              </a>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </div>
  );
}
