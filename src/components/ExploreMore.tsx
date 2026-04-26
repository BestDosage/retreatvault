/**
 * ExploreMore — internal linking component for cross-page discovery.
 *
 * Renders contextual links to type pages, country/region pages, and guides
 * based on the current page context. Use on retreat detail, country, type,
 * and guide pages to build internal link equity.
 */

import { GUIDES, GuideConfig } from "@/data/guides";

/* ═══ Types ═══ */

interface TypeLink {
  slug: string;
  label: string;
}

interface DestinationLink {
  href: string;
  label: string;
}

interface ExploreMoreProps {
  /** Current page context — drives what gets shown. */
  context: {
    /** Current retreat type slug (e.g. "yoga") — will be excluded from type suggestions. */
    currentType?: string;
    /** Country name for the current page — drives country link suggestions. */
    country?: string;
    /** Region name — drives region link suggestions. */
    region?: string;
    /** Guide slugs to feature (e.g. from relatedGuides on a guide page). */
    relatedGuideSlugs?: string[];
    /** Retreat specialty tags — used to pick relevant type links. */
    specialtyTags?: string[];
  };
  /** Max number of type links to show. Default 6. */
  maxTypes?: number;
  /** Max number of guides to show. Default 3. */
  maxGuides?: number;
  /** Whether to show the section header. Default true. */
  showHeader?: boolean;
}

/* ═══ Constants ═══ */

const ALL_TYPES: TypeLink[] = [
  { slug: "yoga", label: "Yoga Retreats" },
  { slug: "meditation", label: "Meditation Retreats" },
  { slug: "detox", label: "Detox Retreats" },
  { slug: "ayahuasca", label: "Ayahuasca Retreats" },
  { slug: "silent", label: "Silent Retreats" },
  { slug: "wellness", label: "Wellness Retreats" },
  { slug: "fitness", label: "Fitness Retreats" },
  { slug: "weight-loss", label: "Weight Loss Retreats" },
  { slug: "spiritual", label: "Spiritual Retreats" },
  { slug: "ayurveda", label: "Ayurveda Retreats" },
  { slug: "plant-medicine", label: "Plant Medicine Retreats" },
  { slug: "breathwork", label: "Breathwork Retreats" },
  { slug: "fasting", label: "Fasting Retreats" },
  { slug: "couples", label: "Couples Retreats" },
  { slug: "luxury", label: "Luxury Retreats" },
];

