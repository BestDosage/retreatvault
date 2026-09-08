"use client";

import { BlogPost } from "@/lib/types";
import AnimateIn, { StaggerContainer, StaggerItem } from "@/components/AnimateIn";

const categoryColors: Record<string, string> = {
  trust: "text-sage-700",
  budget: "text-sage-700",
  condition: "text-sage-700",
  decision: "text-sage-700",
  science: "text-sage-700",
};

type RetreatImageMap = Record<string, { name: string; image: string }>;

function resolveHeroImage(post: BlogPost, retreatImages: RetreatImageMap): string | null {
  const match = post.hero_image_url.match(/\{\{retreat:(.+?)\}\}/);
  if (match) return retreatImages[match[1]]?.image || null;
  return post.hero_image_url;
}

export default function BlogListClient({
  posts,
  retreatImages,
}: {
  posts: BlogPost[];
  retreatImages: RetreatImageMap;
}) {
  return (
    <div className="min-h-screen pt-28">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <AnimateIn>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-sage-700">
            Insights
          </p>
        </AnimateIn>
        <AnimateIn delay={0.1}>
          <h1 className="mt-4 font-serif text-5xl font-light text-ink-900 sm:text-6xl">
            The Vault Journal
          </h1>
        </AnimateIn>
        <AnimateIn delay={0.2}>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-700">
            Honest, science-backed guides to choosing the right wellness retreat.
            Scores are never for sale — retreats pay us when you book, and the
            score doesn&rsquo;t move.
          </p>
        </AnimateIn>

        <div className="line-gold mt-12" />

        {/* Posts Grid */}
        <StaggerContainer className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 pb-24">
          {posts.map((post) => {
            const heroImage = resolveHeroImage(post, retreatImages);
            return (
              <StaggerItem key={post.slug}>
                <a
                  href={`/blog/${post.slug}`}
                  className="group block overflow-hidden rounded-lg border border-cream-200 bg-cream-100 transition-all duration-500 hover:border-sage-700/40 hover:bg-cream-200"
                >
                  {/* Image */}
                  <div className="aspect-[16/9] overflow-hidden bg-cream-200">
                    {heroImage ? (
                      <img
                        src={heroImage}
                        alt={post.hero_image_alt}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-ink-500">
                          {post.category_label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-[0.3em] ${categoryColors[post.category] || "text-sage-700"}`}
                      >
                        {post.category_label}
                      </span>
                      <span className="text-[10px] text-ink-500">
                        {post.read_time_minutes} min read
                      </span>
                    </div>

                    <h2 className="mt-3 font-serif text-xl font-light leading-snug text-ink-900 transition-colors duration-500 group-hover:text-sage-600">
                      {post.title}
                    </h2>

                    <p className="mt-3 text-[13px] leading-relaxed text-ink-500 line-clamp-3">
                      {post.subtitle}
                    </p>

                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-[11px] text-ink-500">{post.author}</span>
                      <span className="text-[10px] text-ink-500">
                        {new Date(post.published_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </a>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </div>
  );
}
