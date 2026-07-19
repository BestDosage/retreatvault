import type { Metadata } from "next";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Best Wellness Retreats 2026 — Rated & Ranked | RetreatVault",
  description:
    "9,400+ wellness retreats scored across 15 categories. Compare luxury spas, medical clinics, yoga ashrams & detox centers. Scores are never for sale.",
};

import Image from "next/image";
import Link from "next/link";
import { getFeaturedRetreats, getRegionCounts, getTopRetreatPerRegion } from "@/lib/data";
import { isScorePublic } from "@/lib/types";
import { getRetreatImage, sizedImageUrl } from "@/lib/retreat-images";
import AnimateIn, { StaggerContainer, StaggerItem, Counter, Marquee } from "@/components/AnimateIn";
import TierBadge from "@/components/TierBadge";
import PressStrip from "@/components/PressStrip";
import EmailCapture from "@/components/EmailCapture";
import type { WellnessRetreat } from "@/lib/types";

// Ambient hero imagery — a serene place-based resort scene (tropical pool at
// dusk), used as pure atmosphere. IMPORTANT: this is stock (Unsplash); it is
// never captioned as any specific retreat's property. Real property heroes
// live on the detail pages.
const HERO_IMAGE = "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&h=1500&fit=crop&auto=format&q=70";

