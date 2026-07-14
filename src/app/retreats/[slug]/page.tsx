import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllRetreats, getRetreatBySlug, getRetreatAwards, getRetreatVideos, getSimilarRetreats, getEditorialReview, getRetreatReviews, deriveReviewThemes, getRetreatFaqs } from "@/lib/data";
import { getRetreatImage, isVerifiedPropertyPhoto } from "@/lib/retreat-images";
import YouTubeFacade from "@/components/YouTubeFacade";
import SimilarRetreats from "@/components/SimilarRetreats";
import EditorialReview from "@/components/EditorialReview";
import GuestSentiment from "@/components/GuestSentiment";
import { generateRetreatSummary, generateRetreatFaqs, generateMetaDescription } from "@/lib/retreat-summary";
import { GUIDES } from "@/data/guides";

// On Vercel Pro: pre-build all 9,289 retreats at build time.
// The module-scope cache in src/lib/data.ts keeps this fast (single Supabase fetch).
export const revalidate = 3600; // refresh every hour

// Explicitly allow on-demand rendering for any slug not returned by
// generateStaticParams at build time (e.g. slugs added after the build,
// or slugs missed due to a truncated bulk fetch). getRetreatBySlug has a
// direct-Supabase fallback so on-demand renders can still find the data
// even when it wasn't in the prebuilt cache.
export const dynamicParams = true;

export async function generateStaticParams() {
  // Pre-render the top 500 retreats by WRD score at build time.
  // Remaining ~8,900 pages render on-demand via ISR (dynamicParams = true).
  // Falls back to [] if Supabase times out during the build.
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { fetch: (url, opts) => fetch(url, { ...opts, signal: AbortSignal.timeout(30_000) }) } }
    );
    const { data, error } = await client
      .from("retreats")
      .select("slug")
      .order("wrd_score", { ascending: false })
      .limit(500);
    if (error || !data) return [];
    return data.map((r: { slug: string }) => ({ slug: r.slug }));
  } catch {
    // Supabase timeout or network error — fall back to full on-demand ISR
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const retreat = await getRetreatBySlug(slug);
  if (!retreat) return { title: "Retreat Not Found" };

  const description = generateMetaDescription(retreat);

  const publicScore = isScorePublic(retreat.wrd_score);

  return {
    title: `${retreat.name} Review — ${publicScore ? `Rated ${retreat.wrd_score}/10` : "Listed"} (${retreat.score_tier === "elite" ? "Elite" : retreat.score_tier === "exceptional" ? "Exceptional" : "Recommended"})`,
    description,
    alternates: { canonical: `/retreats/${slug}` },
    openGraph: {
      title: `${retreat.name} — ${publicScore ? `${retreat.wrd_score}/10 Vault Score` : "Listed"}`,
      description,
      images: [{ url: getRetreatImage(retreat) }],
    },
  };
}
import { CATEGORY_LABELS, SCORE_WEIGHTS, RetreatScores, isScorePublic, getTierLabel } from "@/lib/types";
import ScoreBar from "@/components/ScoreBar";
import WrdScore from "@/components/WrdScore";
import TierBadge from "@/components/TierBadge";
import AnimateIn, { StaggerContainer, StaggerItem } from "@/components/AnimateIn";
import dynamic from "next/dynamic";
const RadarChart = dynamic(() => import("@/components/RadarChart"), { ssr: false });
import VaultVsGuest from "@/components/VaultVsGuest";
import RealCostCalculator from "@/components/RealCostCalculator";
import { BestForChips } from "@/components/BestForTags";
import StickyMobileBar from "@/components/StickyMobileBar";
import AddToCompareButton from "@/components/AddToCompareButton";
import EmailCapture from "@/components/EmailCapture";
import {
  LongevityPanel, DigitalDetoxPanel, RoiCalculator,
  SleepSciencePanel, IdealGuestCard, SeasonalChart,
  ScoreSparkline, SeventyTwoHourCard,
} from "@/components/IntelligencePanels";
import {
  deriveLongevityIndex, deriveDigitalDetoxScore, deriveRoiData,
  deriveSleepScience, deriveIdealGuestProfile,
  deriveSeasonalData, deriveScoreHistory, derive72HourEffect,
} from "@/lib/retreat-intelligence";


