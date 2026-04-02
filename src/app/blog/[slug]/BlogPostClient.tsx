"use client";

import { BlogPost } from "@/lib/types";
import AnimateIn from "@/components/AnimateIn";

const categoryColors: Record<string, string> = {
  trust: "text-amber-400",
  budget: "text-emerald-400",
  condition: "text-rose-400",
  decision: "text-sky-400",
  science: "text-violet-400",
};

type RetreatImageMap = Record<string, { name: string; image: string; slug: string }>;

function resolveRetreatImage(ref: string, retreatImages: RetreatImageMap): string | null {
  const match = ref.match(/\{\{retreat:(.+?)\}\}/);
  if (!match) return null;
  const slug = match[1];
  return retreatImages[slug]?.image || null;
}

function RetreatImage({
  slug,
  retreatImages,
}: {
  slug: string;
  retreatImages: RetreatImageMap;
}) {
  const retreat = retreatImages[slug];
  if (!retreat?.image) return null;

  return (
    <figure className="my-8 overflow-hidden rounded-xl">
      <a href={`/retreats/${retreat.slug}`} className="group block">
        <div className="aspect-[21/9] overflow-hidden rounded-xl">
          <img
            src={retreat.image}
            alt={retreat.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <figcaption className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-dark-400">{retreat.name}</span>
          <span className="text-[10px] text-gold-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            View full rating &rarr;
          </span>
        </figcaption>
      </a>
    </figure>
  );
}

function renderContent(content: string, retreatImages: RetreatImageMap) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Retreat image embed
    const retreatMatch = line.trim().match(/^\{\{retreat:(.+?)\}\}$/);
    if (retreatMatch) {
      elements.push(
        <RetreatImage
          key={`retreat-${i}`}
          slug={retreatMatch[1]}
          retreatImages={retreatImages}
        />
      );
      i++;
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={i}
          className="mt-14 mb-6 font-serif text-3xl font-light text-white"
        >
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={i}
          className="mt-10 mb-4 font-serif text-xl font-light text-white"
        >
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }

    // Bullet list
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-4 ml-4 flex flex-col gap-2">
          {items.map((item, idx) => (
            <li
              key={idx}
              className="text-[15px] leading-relaxed text-dark-200 before:mr-3 before:inline-block before:text-gold-500 before:content-['—']"
            >
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-4 ml-4 flex flex-col gap-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-[15px] leading-relaxed text-dark-200">
              <span className="mr-3 font-semibold text-gold-500">{idx + 1}.</span>
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="my-4 text-[15px] leading-[1.85] text-dark-200">
        <InlineMarkdown text={line} />
      </p>
    );
    i++;
  }

  return elements;
}

function InlineMarkdown({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/);

    const matches = [
      boldMatch ? { type: "bold", index: remaining.indexOf(boldMatch[0]), match: boldMatch } : null,
      linkMatch ? { type: "link", index: remaining.indexOf(linkMatch[0]), match: linkMatch } : null,
    ]
      .filter(Boolean)
      .sort((a, b) => a!.index - b!.index);

    if (matches.length === 0) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    const first = matches[0]!;

    if (first.index > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, first.index)}</span>);
    }

    if (first.type === "bold") {
      parts.push(
        <strong key={key++} className="font-semibold text-white">
          {first.match![1]}
        </strong>
      );
      remaining = remaining.slice(first.index + first.match![0].length);
    } else if (first.type === "link") {
      parts.push(
        <a
          key={key++}
          href={first.match![2]}
          className="text-gold-400 underline decoration-gold-700/40 underline-offset-2 transition-colors duration-300 hover:text-gold-300"
        >
          {first.match![1]}
        </a>
      );
      remaining = remaining.slice(first.index + first.match![0].length);
    }
  }

  return <>{parts}</>;
}