// ═══ small arrow-circle CTA pill (matches detail-page primary CTA) ═══
function ArrowCircle({ className = "" }: { className?: string }) {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cream-50/15">
      <svg className={`h-4 w-4 transition-transform duration-150 ease-out ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </span>
  );
}

// ═══ compact editorial retreat card (cream) — stacked in featured column ═══
function CompactCard({ retreat }: { retreat: WellnessRetreat }) {
  const scorePublic = isScorePublic(retreat.wrd_score);
  return (
    <Link
      href={`/retreats/${retreat.slug}`}
      className="group flex items-center gap-4 rounded-2xl bg-cream-100 p-3 ring-1 ring-cream-200 transition-all duration-300 ease-out hover:ring-sage-600/30 sm:gap-5 sm:p-4"
    >
      <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl sm:w-28">
        <Image
          src={sizedImageUrl(getRetreatImage(retreat), 760, 570)}
          alt=""
          fill
          loading="lazy"
          sizes="112px"
          quality={65}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">{retreat.city || retreat.country}</p>
        <h3 className="mt-1 truncate font-display text-lg leading-tight text-ink-900">{retreat.name}</h3>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-500">
          <span className="font-display text-base tabular-nums text-ink-900">
            {scorePublic ? retreat.wrd_score.toFixed(1) : "—"}
          </span>
          <span className="tracking-[0.15em] uppercase text-[9px]">{scorePublic ? "Vault score" : "Listed"}</span>
          {retreat.price_min_per_night > 0 && (
            <>
              <span aria-hidden className="h-1 w-1 rounded-full bg-ink-500/40" />
              <span className="tabular-nums">${retreat.price_min_per_night.toLocaleString()}/nt</span>
            </>
          )}
        </div>
      </div>
      <svg className="hidden h-4 w-4 shrink-0 text-ink-500 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-sage-700 sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default async function HomePage() {
  const [retreats, regions, topByRegion] = await Promise.all([
    getFeaturedRetreats(12),
    getRegionCounts(),
    getTopRetreatPerRegion(),
  ]);
  const featured = retreats.slice(0, 8);
  const feature = featured[0];
  const featureStacked = featured.slice(1, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RetreatVault",
    url: "https://www.retreatvault.com",
    logo: "https://www.retreatvault.com/logo.png",
    description:
      "The world's most rigorous wellness retreat rating system. 15 weighted categories. Zero bias.",
    sameAs: [],
    parentOrganization: {
      "@type": "Organization",
      name: "BestDosage LLC",
      url: "https://bestdosage.com",
    },
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "RetreatVault",
    url: "https://www.retreatvault.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.retreatvault.com/retreats?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const speakableJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "RetreatVault — 9,400+ Wellness Retreats. Every One Scored.",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".hero-description"],
    },
    url: "https://www.retreatvault.com",
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the best wellness retreat for beginners?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "For first-timers, the best wellness retreats combine structured programming with a welcoming, non-intimidating environment. RetreatVault recommends looking for retreats that score highly in programming depth and community culture — two of our 15 scored categories. Top-rated beginner-friendly options include resorts in Costa Rica, Bali, and Tuscany that offer flexible itineraries, beginner yoga classes, nutrition counseling, and guided nature activities. See our First-Timers guide at retreatvault.com/guides/best-retreats-for-first-timers for a curated shortlist.",
        },
      },
      {
        "@type": "Question",
        name: "How much does a wellness retreat cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Wellness retreat costs vary widely by region, duration, and program type. Budget retreats typically run $500 to $1,500 per week (Southeast Asia, Central America). Mid-range retreats cost $1,500 to $3,500 per week (Europe, Mexico, US). Luxury retreats range from $3,500 to $10,000 per week, while ultra-luxury medical and longevity retreats can exceed $10,000 per week. These figures cover accommodation and programming — airfare, transfers, and personal expenses add 20 to 40% to the total. RetreatVault's real cost calculator on each retreat profile shows the true all-in cost.",
        },
      },
      {
        "@type": "Question",
        name: "What should I pack for a wellness retreat?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "For a wellness retreat, pack comfortable activewear for yoga and fitness classes, layers for early morning and evening sessions, a reusable water bottle, a journal, any prescription medications, and basic toiletries (many retreats provide natural products). Leave alcohol, heavily processed snacks, and work devices at home — most wellness retreats encourage digital detox. Medical retreats may require bloodwork or health records in advance. Check with your specific retreat for any program-specific requirements like white clothing for certain meditation practices.",
        },
      },
      {
        "@type": "Question",
        name: "How long should a wellness retreat be?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The minimum effective duration for a wellness retreat is 5 to 7 days — enough time to detox from daily stress and begin absorbing the program. Research and guest data suggest 7 to 14 days produces the most lasting behavioral changes, especially for detox, stress recovery, and habit formation programs. Weekend retreats of 2 to 3 days can be useful for introduction experiences but rarely produce sustained transformation. For medical or longevity programs, 2 to 4 weeks is common. RetreatVault's 72-Hour Effect panel on each retreat profile explains what typically shifts in the first three days of each program.",
        },
      },
      {
        "@type": "Question",
        name: "What is the difference between a yoga retreat and a wellness retreat?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A yoga retreat focuses primarily on yoga practice — asana, pranayama, meditation, and sometimes yoga philosophy — often at an ashram or dedicated yoga center. A wellness retreat is broader, integrating multiple modalities: nutrition, fitness, spa treatments, sleep optimization, mental health support, and medical services alongside or instead of yoga. Wellness retreats typically offer more personalization and a wider menu of programs. Many wellness retreats include yoga as one component of a comprehensive program. RetreatVault scores both types across the same 15 categories so you can compare them objectively.",
        },
      },
    ],
  };

  return (
    <div className="bg-cream-50 text-ink-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([jsonLd, websiteJsonLd, speakableJsonLd, faqJsonLd]),
        }}
      />

      {/* ══════════════════════════════════════════════════
          1. HERO — split editorial, anti-center
          Left: value-prop headline + subline + entry. Right: ambient image.
          Single column < md (text first, image second).
          ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-cream-50">
        <div className="mx-auto grid max-w-[1440px] md:grid-cols-[1.05fr_0.95fr]">
          {/* Left — the argument */}
          <div className="flex flex-col justify-center px-6 pb-16 pt-36 sm:px-10 md:pb-24 md:pt-44 lg:px-16">
            <AnimateIn>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sage-700">
                Independent wellness ratings · Est. 2026
              </p>
            </AnimateIn>
            <AnimateIn delay={0.08}>
              <h1 className="mt-6 max-w-2xl font-display text-[clamp(2.4rem,5.4vw,4.4rem)] leading-[1.03] tracking-tight text-ink-900">
                <span className="tabular-nums">9,408</span> wellness retreats.
                <br />
                Scored like they matter.
              </h1>
            </AnimateIn>
            <AnimateIn delay={0.16}>
              <p className="hero-description mt-7 max-w-md text-[15px] leading-relaxed text-ink-700">
                Every property graded across 15 weighted categories — the WRD
                methodology. Scores are never for sale: retreats pay us when you book,
                and the score doesn&rsquo;t move.
              </p>
            </AnimateIn>

            <AnimateIn delay={0.24}>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a
                  href="/retreats"
                  className="group inline-flex items-center gap-3 rounded-full bg-ink-900 py-3 pl-7 pr-3 text-sm font-medium text-cream-50 transition-transform duration-150 ease-out active:scale-[0.97]"
                >
                  Browse all retreats
                  <ArrowCircle className="group-hover:translate-x-0.5" />
                </a>
                <a
                  href="/quiz"
                  className="inline-flex items-center gap-2 rounded-full border border-sage-700/25 px-6 py-3 text-sm font-medium text-sage-700 transition-colors duration-200 ease-out hover:bg-sage-100"
                >
                  Take the 2-minute quiz
                </a>
              </div>
            </AnimateIn>

            {/* trust ledger — tabular, lab-report tone */}
            <AnimateIn delay={0.32}>
              <dl className="mt-14 flex flex-wrap gap-x-10 gap-y-5 border-t border-cream-200 pt-8">
                {[
                  { v: "9,408", l: "Retreats scored" },
                  { v: "15", l: "Weighted categories" },
                  { v: "Never", l: "Scores for sale" },
                ].map((s) => (
                  <div key={s.l}>
                    <dt className="font-display text-2xl tabular-nums text-ink-900">{s.v}</dt>
                    <dd className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500">{s.l}</dd>
                  </div>
                ))}
              </dl>
            </AnimateIn>
          </div>

          {/* Right — ambient imagery (stock; never attributed to a property).
              Natural DOM order keeps text first / image second on mobile. */}
          <div className="relative min-h-[46vh] md:min-h-[88vh]">
            <Image
              src={HERO_IMAGE}
              alt=""
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 768px) 100vw, 48vw"
              quality={72}
              className="object-cover"
            />
            {/* soft warm wash tying stock imagery into the cream system */}
            <div className="absolute inset-0 bg-gradient-to-t from-cream-50/25 via-transparent to-cream-50/10 md:bg-gradient-to-l md:from-transparent md:via-transparent md:to-cream-50/30" />
          </div>
        </div>
      </section>

      {/* ═══ PRESS STRIP — quiet grayscale credibility ═══ */}
      <PressStrip />

      {/* ══════════════════════════════════════════════════
          2. FEATURED — asymmetric: one large feature + stacked smaller
          ══════════════════════════════════════════════════ */}
      <section id="featured" className="py-24 md:py-32">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
          <div className="grid items-end gap-6 border-b border-cream-200 pb-10 sm:grid-cols-2">
            <div>
              <AnimateIn>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">The Collection</p>
              </AnimateIn>
              <AnimateIn delay={0.08}>
                <h2 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-ink-900 sm:text-5xl">
                  Highest rated<br />in the vault
                </h2>
              </AnimateIn>
            </div>
            <AnimateIn delay={0.12}>
              <div className="flex items-center justify-between gap-6 sm:justify-end">
                <p className="max-w-xs text-[13px] leading-relaxed text-ink-500">
                  Independently scored. Scores are never for sale — the top of the ranking, every quarter.
                </p>
                <a href="/retreats" className="hidden shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700 transition-colors hover:text-sage-600 sm:block">
                  View all →
                </a>
              </div>
            </AnimateIn>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* Large editorial feature */}
            {feature && (
              <AnimateIn className="h-full">
                {/* Image honesty: imagery is ambience only — name/location/score live
                    in the cream caption body below, never on the photo itself. */}
                <Link
                  href={`/retreats/${feature.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-cream-100 ring-1 ring-cream-200 transition-all duration-300 ease-out hover:ring-sage-600/30"
                >
                  <div className="relative min-h-[300px] flex-1 overflow-hidden sm:min-h-[360px]">
                    <Image
                      src={sizedImageUrl(getRetreatImage(feature), 760, 570)}
                      alt=""
                      fill
                      loading="lazy"
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      quality={70}
                      className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                      style={{ filter: "sepia(0.15) saturate(0.7)" }}
                    />
                    <div className="absolute left-5 top-5">
                      <TierBadge tier={feature.score_tier} size="sm" />
                    </div>
                    <span className="absolute bottom-4 right-4 rounded-full bg-ink-900/40 px-3 py-1 text-[10px] tracking-wide text-cream-50/80 backdrop-blur-sm">
                      Representative imagery
                    </span>
                  </div>

                  {/* Editorial caption body — cream surface */}
                  <div className="p-6 sm:p-8">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sage-700">
                      {[feature.city, feature.country].filter(Boolean).join(", ")}
                    </p>
                    <h3 className="mt-2 max-w-lg font-display text-3xl leading-tight text-ink-900 sm:text-4xl">
                      {feature.name}
                    </h3>
                    {feature.subtitle && (
                      <p className="mt-3 max-w-md text-[13px] leading-relaxed text-ink-700 line-clamp-2">
                        {feature.subtitle}
                      </p>
                    )}
                    <div className="mt-5 flex items-center gap-4 border-t border-cream-200 pt-5">
                      <span className="font-display text-3xl tabular-nums text-ink-900">
                        {isScorePublic(feature.wrd_score) ? feature.wrd_score.toFixed(1) : "Listed"}
                      </span>
                      {isScorePublic(feature.wrd_score) && (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500">
                          Vault score / 10
                        </span>
                      )}
                      {feature.price_min_per_night > 0 && (
                        <span className="ml-auto text-[13px] tabular-nums text-ink-700">
                          from ${feature.price_min_per_night.toLocaleString()}/night
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </AnimateIn>
            )}

            {/* Stacked smaller */}
            <StaggerContainer className="flex flex-col gap-4">
              {featureStacked.map((r) => (
                <StaggerItem key={r.id}>
                  <CompactCard retreat={r} />
                </StaggerItem>
              ))}
              <StaggerItem>
                <a
                  href="/retreats"
                  className="group flex items-center justify-between rounded-2xl border border-dashed border-cream-200 px-5 py-5 text-sm font-medium text-ink-700 transition-colors duration-200 ease-out hover:border-sage-600/40 hover:text-sage-700"
                >
                  Explore all 9,408 retreats
                  <svg className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          3. THE METHOD — rule-separated editorial rows (no card row)
          ══════════════════════════════════════════════════ */}
      <section id="how-it-works" className="border-t border-cream-200 py-24 md:py-32">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
          <div className="grid gap-6 sm:grid-cols-2 sm:items-end">
            <div>
              <AnimateIn>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">The Method</p>
              </AnimateIn>
              <AnimateIn delay={0.08}>
                <h2 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-ink-900 sm:text-5xl">
                  How we rate<br />every retreat
                </h2>
              </AnimateIn>
            </div>
            <AnimateIn delay={0.12}>
              <p className="max-w-sm text-[14px] leading-relaxed text-ink-700 sm:justify-self-end">
                A framework built on the Independence Charter — not influencer opinion,
                not paid review. Verifiable evidence only.
              </p>
            </AnimateIn>
          </div>

          <StaggerContainer className="mt-14">
            {[
              {
                step: "01",
                title: "Deep research",
                desc: "Every retreat is analyzed across 15 categories — nutrition, fitness, medical, spa, sleep, sustainability and nine more — with up to 8 sub-criteria each.",
                detail: "15 categories · 120+ data points",
              },
              {
                step: "02",
                title: "Independent scoring",
                desc: "Each sub-criterion is scored 1–10 against verifiable evidence: menus, staff credentials, certifications, real guest reviews. No self-reported data accepted.",
                detail: "Never for sale · Zero affiliate bias",
              },
              {
                step: "03",
                title: "Weighted Vault score",
                desc: "Category scores are weighted by impact on the wellness experience into a single Vault Score out of 10, then tiered — Elite, Exceptional, Recommended.",
                detail: "Weighted formula · Updated quarterly",
              },
            ].map((item) => (
              <StaggerItem key={item.step}>
                <div className="grid gap-4 border-t border-cream-200 py-9 md:grid-cols-[auto_1fr_auto] md:items-baseline md:gap-10">
                  <span className="font-display text-4xl tabular-nums text-sage-700/40 md:text-5xl">{item.step}</span>
                  <div>
                    <h3 className="font-display text-2xl text-ink-900">{item.title}</h3>
                    <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-ink-700">{item.desc}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500 md:text-right">{item.detail}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          4. THE MARKET — lab-report stat band
          ══════════════════════════════════════════════════ */}
      <section className="border-t border-cream-200 py-24 md:py-32">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
          <div className="max-w-2xl">
            <AnimateIn>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">The Market</p>
            </AnimateIn>
            <AnimateIn delay={0.08}>
              <h2 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-ink-900 sm:text-5xl">
                Wellness is not a trend. It&rsquo;s the economy.
              </h2>
            </AnimateIn>
          </div>

          <AnimateIn delay={0.14}>
            <div className="mt-12 rounded-[2rem] bg-cream-100 p-1.5 ring-1 ring-cream-200">
              <StaggerContainer className="grid grid-cols-2 divide-cream-200 rounded-[calc(2rem-0.375rem)] bg-cream-50 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  { target: 6.8, prefix: "$", suffix: "T", label: "Global Wellness Economy", sub: "6.12% of world GDP" },
                  { target: 651, prefix: "$", suffix: "B", label: "Wellness Tourism", sub: "8–12% CAGR to 2033" },
                  { target: 248, prefix: "$", suffix: "B", label: "Retreat Market 2025", sub: "Projected $363B by 2029" },
                  { target: 78, prefix: "", suffix: "%", label: "Women-Led Decisions", sub: "Primary travel planners" },
                  { target: 88, prefix: "", suffix: "%", label: "Fitness-Critical Travelers", sub: "McKinsey 2025 luxury" },
                  { target: 56, prefix: "", suffix: "%", label: "Travel 2+ Hours", sub: "For retreats (Skift)" },
                ].map((stat) => (
                  <StaggerItem key={stat.label}>
                    <div className="border-b border-cream-200 p-6 sm:p-7 lg:border-b-0 lg:[&:not(:first-child)]:border-l">
                      <div className="font-display text-3xl tabular-nums text-ink-900 sm:text-4xl">
                        <Counter target={stat.target} prefix={stat.prefix} suffix={stat.suffix} />
                      </div>
                      <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-700">{stat.label}</div>
                      <div className="mt-1 text-[10px] text-ink-500">{stat.sub}</div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </AnimateIn>

          <AnimateIn delay={0.3}>
            <p className="mt-6 text-[10px] text-ink-500">
              Source: Global Wellness Institute 2024–2025 Economy Monitor · Business Research Company · Straits Research
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* ═══ MARQUEE — quiet cream ticker ═══ */}
      <div className="border-y border-cream-200 py-4">
        <Marquee className="text-ink-500">
          {retreats.slice(0, 10).map((r) => (
            <span key={r.id} className="mx-10 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.15em]">
              <span className="font-semibold tabular-nums text-sage-700">{isScorePublic(r.wrd_score) ? r.wrd_score.toFixed(1) : "Listed"}</span>
              <span className="text-ink-700">{r.name}</span>
              <span aria-hidden className="h-1 w-1 rounded-full bg-cream-200" />
            </span>
          ))}
        </Marquee>
      </div>

      {/* ══════════════════════════════════════════════════
          5. REGIONS — sticky argument + scored list
          ══════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
          <div className="grid items-start gap-16 lg:grid-cols-12 lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:col-span-5">
              <AnimateIn>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">Global Reach</p>
                <h2 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-ink-900 sm:text-5xl">
                  Five regions.<br />One standard.
                </h2>
                <p className="mt-6 max-w-sm text-[14px] leading-relaxed text-ink-700">
                  From the Hamptons to the Himalayas — every retreat held to the same
                  15-category framework. No regional curve. No exceptions.
                </p>
                <a href="/retreats" className="mt-8 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sage-700 transition-colors hover:text-sage-600">
                  Browse the directory →
                </a>
              </AnimateIn>
            </div>

            <div className="lg:col-span-7">
              <StaggerContainer className="space-y-3">
                {regions.map((region) => {
                  const topInRegion = topByRegion[region.name];
                  const topScore = topInRegion?.wrd_score || 0;
                  const topName = topInRegion?.name || "";
                  const topImage = topInRegion ? sizedImageUrl(getRetreatImage(topInRegion), 640, 480) : "";
                  const scorePublic = isScorePublic(topScore);
                  return (
                    <StaggerItem key={region.name}>
                      <a
                        href={`/retreats?region=${region.name}`}
                        className="group flex items-center gap-5 overflow-hidden rounded-2xl bg-cream-100 p-4 ring-1 ring-cream-200 transition-all duration-300 ease-out hover:ring-sage-600/30 sm:gap-6 sm:p-5"
                      >
                        <div className="hidden h-16 w-16 shrink-0 overflow-hidden rounded-xl sm:block">
                          {topImage ? (
                            <Image
                              src={topImage}
                              alt=""
                              width={64}
                              height={64}
                              loading="lazy"
                              sizes="64px"
                              quality={70}
                              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-cream-200">
                              <span className="text-[10px] uppercase tracking-[0.2em] text-ink-500">{region.name.slice(0, 2)}</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-2xl text-ink-900 transition-colors duration-300 group-hover:text-sage-700">
                            {region.name}
                          </h3>
                          <p className="mt-1 truncate text-[12px] text-ink-500">
                            <span className="tabular-nums">{region.count}</span> retreat{region.count > 1 ? "s" : ""}{topName ? ` · Top rated: ${topName}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-5">
                          <div className="hidden text-right sm:block">
                            <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-ink-500">Best score</div>
                            <div className="font-display text-xl tabular-nums text-sage-700">{scorePublic ? topScore.toFixed(1) : "—"}</div>
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-cream-200 transition-all duration-300 group-hover:bg-sage-100 group-hover:ring-sage-600/30">
                            <svg className="h-4 w-4 text-ink-500 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-sage-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </div>
                        </div>
                      </a>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          6. RETREAT GUIDES — curated matchmaker
          ══════════════════════════════════════════════════ */}
      <section className="border-t border-cream-200 py-24 md:py-32">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
          <AnimateIn>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">Retreat Matchmaker</p>
          </AnimateIn>
          <AnimateIn delay={0.08}>
            <h2 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-ink-900 sm:text-5xl">Find your retreat</h2>
          </AnimateIn>
          <AnimateIn delay={0.12}>
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-ink-700">Guides filtered by goal, budget, and travel style.</p>
          </AnimateIn>
          <StaggerContainer className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[
              { title: "Burnout Recovery", slug: "best-retreats-for-burnout-recovery" },
              { title: "Under $500/Night", slug: "best-budget-wellness-retreats" },
              { title: "Medical & Longevity", slug: "best-medical-wellness-retreats" },
              { title: "Solo Travelers", slug: "best-retreats-for-solo-travelers" },
              { title: "First-Timers", slug: "best-retreats-for-first-timers" },
              { title: "Luxury", slug: "best-luxury-wellness-retreats" },
              { title: "Couples", slug: "best-retreats-for-couples" },
              { title: "Fitness", slug: "best-retreats-for-fitness" },
              { title: "Digital Detox", slug: "best-retreats-for-digital-detox" },
              { title: "Nutrition", slug: "best-retreats-for-nutrition" },
            ].map((g) => (
              <StaggerItem key={g.slug}>
                <a
                  href={`/guides/${g.slug}`}
                  className="group flex items-center justify-between rounded-xl bg-cream-100 px-5 py-4 ring-1 ring-cream-200 transition-all duration-200 ease-out hover:bg-sage-100 hover:ring-sage-600/30"
                >
                  <span className="text-[13px] font-medium text-ink-900 transition-colors group-hover:text-sage-700">{g.title}</span>
                  <svg className="h-3.5 w-3.5 text-ink-500 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-sage-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </StaggerItem>
            ))}
          </StaggerContainer>
          <div className="mt-8">
            <a href="/guides" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage-700 transition-colors hover:text-sage-600">
              View all guides →
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          7. EMAIL CAPTURE — cream conversion card
          ══════════════════════════════════════════════════ */}
      <section className="border-t border-cream-200 py-24 md:py-28">
        <div className="mx-auto max-w-xl px-6 sm:px-10">
          <EmailCapture source="homepage" />
        </div>
      </section>
    </div>
  );
}