/** Map specialty tags / program types to relevant type slugs for smarter suggestions. */
const TAG_TO_TYPE: Record<string, string[]> = {
  yoga: ["yoga"],
  meditation: ["meditation", "silent"],
  mindfulness: ["meditation", "silent"],
  detox: ["detox", "fasting"],
  ayahuasca: ["ayahuasca", "plant-medicine"],
  ayurveda: ["ayurveda"],
  fitness: ["fitness", "weight-loss"],
  weight: ["weight-loss", "fitness"],
  spa: ["luxury", "wellness"],
  luxury: ["luxury", "couples"],
  breathwork: ["breathwork"],
  fasting: ["fasting", "detox"],
  spiritual: ["spiritual", "silent"],
  couples: ["couples", "luxury"],
  plant: ["plant-medicine", "ayahuasca"],
  silent: ["silent", "meditation"],
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/* ═══ Logic ═══ */

function pickTypes(
  currentType: string | undefined,
  specialtyTags: string[] | undefined,
  max: number,
): TypeLink[] {
  // Score each type based on tag relevance
  const scores: Record<string, number> = {};
  const tags = (specialtyTags || []).map((t) => t.toLowerCase());

  for (const tag of tags) {
    for (const [keyword, typeSlugs] of Object.entries(TAG_TO_TYPE)) {
      if (tag.includes(keyword)) {
        for (const ts of typeSlugs) {
          scores[ts] = (scores[ts] || 0) + 1;
        }
      }
    }
  }

  // Filter out current type, sort by relevance then alphabetically
  return ALL_TYPES
    .filter((t) => t.slug !== currentType)
    .sort((a, b) => {
      const sa = scores[a.slug] || 0;
      const sb = scores[b.slug] || 0;
      if (sb !== sa) return sb - sa;
      return a.label.localeCompare(b.label);
    })
    .slice(0, max);
}

function pickGuides(
  relatedSlugs: string[] | undefined,
  specialtyTags: string[] | undefined,
  max: number,
): GuideConfig[] {
  // If explicit related guide slugs provided, use those first
  if (relatedSlugs && relatedSlugs.length > 0) {
    const found = relatedSlugs
      .map((s) => GUIDES.find((g) => g.slug === s))
      .filter(Boolean) as GuideConfig[];
    if (found.length >= max) return found.slice(0, max);
    // Fill remaining with tag-matched guides
    const remainingSlugs = new Set(found.map((g) => g.slug));
    const extras = pickGuidesByTags(specialtyTags, max - found.length, remainingSlugs);
    return [...found, ...extras];
  }

  return pickGuidesByTags(specialtyTags, max, new Set());
}

function pickGuidesByTags(
  tags: string[] | undefined,
  max: number,
  exclude: Set<string>,
): GuideConfig[] {
  if (!tags || tags.length === 0) {
    // Return most popular guides as fallback
    return GUIDES.filter((g) => !exclude.has(g.slug)).slice(0, max);
  }

  const tagStr = tags.join(" ").toLowerCase();
  const scored = GUIDES.filter((g) => !exclude.has(g.slug)).map((guide) => {
    let score = 0;
    const slug = guide.slug.toLowerCase();
    const title = guide.title.toLowerCase();
    for (const tag of tags) {
      const t = tag.toLowerCase();
      if (slug.includes(t)) score += 2;
      if (title.includes(t)) score += 1;
    }
    return { guide, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map((s) => s.guide);
}

function buildDestinationLinks(
  country: string | undefined,
  region: string | undefined,
): DestinationLink[] {
  const links: DestinationLink[] = [];

  if (country) {
    links.push({
      href: `/retreats/country/${slugify(country)}`,
      label: `All ${country} Retreats`,
    });
  }

  if (region) {
    links.push({
      href: `/retreats/region/${slugify(region)}`,
      label: `All ${region} Retreats`,
    });
  }

  // Always link to the destinations index
  links.push({
    href: "/destinations",
    label: "Browse All Destinations",
  });

  return links;
}

/* ═══ Component ═══ */

export default function ExploreMore({
  context,
  maxTypes = 6,
  maxGuides = 3,
  showHeader = true,
}: ExploreMoreProps) {
  const typeLinks = pickTypes(context.currentType, context.specialtyTags, maxTypes);
  const guideLinks = pickGuides(context.relatedGuideSlugs, context.specialtyTags, maxGuides);
  const destinationLinks = buildDestinationLinks(context.country, context.region);

  const hasContent = typeLinks.length > 0 || guideLinks.length > 0 || destinationLinks.length > 0;
  if (!hasContent) return null;

  return (
    <section className="border-t border-white/[0.04] pt-16 pb-8">
      {showHeader && (
        <div className="mb-10">
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">
            Explore More
          </p>
          <h2 className="mt-3 font-serif text-2xl font-light text-white sm:text-3xl">
            Continue Your Search
          </h2>
        </div>
      )}

      <div className="grid gap-10 md:grid-cols-3">
        {/* Retreat Types */}
        {typeLinks.length > 0 && (
          <div>
            <h3 className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500/80">
              By Type
            </h3>
            <div className="mt-4 flex flex-col gap-2.5">
              {typeLinks.map((t) => (
                <a
                  key={t.slug}
                  href={`/retreats/type/${t.slug}`}
                  className="group flex items-center gap-2 text-[13px] text-dark-300 transition-colors duration-300 hover:text-gold-400"
                >
                  <span className="inline-block h-px w-3 bg-dark-600 transition-all duration-300 group-hover:w-5 group-hover:bg-gold-500" />
                  {t.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Destinations */}
        {destinationLinks.length > 0 && (
          <div>
            <h3 className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500/80">
              By Destination
            </h3>
            <div className="mt-4 flex flex-col gap-2.5">
              {destinationLinks.map((d) => (
                <a
                  key={d.href}
                  href={d.href}
                  className="group flex items-center gap-2 text-[13px] text-dark-300 transition-colors duration-300 hover:text-gold-400"
                >
                  <span className="inline-block h-px w-3 bg-dark-600 transition-all duration-300 group-hover:w-5 group-hover:bg-gold-500" />
                  {d.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Guides */}
        {guideLinks.length > 0 && (
          <div>
            <h3 className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500/80">
              Curated Guides
            </h3>
            <div className="mt-4 flex flex-col gap-2.5">
              {guideLinks.map((g) => (
                <a
                  key={g.slug}
                  href={`/guides/${g.slug}`}
                  className="group flex items-center gap-2 text-[13px] text-dark-300 transition-colors duration-300 hover:text-gold-400"
                >
                  <span className="inline-block h-px w-3 bg-dark-600 transition-all duration-300 group-hover:w-5 group-hover:bg-gold-500" />
                  {g.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
