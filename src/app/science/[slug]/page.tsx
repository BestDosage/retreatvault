import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";

/* ═══════════════════════════════════════════════════════════
   Article metadata
   ═══════════════════════════════════════════════════════════ */

const SCIENCE_ARTICLES: Record<string, { title: string; metaDescription: string }> = {
  "yoga-meditation-science": {
    title: "Does yoga and meditation actually work?",
    metaDescription:
      "What 24 clinical trials say about yoga and meditation retreats. PubMed-cited evidence on stress, anxiety, sleep, and long-term outcomes.",
  },
  "ayurveda-science": {
    title: "Ayurveda at wellness retreats",
    metaDescription:
      "Clinical evidence for Ayurvedic retreat treatments including ashwagandha, Panchakarma, and herbal protocols. PubMed-cited analysis.",
  },
  "fasting-detox-science": {
    title: "Fasting and detox retreats",
    metaDescription:
      "What 99 clinical trials show about fasting retreats and detox programs. Metabolic benefits, risks, and what the science actually supports.",
  },
  "spa-hydrotherapy-science": {
    title: "Spa and hydrotherapy",
    metaDescription:
      "Clinical evidence for hydrotherapy and spa treatments. Musculoskeletal, cardiovascular, and pain management research from PubMed.",
  },
  "functional-medicine-longevity-science": {
    title: "Functional medicine and longevity",
    metaDescription:
      "Evidence review of functional medicine and longevity retreat programs. What individual components are proven vs. what remains unvalidated.",
  },
  "mindfulness-stress-reduction-science": {
    title: "Mindfulness-based stress reduction",
    metaDescription:
      "MBSR is the most studied retreat modality. 40 years of clinical trials on stress, anxiety, chronic pain, and immune function. Full PubMed analysis.",
  },
};

const SLUGS = Object.keys(SCIENCE_ARTICLES);

/* ═══════════════════════════════════════════════════════════
   Static params & metadata
   ═══════════════════════════════════════════════════════════ */

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = SCIENCE_ARTICLES[slug];
  if (!article) return { title: "Article Not Found" };

  return {
    title: `${article.title} | Science Hub | RetreatVault`,
    description: article.metaDescription,
    alternates: { canonical: `https://www.retreatvault.com/science/${slug}` },
    openGraph: { title: article.title, description: article.metaDescription },
  };
}

/* ═══════════════════════════════════════════════════════════
   Simple markdown to HTML converter
   Processes trusted, owner-authored markdown files from
   content/science-hub/. No user input flows through this.
   ═══════════════════════════════════════════════════════════ */

function markdownToHtml(md: string): string {
  let html = md;

  // Remove the title line (first # heading) — we render it separately
  html = html.replace(/^#\s+.+\n+/, "");

  // Remove the italic source line at the top
  html = html.replace(/^\*[^*]+\*\n+/, "");
  // Remove non-italic source lines like "Sources: PubMed"
  html = html.replace(/^Sources:\s+.+\n+/, "");

  // Convert ### headings
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");

  // Convert ## headings
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Links — markdown [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Unordered list items
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.+<\/li>\n?)+)/g, "<ul>$1</ul>");

  // Paragraphs: split by double newline, wrap non-tag lines in <p>
  const blocks = html.split(/\n{2,}/);
  html = blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<h2>") ||
        trimmed.startsWith("<h3>") ||
        trimmed.startsWith("<ul>") ||
        trimmed.startsWith("<ol>")
      ) {
        return trimmed;
      }
      return `<p>${trimmed}</p>`;
    })
    .join("\n\n");

  // Clean up stray single newlines inside paragraphs
  html = html.replace(/<p>(.+?)<\/p>/gs, (_, content) => {
    return `<p>${content.replace(/\n/g, " ")}</p>`;
  });

  return html;
}

function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 230));
}

/* ═══════════════════════════════════════════════════════════
   Page component
   ═══════════════════════════════════════════════════════════ */

export default async function ScienceArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = SCIENCE_ARTICLES[slug];
  if (!article) notFound();

  const filePath = path.join(process.cwd(), "content", "science-hub", `${slug}.md`);
  let markdown: string;
  try {
    markdown = fs.readFileSync(filePath, "utf-8");
  } catch {
    notFound();
  }

  const contentHtml = markdownToHtml(markdown);
  const readingTime = estimateReadingTime(markdown);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.retreatvault.com" },
      { "@type": "ListItem", position: 2, name: "Science Hub", item: "https://www.retreatvault.com/science" },
      { "@type": "ListItem", position: 3, name: article.title },
    ],
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    author: { "@type": "Organization", name: "RetreatVault" },
    publisher: { "@type": "Organization", name: "RetreatVault", url: "https://www.retreatvault.com" },
    mainEntityOfPage: `https://www.retreatvault.com/science/${slug}`,
  };

  // All dangerouslySetInnerHTML below uses trusted static content from
  // owner-authored markdown files in content/science-hub/ and static
  // JSON-LD schema objects. No user input flows through these paths.

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <main className="min-h-screen bg-dark-950">
        {/* Hero */}
        <section className="border-b border-white/[0.06] px-6 pb-16 pt-32 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <nav className="mb-8 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-dark-400">
              <a href="/" className="transition-colors hover:text-gold-400">Home</a>
              <span className="text-dark-700">/</span>
              <a href="/science" className="transition-colors hover:text-gold-400">Science Hub</a>
              <span className="text-dark-700">/</span>
              <span className="text-dark-300">{article.title}</span>
            </nav>

            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">
              Evidence Guide
            </p>
            <h1 className="mt-4 font-serif text-4xl font-light text-white md:text-5xl lg:text-6xl">
              {article.title}
            </h1>

            <div className="mt-8 flex items-center gap-4 border-t border-white/[0.06] pt-6">
              <div className="flex items-center gap-4 text-[11px] text-dark-500">
                <span>{readingTime} min read</span>
                <span>Sources: PubMed</span>
              </div>
            </div>
          </div>
        </section>

        {/* Article content — trusted owner-authored markdown, not user input */}
        <section className="px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <div
              className="editorial-content max-w-none text-[15px] leading-[1.85] text-dark-300
                [&>p]:mb-4
                [&>h2]:mb-4 [&>h2]:mt-12 [&>h2]:font-serif [&>h2]:text-3xl [&>h2]:font-light [&>h2]:text-white md:[&>h2]:text-4xl
                [&>h3]:mb-3 [&>h3]:mt-8 [&>h3]:font-serif [&>h3]:text-xl [&>h3]:font-medium [&>h3]:text-dark-100
                [&>ul]:mb-4 [&>ul]:ml-5 [&>ul]:list-disc [&>ul]:space-y-2
                [&>ol]:mb-4 [&>ol]:ml-5 [&>ol]:list-decimal [&>ol]:space-y-2
                [&_li]:text-dark-300
                [&_strong]:text-dark-100 [&_strong]:font-medium
                [&_a]:text-gold-400 [&_a]:underline [&_a]:decoration-gold-400/30 [&_a]:underline-offset-2 [&_a]:transition-colors hover:[&_a]:text-gold-300
                [&_em]:text-dark-400 [&_em]:italic"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
        </section>

        {/* Back link */}
        <section className="border-t border-white/[0.06] px-6 py-12 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/science"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-dark-300 transition-all duration-300 hover:border-gold-500/30 hover:text-gold-400"
            >
              ← Back to Science Hub
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
