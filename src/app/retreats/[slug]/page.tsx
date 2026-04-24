import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllRetreats, getRetreatBySlug, getRetreatAwards, getRetreatVideos, getSimilarRetreats, getEditorialReview, getRetreatReviews, deriveReviewThemes } from "@/lib/data";
import SimilarRetreats from "@/components/SimilarRetreats";
import EditorialReview from "@/components/EditorialReview";
import GuestSentiment from "@/components/GuestSentiment";
import { generateRetreatSummary, generateRetreatFaqs, generateMetaDescription } from "@/lib/retreat-summary";
import { GUIDES } from "@/data/guides";

// On Vercel Pro: pre-build all 9,289 retreats at build time.
// The module-scope cache in src/lib/data.ts keeps this fast (single Supabase fetch).
export const revalidate = 86400; // refresh stale pages once a day

// Explicitly allow on-demand rendering for any slug not returned by
// generateStaticParams at build time (e.g. slugs added after the build,
// or slugs missed due to a truncated bulk fetch). getRetreatBySlug has a
// direct-Supabase fallback so on-demand renders can still find the data
// even when it wasn't in the prebuilt cache.
export const dynamicParams = true;

export async function generateStaticParams() {
  const retreats = await getAllRetreats();
  return retreats.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const retreat = await getRetreatBySlug(slug);
  if (!retreat) return { title: "Retreat Not Found" };

  const description = generateMetaDescription(retreat);

  return {
    title: `${retreat.name} Review — Rated ${retreat.wrd_score}/10 (${retreat.score_tier === "elite" ? "Elite" : retreat.score_tier === "exceptional" ? "Exceptional" : "Recommended"})`,
    description,
    alternates: { canonical: `/retreats/${slug}` },
    openGraph: {
      title: `${retreat.name} — ${retreat.wrd_score}/10 Vault Score`,
      description,
      images: retreat.hero_image_url ? [{ url: retreat.hero_image_url }] : [],
    },
  };
}
import { CATEGORY_LABELS, SCORE_WEIGHTS, RetreatScores } from "@/lib/types";
import TierBadge from "@/components/TierBadge";
import WrdScore from "@/components/WrdScore";
import ScoreBar from "@/components/ScoreBar";
import AnimateIn, { StaggerContainer, StaggerItem } from "@/components/AnimateIn";
import dynamic from "next/dynamic";
const RadarChart = dynamic(() => import("@/components/RadarChart"), { ssr: false });
import VaultVsGuest from "@/components/VaultVsGuest";
import RealCostCalculator from "@/components/RealCostCalculator";
import { BestForChips } from "@/components/BestForTags";
import {
  LongevityPanel, DigitalDetoxPanel, RoiCalculator,
  SleepSciencePanel, IdealGuestCard, SeasonalChart,
  ScoreSparkline, SeventyTwoHourCard, HormoneHealthBadge,
} from "@/components/IntelligencePanels";
import {
  deriveLongevityIndex, deriveDigitalDetoxScore, deriveRoiData,
  deriveSleepScience, deriveHormoneHealthFlag, deriveIdealGuestProfile,
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
  const hasHormoneHealth = deriveHormoneHealthFlag(retreat);
  const idealGuest = deriveIdealGuestProfile(retreat);
  const seasonal = deriveSeasonalData(retreat);
  const scoreHistory = deriveScoreHistory(retreat);
  const effect72 = derive72HourEffect(retreat);

  const editorialSummary = generateRetreatSummary(retreat);
  const faqs = generateRetreatFaqs(retreat);

  const matchingGuides = GUIDES.filter((g) => g.filters(retreat));

  const hasImage = retreat.hero_image_url?.startsWith("http");
  const galleryImages = (retreat.gallery_images || []).filter((img: string) => img?.startsWith("http"));

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

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* ════════════════ HERO ════════════════ */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        {hasImage && (
          <Image
            src={retreat.hero_image_url as string}
            alt={retreat.name}
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            quality={70}
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-dark-950/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/30 to-dark-950/20" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-dark-950 to-transparent" />

        {/* Content pinned to bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="mx-auto max-w-[1440px] px-6 pb-16 sm:px-10 lg:px-16">
            <AnimateIn delay={0.2}>
              <nav className="mb-8 flex items-center gap-2 text-xs text-dark-300">
                <a href="/retreats" className="transition-colors hover:text-gold-400">Directory</a>
                <span className="text-dark-600">/</span>
                <a href={`/retreats?region=${retreat.region}`} className="transition-colors hover:text-gold-400">{retreat.region}</a>
                <span className="text-dark-600">/</span>
                <span className="text-white">{retreat.name}</span>
              </nav>
            </AnimateIn>

            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <AnimateIn delay={0.3}>
                  <div className="mb-4 flex items-center gap-3">
                    <TierBadge tier={retreat.score_tier} size="md" />
                    {retreat.is_verified && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-emerald-400">
                        <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        Verified
                      </span>
                    )}
                    {hasHormoneHealth && <HormoneHealthBadge />}
                  </div>
                </AnimateIn>
                <AnimateIn delay={0.35}>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-400/80">
                    {retreat.city}, {retreat.country}
                  </p>
                </AnimateIn>
                <AnimateIn delay={0.4}>
                  <h1 className="mt-3 font-serif text-4xl font-light text-white sm:text-5xl lg:text-6xl">
                    {retreat.name}
                  </h1>
                </AnimateIn>
                <AnimateIn delay={0.5}>
                  <p className="mt-4 max-w-xl text-[15px] font-light leading-relaxed text-dark-200">
                    {retreat.subtitle}
                  </p>
                </AnimateIn>
              </div>

              <AnimateIn delay={0.5} direction="left">
                <WrdScore score={retreat.wrd_score} size="xl" />
              </AnimateIn>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ CONTENT ════════════════ */}
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">

        {/* ═══ KEY STATS ═══ */}
        <StaggerContainer className="-mt-1 mb-20 grid grid-cols-2 gap-4 sm:grid-cols-4" staggerDelay={0.08}>
          {[
            { label: "Price Range", value: `$${retreat.price_min_per_night.toLocaleString()}\u2013$${retreat.price_max_per_night.toLocaleString()}`, sub: "per night" },
            { label: "Google Rating", value: retreat.google_rating.toString(), sub: `${retreat.google_review_count} reviews`, star: true },
            { label: "Minimum Stay", value: `${retreat.minimum_stay_nights} night${retreat.minimum_stay_nights > 1 ? "s" : ""}`, sub: retreat.pricing_model.replace(/_/g, " ") },
            { label: "Property", value: retreat.property_size.charAt(0).toUpperCase() + retreat.property_size.slice(1), sub: `Max ${retreat.max_guests} guests` },
          ].map((stat) => (
            <StaggerItem key={stat.label}>
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-dark-500">{stat.label}</div>
                <div className="mt-2 flex items-center gap-1.5">
                  {stat.star && <svg className="h-4 w-4 text-gold-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
                  <span className="font-serif text-2xl font-light text-white">{stat.value}</span>
                </div>
                <div className="mt-1 text-[11px] capitalize text-dark-400">{stat.sub}</div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* ═══ EDITORIAL SUMMARY ═══ */}
        <AnimateIn className="mb-20">
          <div className="rounded-3xl border border-white/[0.04] bg-white/[0.02] px-8 py-10 sm:px-12 sm:py-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-500">Editorial Summary</p>
            <p className="mt-5 font-serif text-[17px] font-light leading-[1.85] text-dark-200 sm:text-[18px]">
              {editorialSummary}
            </p>
          </div>
        </AnimateIn>

        {/* ═══ SPARKLINE + IDEAL GUEST ═══ */}
        <div className="mb-20 grid gap-6 sm:grid-cols-2">
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
          <AnimateIn delay={0.1}>
            <IdealGuestCard profile={idealGuest} />
          </AnimateIn>
        </div>

        {/* ═══ EDITORIAL REVIEW ═══ */}
        {editorialReview && (
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

        {/* ═══ SCORE BREAKDOWN ═══ */}
        <AnimateIn className="mb-20">
          <div className="rounded-3xl border border-white/[0.04] bg-white/[0.015] p-8 sm:p-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-500">Analysis</p>
            <h2 className="mt-3 font-serif text-3xl font-light text-white">Score Breakdown</h2>
            <div className="mt-2 flex items-center gap-3">
              <p className="text-[12px] text-dark-400">15 categories, weighted by impact on the wellness experience</p>
              <Link href="/methodology" className="shrink-0 text-[11px] font-medium text-gold-400 transition-colors hover:text-gold-300">
                How we score&nbsp;&rarr;
              </Link>
            </div>
            <div className="mt-10 space-y-2">
              {sortedScores.map(([key, cat]) => (
                <ScoreBar key={key} score={cat.score} label={CATEGORY_LABELS[key]} weight={SCORE_WEIGHTS[key]} />
              ))}
            </div>
          </div>
        </AnimateIn>

        {/* ═══ RADAR CHART + VAULT VS GUEST ═══ */}
        <div className="mb-20 grid gap-8 lg:grid-cols-2">
          <AnimateIn>
            <div className="rounded-3xl border border-white/[0.04] bg-white/[0.015] p-6 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-500">Visual Profile</p>
              <h3 className="mt-2 font-serif text-xl font-light text-white">Category Radar</h3>
              <div className="mt-4">
                <RadarChart scores={retreat.scores} name={retreat.name} />
              </div>
            </div>
          </AnimateIn>
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

        {/* ═══ PROPRIETARY INTELLIGENCE ═══ */}
        <div className="mb-20 grid gap-6 lg:grid-cols-2">
          <AnimateIn>
            <LongevityPanel data={longevity} />
          </AnimateIn>
          <AnimateIn delay={0.1}>
            <SleepSciencePanel data={sleepScience} />
          </AnimateIn>
          <AnimateIn delay={0.15}>
            <DigitalDetoxPanel data={detox} />
          </AnimateIn>
          <AnimateIn delay={0.2}>
            <SeasonalChart months={seasonal} />
          </AnimateIn>
        </div>

        {/* ═══ ROI CALCULATOR ═══ */}
        <AnimateIn className="mb-20">
          <RoiCalculator data={roi} />
        </AnimateIn>

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

        {/* ═══ THE 72-HOUR EFFECT ═══ */}
        <AnimateIn className="mb-20">
          <SeventyTwoHourCard effect={effect72} />
        </AnimateIn>

        {/* ═══ ANALYST NOTES ═══ */}
        <div className="mb-20">
          <AnimateIn>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-500">Expert Review</p>
            <h2 className="mt-3 font-serif text-3xl font-light text-white">Analyst Notes</h2>
          </AnimateIn>
          <StaggerContainer className="mt-8 grid gap-4 sm:grid-cols-2" staggerDelay={0.05}>
            {sortedScores.map(([key, cat]) => cat.notes && (
              <StaggerItem key={key}>
                <div className="rounded-2xl border border-white/[0.03] bg-white/[0.015] p-6 transition-all duration-500 hover:border-gold-500/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-dark-200">{CATEGORY_LABELS[key]}</span>
                    <span className={`font-serif text-lg ${cat.score >= 9 ? "text-gold-300" : cat.score >= 8 ? "text-gold-500" : "text-dark-300"}`}>
                      {cat.score.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-3 text-[12px] leading-relaxed text-dark-300">{cat.notes}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        {/* ═══ FAQ ═══ */}
        <div className="mb-20">
          <AnimateIn>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-500">Common Questions</p>
            <h2 className="mt-3 font-serif text-3xl font-light text-white">Frequently Asked</h2>
          </AnimateIn>
          <StaggerContainer className="mt-8 space-y-4" staggerDelay={0.06}>
            {faqs.map((faq, i) => (
              <StaggerItem key={i}>
                <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 sm:p-8">
                  <h3 className="font-serif text-[16px] font-medium text-white">{faq.question}</h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-dark-300">{faq.answer}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        {/* ═══ GUEST SENTIMENT ═══ */}
        {(retreat.google_review_count > 0 || guestReviews.length > 0) && (
          <AnimateIn className="mb-20">
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

        {/* ═══ GALLERY ═══ */}
        {galleryImages.length > 0 && (
          <AnimateIn className="mb-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-500">Gallery</p>
            <h2 className="mt-3 font-serif text-3xl font-light text-white">Visual Tour</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {galleryImages.map((img: string, i: number) => (
                <div key={i} className="group/g relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <Image
                    src={img}
                    alt={`${retreat.name} ${i + 1}`}
                    fill
                    loading="lazy"
                    sizes="(max-width: 640px) 100vw, 33vw"
                    quality={65}
                    className="object-cover transition-transform duration-[1s] group-hover/g:scale-110"
                  />
                  <div className="absolute inset-0 bg-dark-950/10 transition-opacity duration-500 group-hover/g:opacity-0" />
                </div>
              ))}
            </div>
          </AnimateIn>
        )}

        {/* ═══ REAL GUEST VIDEOS ═══ */}
        {videos.length > 0 && (
          <AnimateIn className="mb-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-500">Real Guest Videos</p>
            <h2 className="mt-3 font-serif text-3xl font-light text-white">See It For Yourself</h2>
            <p className="mt-2 text-[12px] text-dark-500">Independent reviews, vlogs, and walkthroughs from real visitors</p>
            <div className={`mt-8 grid gap-4 ${videos.length > 1 ? "sm:grid-cols-2" : "max-w-3xl"}`}>
              {videos.map((video) => (
                <div key={video.video_id} className="overflow-hidden rounded-2xl border border-white/[0.04] transition-all duration-300 hover:border-gold-500/15">
                  <div className="relative aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.video_id}?rel=0&modestbranding=1`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                      loading="lazy"
                    />
                  </div>
                  <div className="bg-white/[0.02] p-4">
                    <h3 className="text-[13px] font-medium text-white">{video.title}</h3>
                    <p className="mt-1 text-[11px] text-dark-400">{video.channel_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimateIn>
        )}

        {/* ═══ BEST FOR + TAGS ═══ */}
        <AnimateIn className="mb-20">
          {/* Best For tags */}
          <div className="mb-8">
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-500">Best For</h3>
            <BestForChips retreat={retreat} />
          </div>
          <div className="grid gap-10 sm:grid-cols-3">
            {[
              { title: "Specialties", items: retreat.specialty_tags, color: "border-gold-400/10 bg-gold-400/5 text-gold-300" },
              { title: "Dietary", items: retreat.dietary_options, color: "border-white/[0.06] bg-white/[0.02] text-dark-300" },
              { title: "Programs", items: retreat.program_types, color: "border-white/[0.06] bg-white/[0.02] text-dark-300" },
            ].map((section) => (
              <div key={section.title}>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-500">{section.title}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {section.items.map((item) => (
                    <span key={item} className={`rounded-full border px-3 py-1.5 text-[10px] font-medium capitalize ${section.color}`}>
                      {item.replace(/-/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </AnimateIn>

        {/* ═══ AWARDS ═══ */}
        {awards.length > 0 && (
          <AnimateIn className="mb-20">
            <div className="rounded-3xl border border-gold-400/8 bg-gradient-to-br from-white/[0.02] to-transparent p-8 sm:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-500">Recognition</p>
              <h2 className="mt-3 font-serif text-3xl font-light text-white">Awards</h2>
              <div className="mt-8 space-y-5">
                {awards.map((award, i) => (
                  <div key={i} className="flex items-center gap-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-400/20 bg-gold-400/10">
                      <span className="text-gold-400">{"\u2726"}</span>
                    </div>
                    <div>
                      <span className="text-[14px] font-medium text-white">{award.name}</span>
                      <span className="ml-3 text-[12px] text-dark-400">{award.year} &mdash; {award.issuing_body}</span>
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
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Featured In</p>
            <h2 className="mt-3 font-serif text-3xl font-light text-white">Retreat Guides</h2>
            <p className="mt-2 text-[12px] text-dark-500">This retreat appears in {matchingGuides.length} curated {matchingGuides.length === 1 ? "guide" : "guides"}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {matchingGuides.map((g) => (
                <a
                  key={g.slug}
                  href={`/guides/${g.slug}`}
                  className="rounded-full border border-gold-400/15 bg-gold-400/[0.05] px-4 py-2 text-[11px] font-medium text-gold-300 transition-all hover:border-gold-400/30 hover:bg-gold-400/[0.08]"
                >
                  {g.title}
                </a>
              ))}
            </div>
          </AnimateIn>
        )}

        {/* ═══ CTA ═══ */}
        <AnimateIn className="mb-24">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.04]">
            {hasImage && (
              <Image
                src={retreat.hero_image_url as string}
                alt=""
                fill
                loading="lazy"
                sizes="100vw"
                quality={65}
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" />
            <div className="relative px-10 py-20 text-center sm:px-16 sm:py-28">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-400">Begin Your Journey</p>
              <h2 className="mt-4 font-serif text-3xl font-light text-white sm:text-4xl">
                Experience {retreat.name}
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[13px] text-dark-300">
                Visit their official website for current availability and booking.
              </p>
              <div className="mt-8">
                <a href={retreat.website_url} target="_blank" rel="noopener noreferrer" className="btn-luxury">
                  Visit Official Site
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </AnimateIn>

        {/* ═══ SIMILAR RETREATS ═══ */}
        <SimilarRetreats retreats={similarRetreats} region={retreat.region} />

        {/* ═══ EXPLORE MORE ═══ */}
        <AnimateIn className="mb-24">
          <div className="rounded-3xl border border-white/[0.04] bg-white/[0.015] p-8 sm:p-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-500">Keep Exploring</p>
            <h2 className="mt-3 font-serif text-3xl font-light text-white">Explore More</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Link
                href={`/retreats/region/${retreat.region.toLowerCase()}`}
                className="group/link flex items-center justify-between rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 transition-all duration-300 hover:border-gold-500/15 hover:bg-white/[0.04]"
              >
                <div>
                  <p className="text-[13px] font-medium text-white">More {retreat.region} Retreats</p>
                  <p className="mt-1 text-[11px] text-dark-400">Browse the full directory</p>
                </div>
                <svg className="h-4 w-4 text-dark-400 transition-all duration-300 group-hover/link:translate-x-0.5 group-hover/link:text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/compare"
                className="group/link flex items-center justify-between rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 transition-all duration-300 hover:border-gold-500/15 hover:bg-white/[0.04]"
              >
                <div>
                  <p className="text-[13px] font-medium text-white">Compare Retreats</p>
                  <p className="mt-1 text-[11px] text-dark-400">Side-by-side analysis</p>
                </div>
                <svg className="h-4 w-4 text-dark-400 transition-all duration-300 group-hover/link:translate-x-0.5 group-hover/link:text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/quiz"
                className="group/link flex items-center justify-between rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 transition-all duration-300 hover:border-gold-500/15 hover:bg-white/[0.04]"
              >
                <div>
                  <p className="text-[13px] font-medium text-white">Find Your Perfect Retreat</p>
                  <p className="mt-1 text-[11px] text-dark-400">Take the personalized quiz</p>
                </div>
                <svg className="h-4 w-4 text-dark-400 transition-all duration-300 group-hover/link:translate-x-0.5 group-hover/link:text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </AnimateIn>
      </div>
    </div>
  );
}