export default async function RetreatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const retreat = await getRetreatBySlug(slug);
  if (!retreat) notFound();

  const [awards, videos, similarRetreats] = await Promise.all([
    getRetreatAwards(retreat.id),
    getRetreatVideos(retreat.id),
    getSimilarRetreats(retreat),
  ]);

  const editorialReview = await getEditorialReview(retreat.id);
  const guestReviews = await getRetreatReviews(retreat.id);
  const reviewThemes = deriveReviewThemes(guestReviews);

  const scoreEntries = Object.entries(retreat.scores) as [keyof RetreatScores, (typeof retreat.scores)[keyof RetreatScores]][];
  const sortedScores = [...scoreEntries].sort(([, a], [, b]) => b.score - a.score);
  // Derive proprietary intelligence
  const longevity = deriveLongevityIndex(retreat);
  const detox = deriveDigitalDetoxScore(retreat);
  const roi = deriveRoiData(retreat);
  const sleepScience = deriveSleepScience(retreat);
  const idealGuest = deriveIdealGuestProfile(retreat);
  const seasonal = deriveSeasonalData(retreat);
  const scoreHistory = deriveScoreHistory(retreat);
  const effect72 = derive72HourEffect(retreat);

  const editorialSummary = generateRetreatSummary(retreat);
  // Prefer AI-generated FAQs from Supabase, fall back to template-generated
  const aiFaqs = await getRetreatFaqs(retreat.id);
  const faqs = aiFaqs.length > 0 ? aiFaqs : generateRetreatFaqs(retreat);

  const matchingGuides = GUIDES.filter((g) => g.filters(retreat));

  // Copyright-safe imagery only. getRetreatImage returns the retreat's own
  // Unsplash photo, or a free, commercially licensed Unsplash fallback keyed to
  // the location — never a hotlinked third-party (bookretreats.com / retreat.guru)
  // image. Gallery is restricted to known-safe sources; scraped URLs are dropped.
  const heroImage = getRetreatImage(retreat);
  const hasImage = heroImage.startsWith("http");
  // Photo-reality: full-bleed is reserved for photos of the actual property
  // (local assets / official-photos bucket). Every Unsplash/Pexels hero —
  // curated or keyed fallback — is stock by definition and gets the honest
  // editorial split with the "official photos pending" caption. Today that
  // means nearly every page splits; full-bleed is the reward once official
  // photo outreach lands. (Cards use the looser isStockFallback instead.)
  const isVerifiedPhoto = isVerifiedPropertyPhoto(heroImage);
  const scorePublic = isScorePublic(retreat.wrd_score);
  const tierLabel = scorePublic ? getTierLabel(retreat.score_tier) : "Listed";
  const isTopTier = scorePublic && (retreat.score_tier === "elite" || retreat.score_tier === "exceptional");
  const locationLine = [retreat.city, retreat.country].filter(Boolean).join(", ");
  const propertyType = (retreat.property_type && retreat.property_type.length
    ? retreat.property_type
    : [retreat.property_size]
  )
    .filter(Boolean)
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(", ");
  const priceBand =
    retreat.price_min_per_night > 0
      ? `$${retreat.price_min_per_night.toLocaleString()}–$${retreat.price_max_per_night.toLocaleString()} / night`
      : "Price on request";
  const airportLine = retreat.nearest_airport
    ? `${retreat.nearest_airport}${retreat.airport_distance_km ? ` (${Math.round(retreat.airport_distance_km)} km)` : ""}`
    : "";
  const identityItems = [
    { label: "Location", value: locationLine },
    { label: "Property", value: propertyType },
    { label: "Rate", value: priceBand },
    { label: "Nearest airport", value: airportLine },
  ].filter((i) => i.value);
  const galleryImages = (retreat.gallery_images || []).filter(
    (img: string) =>
      img?.startsWith("https://images.unsplash.com/") ||
      img?.startsWith("https://images.pexels.com/")
  );

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.retreatvault.com" },
      { "@type": "ListItem", position: 2, name: "Directory", item: "https://www.retreatvault.com/retreats" },
      { "@type": "ListItem", position: 3, name: retreat.region, item: `https://www.retreatvault.com/retreats?region=${retreat.region}` },
      { "@type": "ListItem", position: 4, name: retreat.name },
    ],
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: retreat.name,
    description: retreat.subtitle,
    image: heroImage || undefined,
    brand: { "@type": "Brand", name: retreat.name },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: retreat.price_min_per_night,
      highPrice: retreat.price_max_per_night,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: retreat.website_url,
    },
    aggregateRating: retreat.google_rating > 0 ? {
      "@type": "AggregateRating",
      ratingValue: retreat.google_rating,
      bestRating: 5,
      worstRating: 1,
      reviewCount: retreat.google_review_count,
    } : undefined,
  };

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: retreat.name,
    description: retreat.subtitle,
    image: heroImage || undefined,
    url: retreat.website_url,
    address: {
      "@type": "PostalAddress",
      addressLocality: retreat.city,
      addressCountry: retreat.country,
    },
    geo: retreat.coordinates?.lat ? {
      "@type": "GeoCoordinates",
      latitude: retreat.coordinates.lat,
      longitude: retreat.coordinates.lng,
    } : undefined,
    aggregateRating: retreat.google_rating > 0 ? {
      "@type": "AggregateRating",
      ratingValue: retreat.google_rating,
      bestRating: 5,
      worstRating: 1,
      reviewCount: retreat.google_review_count,
    } : undefined,
    priceRange: `$${retreat.price_min_per_night}-$${retreat.price_max_per_night}`,
  };

  return (
    <div className="min-h-screen bg-cream-50 pb-16 md:pb-0">
      <StickyMobileBar
        retreatName={retreat.name}
        websiteUrl={retreat.website_url || null}
        score={retreat.wrd_score}
        priceMin={retreat.price_min_per_night}
        priceMax={retreat.price_max_per_night}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      {/* ════════════════ HERO — editorial luxury ════════════════ */}
      {/* Two states by photo-reality: a verified property photo goes full-bleed;
          any stock imagery gets the honest editorial split (duotone, "photos pending"). */}
      {isVerifiedPhoto ? (
        <section className="relative min-h-[68vh] overflow-hidden bg-cream-100 md:min-h-[80vh]">
          {hasImage && (
            <Image
              src={heroImage}
              alt={retreat.name}
              fill
              priority
              fetchPriority="high"
              sizes="100vw"
              quality={70}
              className="object-cover"
            />
          )}
          {/* Bottom scrim for legibility — warm ink, fading up to clear sky. */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 via-ink-900/10 to-transparent" />

          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-[1440px] px-6 pb-12 sm:px-10 md:pb-16 lg:px-16">
              <AnimateIn>
                {/* Chips sit above the scrim's strong zone — each carries its own
                    ink backdrop so they stay legible over bright imagery. */}
                <nav className="mb-6 flex w-fit flex-wrap items-center gap-2 rounded-full bg-ink-900/45 px-4 py-1.5 text-xs tracking-wide text-cream-100/90 backdrop-blur-sm">
                  <a href="/retreats" className="transition-colors hover:text-cream-50">Directory</a>
                  <span aria-hidden className="text-cream-100/40">/</span>
                  <a href={`/retreats?region=${retreat.region}`} className="transition-colors hover:text-cream-50">{retreat.region}</a>
                  <span aria-hidden className="text-cream-100/40">/</span>
                  <span className="text-cream-50">{retreat.name}</span>
                </nav>
              </AnimateIn>

              <AnimateIn delay={0.06}>
                <div className="mb-5 flex flex-wrap items-center gap-2.5">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur-sm ${isTopTier ? "border-gold/50 bg-ink-900/45 text-cream-50" : "border-cream-100/30 bg-ink-900/45 text-cream-50"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isTopTier ? "bg-gold" : "bg-sage-100"}`} />
                    {tierLabel}
                  </span>
                  {retreat.is_verified && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cream-100/30 bg-ink-900/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cream-50 backdrop-blur-sm">
                      <span className="h-1 w-1 rounded-full bg-sage-100" />
                      Verified
                    </span>
                  )}
                </div>
              </AnimateIn>

              <AnimateIn delay={0.1}>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cream-100/85">
                  {locationLine}
                </p>
              </AnimateIn>
              <AnimateIn delay={0.14}>
                <h1 className="mt-3 max-w-4xl font-display text-5xl leading-[1.02] tracking-tight text-cream-50 md:text-7xl">
                  {retreat.name}
                </h1>
              </AnimateIn>
              {retreat.subtitle && (
                <AnimateIn delay={0.2}>
                  <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-cream-100/85">
                    {retreat.subtitle}
                  </p>
                </AnimateIn>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-cream-50 text-ink-900">
          <div className="mx-auto grid max-w-[1440px] md:grid-cols-[3fr_2fr]">
            {/* Left 60% — the honest identity panel */}
            <div className="flex flex-col justify-center px-6 py-14 sm:px-10 md:py-24 lg:px-16">
              <AnimateIn>
                <nav className="mb-7 flex flex-wrap items-center gap-2 text-xs tracking-wide text-ink-500">
                  <a href="/retreats" className="transition-colors hover:text-ink-900">Directory</a>
                  <span aria-hidden className="text-cream-200">/</span>
                  <a href={`/retreats?region=${retreat.region}`} className="transition-colors hover:text-ink-900">{retreat.region}</a>
                  <span aria-hidden className="text-cream-200">/</span>
                  <span className="text-ink-700">{retreat.name}</span>
                </nav>
              </AnimateIn>

              <AnimateIn delay={0.06}>
                <div className="mb-5 flex flex-wrap items-center gap-2.5">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${isTopTier ? "border-gold/40 bg-gold/10 text-ink-900" : "border-sage-700/25 bg-sage-100 text-sage-700"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isTopTier ? "bg-gold" : "bg-sage-600"}`} />
                    {tierLabel}
                  </span>
                  {retreat.is_verified && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-700/25 bg-sage-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-sage-700">
                      <span className="h-1 w-1 rounded-full bg-sage-600" />
                      Verified
                    </span>
                  )}
                </div>
              </AnimateIn>

              <AnimateIn delay={0.1}>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sage-700">
                  {locationLine}
                </p>
              </AnimateIn>
              <AnimateIn delay={0.14}>
                <h1 className="mt-3 font-display text-4xl leading-[1.04] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
                  {retreat.name}
                </h1>
              </AnimateIn>
              {retreat.subtitle && (
                <AnimateIn delay={0.2}>
                  <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-700">
                    {retreat.subtitle}
                  </p>
                </AnimateIn>
              )}
            </div>

            {/* Right 40% — location imagery, muted duotone, honestly captioned */}
            <div className="relative min-h-[42vh] md:min-h-[70vh]">
              {hasImage && (
                <Image
                  src={heroImage}
                  alt=""
                  fill
                  loading="eager"
                  sizes="(max-width: 768px) 100vw, 40vw"
                  quality={70}
                  className="object-cover"
                  style={{ filter: "sepia(0.25) saturate(0.55)" }}
                />
              )}
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-cream-50/85 px-3 py-1 text-xs text-ink-500 backdrop-blur-sm">
                Location imagery — official photos pending
              </figcaption>
            </div>
          </div>
        </section>
      )}

      {/* ═══ IDENTITY STRIP ═══ */}
      <div className="bg-cream-50">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
          <dl className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-cream-200 py-4 text-sm text-ink-700">
            {identityItems.map((item, i) => (
              <div key={item.label} className="flex items-center gap-4">
                {i > 0 && <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-ink-500/40" />}
                <div className="flex items-baseline gap-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">{item.label}</dt>
                  <dd className={item.label === "Rate" ? "tabular-nums" : ""}>{item.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* ════════════════ CONTENT ════════════════ */}
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">

        {/* ═══ KEY STATS ═══ */}
        <StaggerContainer className="mt-12 mb-20 grid grid-cols-2 gap-4 sm:grid-cols-4" staggerDelay={0.08}>
          {[
            retreat.price_min_per_night > 0 ? { label: "Price Range", value: `$${retreat.price_min_per_night.toLocaleString()}\u2013$${retreat.price_max_per_night.toLocaleString()}`, sub: "per night" } : null,
            retreat.google_rating > 0 ? { label: "Google Rating", value: retreat.google_rating.toString(), sub: `${retreat.google_review_count} reviews`, star: true } : null,
            { label: "Minimum Stay", value: `${retreat.minimum_stay_nights || 1} night${(retreat.minimum_stay_nights || 1) > 1 ? "s" : ""}`, sub: retreat.pricing_model?.replace(/_/g, " ") || "per stay" },
            retreat.max_guests > 0 ? { label: "Property", value: retreat.property_size.charAt(0).toUpperCase() + retreat.property_size.slice(1), sub: `Max ${retreat.max_guests} guests` } : null,
          ].filter((s): s is NonNullable<typeof s> => s !== null).map((stat) => (
            <StaggerItem key={stat.label}>
              <div className="rounded-2xl bg-cream-100 p-6 ring-1 ring-cream-200">
                <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ink-500">{stat.label}</div>
                <div className="mt-2 flex items-center gap-1.5">
                  {stat.star && <svg className="h-4 w-4 text-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
                  <span className="font-display text-2xl tabular-nums text-ink-900">{stat.value}</span>
                </div>
                <div className="mt-1 text-[11px] capitalize text-ink-500">{stat.sub}</div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* ═══ EDITORIAL SUMMARY ═══ */}
        <AnimateIn className="mb-20">
          <div className="border-t border-cream-200 pt-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">Editorial Summary</p>
            <p className="mt-5 max-w-[65ch] font-display text-2xl leading-snug text-ink-900 md:text-[28px]">
              {editorialSummary}
            </p>
          </div>
        </AnimateIn>

        {/* ═══ SPARKLINE + IDEAL GUEST ═══ */}
        {/* Trajectory panel renders numeric scores — hide it entirely below the display gate. */}
        <div className="mb-20 space-y-14">
          {isScorePublic(retreat.wrd_score) && (
          <AnimateIn>
            <ScoreSparkline history={scoreHistory} categoryHighlights={(() => {
              const trend = scoreHistory[scoreHistory.length - 1].score - scoreHistory[0].score;
              const catLabels: Record<string, string> = {
                social_proof: "Reputation", amenities: "Amenities", medical: "Medical",
                sustainability: "Sustainability", pricing_value: "Value", spa: "Spa",
              };
              const age = retreat.founded_year ? 2026 - retreat.founded_year : 5;
              const maturity = Math.min(age / 10, 1);
              const highlights: { label: string; direction: "up" | "down"; amount: string }[] = [];
              if (maturity < 0.5) highlights.push({ label: "Reputation", direction: "up", amount: "+0.5" });
              else highlights.push({ label: "Sustainability", direction: "up", amount: "+0.2" });
              const medScore = retreat.scores.medical?.score || 0;
              if (medScore >= 8) highlights.push({ label: "Medical", direction: "up", amount: "+0.3" });
              else highlights.push({ label: "Amenities", direction: "up", amount: "+0.2" });
              highlights.push({ label: "Value", direction: "down", amount: "-0.2" });
              return highlights;
            })()} />
          </AnimateIn>
          )}
          <AnimateIn delay={0.1}>
            <IdealGuestCard profile={idealGuest} />
          </AnimateIn>
        </div>

        {/* ═══ EDITORIAL REVIEW ═══ */}
        {/* Stored AI prose bakes the numeric score into HTML — skip below the gate
            (regenerating the prose is the real fix if a sub-6.5 retreat gets a review). */}
        {editorialReview && isScorePublic(retreat.wrd_score) && (
          <AnimateIn className="mb-20">
            <EditorialReview
              retreatName={retreat.name}
              reviewHtml={editorialReview.reviewHtml}
              verdict={editorialReview.verdict}
              bestFor={editorialReview.bestFor}
              notIdealFor={editorialReview.notIdealFor}
              alternatives={editorialReview.alternatives}
              lastUpdated={editorialReview.lastUpdated}
            />
          </AnimateIn>
        )}

        {/* ═══ SCORE BREAKDOWN — lab-report panel (double-bezel enclosure) ═══ */}
        <AnimateIn className="mb-20">
          <div className="rounded-[2rem] bg-ink-900/[0.04] p-1.5 ring-1 ring-ink-900/5">
            <div className="rounded-[calc(2rem-0.375rem)] bg-cream-50 p-8 md:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sage-700">Analysis</p>

              {/* Headline number + tier pill + methodology link */}
              <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                <div className="flex items-center gap-4">
                  <WrdScore score={retreat.wrd_score} />
                  <TierBadge tier={retreat.score_tier} size="sm" />
                </div>
                <Link href="/methodology" className="shrink-0 text-[11px] font-medium tracking-wide text-sage-700 underline-offset-4 transition-colors hover:text-sage-600 hover:underline">
                  How we score&nbsp;&rarr;
                </Link>
              </div>

              {scorePublic ? (
                <>
                  <h2 className="mt-9 font-display text-3xl text-ink-900">Score Breakdown</h2>
                  <p className="mt-2 text-[12px] text-ink-500">15 categories, weighted by impact on the wellness experience</p>

                  <div className="mt-10 space-y-2.5">
                    {sortedScores.map(([key, cat]) => (
                      <ScoreBar key={key} score={cat.score} label={CATEGORY_LABELS[key]} weight={SCORE_WEIGHTS[key]} />
                    ))}
                  </div>
                </>
              ) : (
                // Display gate: when the composite is "Listed", category numbers stay
                // private too — no bars, no radar, just an honest designed state.
                <p className="mt-9 text-sm italic text-ink-500">
                  Full score breakdown available once this retreat completes verification.
                </p>
              )}
            </div>
          </div>
        </AnimateIn>

        {/* ═══ RADAR CHART + VAULT VS GUEST ═══ */}
        <div className="mb-20 grid gap-8 lg:grid-cols-2">
          {/* Radar plots numeric category scores — gated with the breakdown. */}
          {scorePublic && (
          <AnimateIn>
            <div className="rounded-[2rem] bg-cream-100 p-6 ring-1 ring-cream-200 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sage-700">Visual Profile</p>
              <h3 className="mt-2 font-display text-xl text-ink-900">Category Radar</h3>
              <div className="mt-4">
                <RadarChart scores={retreat.scores} name={retreat.name} />
              </div>
            </div>
          </AnimateIn>
          )}
          <AnimateIn delay={0.15}>
            <VaultVsGuest
              vaultScore={retreat.wrd_score}
              googleRating={retreat.google_rating}
              tripadvisorRating={retreat.tripadvisor_rating}
              googleCount={retreat.google_review_count}
              tripadvisorCount={retreat.tripadvisor_review_count}
            />
          </AnimateIn>
        </div>

        {/* ═══ PROPRIETARY INTELLIGENCE + ROI + 72-HOUR + GUEST SENTIMENT ═══ */}
        {/* Continuous cream — rule-separated editorial sections (Task 5). Panels
            stack full-width (heading-left / content-right on md+); no card grid. */}
        <div className="mb-20 space-y-14">
          <AnimateIn>
            <LongevityPanel data={longevity} />
          </AnimateIn>
          <AnimateIn>
            <SleepSciencePanel data={sleepScience} />
          </AnimateIn>
          <AnimateIn>
            <DigitalDetoxPanel data={detox} />
          </AnimateIn>
          <AnimateIn>
            <SeasonalChart months={seasonal} />
          </AnimateIn>
          <AnimateIn>
            <RoiCalculator data={roi} />
          </AnimateIn>
          <AnimateIn>
            <SeventyTwoHourCard effect={effect72} />
          </AnimateIn>
          {/* Guest Sentiment moved up into the cream zone (was below Analyst/FAQ). */}
          {(retreat.google_review_count > 0 || guestReviews.length > 0) && (
            <AnimateIn>
              <GuestSentiment
                retreatName={retreat.name}
                googleRating={retreat.google_rating}
                googleCount={retreat.google_review_count}
                tripadvisorRating={retreat.tripadvisor_rating}
                tripadvisorCount={retreat.tripadvisor_review_count}
                reviews={guestReviews}
                themes={reviewThemes}
              />
            </AnimateIn>
          )}
        </div>

        {/* ═══ REAL COST CALCULATOR ═══ */}
        <AnimateIn className="mb-20">
          <RealCostCalculator
            retreatName={retreat.name}
            priceMinPerNight={retreat.price_min_per_night}
            priceMaxPerNight={retreat.price_max_per_night}
            pricingModel={retreat.pricing_model}
            minimumStayNights={retreat.minimum_stay_nights}
            country={retreat.country}
            region={retreat.region}
            airportDistanceKm={retreat.airport_distance_km}
            nearestAirport={retreat.nearest_airport}
          />
        </AnimateIn>

        {/* ═══ ANALYST NOTES ═══ */}
        <AnimateIn className="mb-20">
          <div className="border-t border-cream-200 pt-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">Expert Review</p>
            <h2 className="mt-2 font-display text-3xl text-ink-900">Analyst Notes</h2>
            <StaggerContainer className="mt-8 grid gap-x-10 gap-y-0 sm:grid-cols-2" staggerDelay={0.05}>
              {sortedScores.map(([key, cat]) => cat.notes && (
                <StaggerItem key={key}>
                  <div className="border-b border-cream-200 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[12px] font-medium text-ink-700">{CATEGORY_LABELS[key]}</span>
                      <span className={`font-display text-lg tabular-nums ${cat.score >= 9 ? "text-sage-700" : cat.score >= 8 ? "text-sage-600" : "text-ink-500"}`}>
                        {cat.score.toFixed(1)}
                      </span>
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed text-ink-500">{cat.notes}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </AnimateIn>

        {/* ═══ FAQ ═══ */}
        <AnimateIn className="mb-20">
          <div className="border-t border-cream-200 pt-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">Common Questions</p>
            <h2 className="mt-2 font-display text-3xl text-ink-900">Frequently Asked</h2>
            <StaggerContainer className="mt-6 divide-y divide-cream-200 border-t border-cream-200" staggerDelay={0.06}>
              {faqs.map((faq, i) => (
                <StaggerItem key={i}>
                  <div className="py-5">
                    <h3 className="font-display text-[17px] text-ink-900">{faq.question}</h3>
                    <p className="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-ink-700">{faq.answer}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </AnimateIn>

        {/* ═══ GALLERY ═══ */}
        {galleryImages.length > 0 && (
          <AnimateIn className="mb-20">
            <div className="border-t border-cream-200 pt-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">Gallery</p>
              <h2 className="mt-2 font-display text-3xl text-ink-900">Visual Tour</h2>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {galleryImages.map((img: string, i: number) => (
                  <div key={i} className="group/g relative aspect-[4/3] overflow-hidden rounded-2xl bg-cream-100">
                    <Image
                      src={img}
                      alt={`${retreat.name} ${i + 1}`}
                      fill
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, 33vw"
                      quality={65}
                      className="object-cover transition-transform duration-[1s] ease-out group-hover/g:scale-110"
                    />
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>
        )}

        {/* ═══ REAL GUEST VIDEOS ═══ */}
        {videos.length > 0 && (
          <AnimateIn className="mb-20">
            <div className="border-t border-cream-200 pt-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">Real Guest Videos</p>
              <h2 className="mt-2 font-display text-3xl text-ink-900">See It For Yourself</h2>
              <p className="mt-2 text-[12px] text-ink-500">Independent reviews, vlogs, and walkthroughs from real visitors</p>
              <div className={`mt-8 grid gap-4 ${videos.length > 1 ? "sm:grid-cols-2" : "max-w-3xl"}`}>
                {videos.map((video) => (
                  <div key={video.video_id} className="overflow-hidden rounded-2xl bg-cream-100 ring-1 ring-cream-200">
                    <div className="relative aspect-video">
                      <YouTubeFacade videoId={video.video_id} title={video.title} />
                    </div>
                    <div className="p-4">
                      <h3 className="text-[13px] font-medium text-ink-900">{video.title}</h3>
                      <p className="mt-1 text-[11px] text-ink-500">{video.channel_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>
        )}

        {/* ═══ BEST FOR + TAGS ═══ */}
        <AnimateIn className="mb-20">
          <div className="border-t border-cream-200 pt-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">Best For</p>
            <div className="mt-4">
              <BestForChips retreat={retreat} />
            </div>
            <div className="mt-10 grid gap-10 sm:grid-cols-3">
              {[
                { title: "Specialties", items: retreat.specialty_tags, highlight: true },
                { title: "Dietary", items: retreat.dietary_options, highlight: false },
                { title: "Programs", items: retreat.program_types, highlight: false },
              ].map((section) => (
                <div key={section.title}>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">{section.title}</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {section.items.map((item) => (
                      <span
                        key={item}
                        className={`rounded-full px-3 py-1.5 text-[10px] font-medium capitalize ${
                          section.highlight ? "bg-sage-100 text-sage-700" : "bg-cream-100 text-ink-700 ring-1 ring-cream-200"
                        }`}
                      >
                        {item.replace(/-/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimateIn>

        {/* ═══ AWARDS ═══ */}
        {awards.length > 0 && (
          <AnimateIn className="mb-20">
            <div className="border-t border-cream-200 pt-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">Recognition</p>
              <h2 className="mt-2 font-display text-3xl text-ink-900">Awards</h2>
              <div className="mt-8">
                {awards.map((award, i) => (
                  <div key={i} className="flex items-center gap-5 border-b border-cream-200 py-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage-100">
                      <span aria-hidden className="text-sage-700">{"\u2726"}</span>
                    </div>
                    <div>
                      <span className="text-[14px] font-medium text-ink-900">{award.name}</span>
                      <span className="ml-3 text-[12px] text-ink-500">{award.year} &mdash; {award.issuing_body}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>
        )}

        {/* ═══ FEATURED IN GUIDES ═══ */}
        {matchingGuides.length > 0 && (
          <AnimateIn className="mb-20">
            <div className="border-t border-cream-200 pt-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">Featured In</p>
              <h2 className="mt-2 font-display text-3xl text-ink-900">Retreat Guides</h2>
              <p className="mt-2 text-[12px] text-ink-500">This retreat appears in {matchingGuides.length} curated {matchingGuides.length === 1 ? "guide" : "guides"}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {matchingGuides.map((g) => (
                  <a
                    key={g.slug}
                    href={`/guides/${g.slug}`}
                    className="rounded-full bg-sage-100 px-4 py-2 text-[11px] font-medium text-sage-700 transition-colors duration-150 ease-out hover:bg-sage-100/70"
                  >
                    {g.title}
                  </a>
                ))}
              </div>
            </div>
          </AnimateIn>
        )}

        {/* ═══ CTA — primary conversion moment ═══ */}
        <AnimateIn className="mb-24">
          <div className="rounded-[2rem] bg-cream-100 px-8 py-14 text-center ring-1 ring-cream-200 sm:px-16 sm:py-20">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-sage-700">Begin Your Journey</p>
            <h2 className="mt-4 font-display text-3xl text-ink-900 sm:text-4xl">
              Experience {retreat.name}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[13px] leading-relaxed text-ink-700">
              Visit their official website for current availability and booking.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={retreat.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-full bg-ink-900 py-3 pl-7 pr-3 text-sm font-medium text-cream-50 transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                Visit Official Site
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <svg className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </a>
              <AddToCompareButton
                retreat={{
                  id: retreat.id,
                  slug: retreat.slug,
                  name: retreat.name,
                  hero_image_url: heroImage,
                  wrd_score: retreat.wrd_score,
                }}
                variant="secondary"
              />
            </div>
          </div>
        </AnimateIn>

        {/* ═══ EMAIL CAPTURE ═══ */}
        <AnimateIn className="mb-20">
          <EmailCapture
            source="retreat_page"
            sourceDetail={retreat.slug}
            headline="Get Retreats Like This in Your Inbox"
            subtext="We'll send you underpriced retreats similar to this one. Plus new scores and insider intel."
          />
        </AnimateIn>

        {/* ═══ SIMILAR RETREATS ═══ */}
        <SimilarRetreats retreats={similarRetreats} region={retreat.region} />

        {/* ═══ EXPLORE MORE ═══ */}
        <AnimateIn className="mb-24">
          <div className="border-t border-cream-200 pt-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">Keep Exploring</p>
            <h2 className="mt-2 font-display text-3xl text-ink-900">Explore More</h2>
            <div className="mt-6 divide-y divide-cream-200 border-t border-cream-200">
              {[
                { href: `/retreats/region/${retreat.region.toLowerCase()}`, title: `More ${retreat.region} Retreats`, sub: "Browse the full directory" },
                { href: "/compare", title: "Compare Retreats", sub: "Side-by-side analysis" },
                { href: "/quiz", title: "Find Your Perfect Retreat", sub: "Take the personalized quiz" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="group flex items-center justify-between gap-4 py-4 transition-colors duration-200 ease-out"
                >
                  <div>
                    <p className="text-sm font-medium text-ink-900 transition-colors duration-200 group-hover:text-sage-700">{l.title}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{l.sub}</p>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-ink-500 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-sage-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </AnimateIn>
      </div>
    </div>
  );
}