export default function BlogPostClient({
  post,
  relatedPosts,
  retreatImages,
}: {
  post: BlogPost;
  relatedPosts: BlogPost[];
  retreatImages: RetreatImageMap;
}) {
  const publishedDate = new Date(post.published_date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Resolve hero image from retreat reference
  const heroUrl = resolveRetreatImage(post.hero_image_url, retreatImages) || post.hero_image_url;
  const heroRetreatSlug = post.hero_image_url.match(/\{\{retreat:(.+?)\}\}/)?.[1];
  const heroRetreatName = heroRetreatSlug ? retreatImages[heroRetreatSlug]?.name : null;

  return (
    <div className="min-h-screen pt-28">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
        {/* Breadcrumb */}
        <AnimateIn>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em]">
            <a href="/blog" className="text-dark-400 transition-colors duration-300 hover:text-gold-400">
              Journal
            </a>
            <span className="text-dark-600">/</span>
            <span className={categoryColors[post.category] || "text-gold-500"}>
              {post.category_label}
            </span>
          </div>
        </AnimateIn>

        {/* Title */}
        <AnimateIn delay={0.1}>
          <h1 className="mt-6 max-w-4xl font-serif text-4xl font-light leading-tight text-white sm:text-5xl">
            {post.title}
          </h1>
        </AnimateIn>

        <AnimateIn delay={0.15}>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-dark-300">
            {post.subtitle}
          </p>
        </AnimateIn>

        {/* Meta */}
        <AnimateIn delay={0.2}>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-700/30 bg-dark-800">
                <span className="text-[11px] font-semibold text-gold-400">CW</span>
              </div>
              <div>
                <p className="text-[13px] font-medium text-white">{post.author}</p>
                <p className="text-[11px] text-dark-400">{post.author_title}</p>
              </div>
            </div>
            <div className="h-4 w-px bg-dark-700" />
            <span className="text-[12px] text-dark-400">{publishedDate}</span>
            <div className="h-4 w-px bg-dark-700" />
            <span className="text-[12px] text-dark-400">{post.read_time_minutes} min read</span>
          </div>
        </AnimateIn>

        {/* Hero Image */}
        {heroUrl && (
          <AnimateIn delay={0.25}>
            <figure className="mt-10 overflow-hidden rounded-xl">
              <div className="aspect-[21/9] overflow-hidden rounded-xl">
                <img
                  src={heroUrl}
                  alt={post.hero_image_alt}
                  className="h-full w-full object-cover"
                />
              </div>
              {heroRetreatName && (
                <figcaption className="mt-2">
                  <a
                    href={`/retreats/${heroRetreatSlug}`}
                    className="text-[11px] text-dark-500 transition-colors duration-300 hover:text-gold-400"
                  >
                    {heroRetreatName}
                  </a>
                </figcaption>
              )}
            </figure>
          </AnimateIn>
        )}

        <div className="line-gold mt-10" />

        {/* Article Body */}
        <AnimateIn delay={0.3}>
          <article className="mx-auto max-w-3xl pb-20 pt-8">
            {renderContent(post.content, retreatImages)}
          </article>
        </AnimateIn>

        {/* Tags */}
        <div className="mx-auto max-w-3xl pb-12">
          <div className="line-gold" />
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/[0.06] bg-dark-800 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-dark-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mx-auto max-w-3xl pb-24">
            <h3 className="font-serif text-2xl font-light text-white">Keep Reading</h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {relatedPosts.map((rp) => (
                <a
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  className="group rounded-lg border border-white/[0.04] bg-dark-900 p-6 transition-all duration-500 hover:border-gold-700/30 hover:bg-dark-800"
                >
                  <span
                    className={`text-[9px] font-semibold uppercase tracking-[0.3em] ${categoryColors[rp.category] || "text-gold-500"}`}
                  >
                    {rp.category_label}
                  </span>
                  <h4 className="mt-2 font-serif text-lg font-light text-white transition-colors duration-500 group-hover:text-gold-400">
                    {rp.title}
                  </h4>
                  <p className="mt-2 text-[12px] text-dark-400">{rp.read_time_minutes} min read</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
