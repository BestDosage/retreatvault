import type { Metadata } from "next";

// Cache the homepage as static — refresh once per hour
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Best Wellness Retreats 2026 — Rated & Ranked | RetreatVault",
  description:
    "Discover the world's top-rated wellness retreats scored across 15 data-driven categories. Compare luxury spas, medical clinics, yoga ashrams & detox centers. No paid placements.",
};

import Image from "next/image";
import dynamic from "next/dynamic";
import { getAllRetreats, getRegions } from "@/lib/data";
import AnimateIn, { StaggerContainer, StaggerItem, Counter, TextReveal, Marquee } from "@/components/AnimateIn";
import TierBadge from "@/components/TierBadge";
import PressStrip from "@/components/PressStrip";
import EmailCapture from "@/components/EmailCapture";

// Below-the-fold — dynamically import so it stays out of the initial bundle.
const HorizontalScroll = dynamic(() => import("@/components/HorizontalScroll"), {
  loading: () => <div className="h-[480px]" />,
});

export default async function HomePage() {
  const retreats = await getAllRetreats();
  const featured = retreats.slice(0, 8);
  const regions = await getRegions();
  const topRetreat = retreats[0];

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
    name: "RetreatVault — The World's Most Exclusive Wellness Retreats, Ranked",
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([jsonLd, websiteJsonLd, speakableJsonLd, faqJsonLd]),
        }}
      />
      {/* ══════════════════════════════════════════════════
          1. HERO
          ══════════════════════════════════════════════════ */}
      <section className="relative flex min-h-[100dvh] min-h-[750px] flex-col items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1514282401047-d79a71a590e8?fit=crop"
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={70}
          className="scale-105 object-cover"
        />
        <div className="absolute inset-0 bg-dark-950/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-dark-950/60" />
        <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-dark-950 to-transparent" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center sm:px-10">
          <AnimateIn delay={0.2} direction="none" duration={1.4}>
            <div className="mx-auto mb-10 flex items-center justify-center gap-4">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-gold-400/50" />
              <span className="text-[9px] font-semibold uppercase tracking-[0.5em] text-gold-400">
                Retreat<span className="text-gold-300">Vault</span>
              </span>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-gold-400/50" />
            </div>
          </AnimateIn>

          <h1 className="mb-8">
            <TextReveal
              text="The World's Most Exclusive Wellness Retreats, Ranked."
              className="font-serif text-[clamp(2rem,5.2vw,4.5rem)] font-light leading-[1.08] text-white"
              delay={0.5}
            />
          </h1>

          <AnimateIn delay={1.3} duration={1}>
            <p className="mx-auto mb-14 max-w-lg text-[14px] font-light leading-[1.8] text-dark-200/80">
              Every retreat scored across 15 weighted categories by an analytical
              chemist. No paid placements. No affiliate bias. Just data
              you can trust with a $10,000 decision.
            </p>
          </AnimateIn>

          <AnimateIn delay={1.6} duration={0.8}>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a href="/retreats" className="btn-luxury">
                Browse All Retreats
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a href="/quiz" className="btn-outline">
                Take the 2-Min Quiz
              </a>
            </div>
          </AnimateIn>
        </div>

        <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
          <div className="h-12 w-px bg-gradient-to-b from-gold-400/30 to-transparent" />
        </div>
      </section>

      {/* ═══ PRESS STRIP — social proof right below hero ═══ */}
      <PressStrip />

      {/* ══════════════════════════════════════════════════
          2. QUIZ CTA — right below hero
          ══════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
          <AnimateIn>
            <div className="relative overflow-hidden rounded-[2rem] border border-gold-400/[0.08]">
              {retreats[3]?.hero_image_url?.startsWith("http") && (
                <Image
                  src={retreats[3].hero_image_url}
                  alt=""
                  fill
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 1280px"
                  quality={65}
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-[2px]" />
              <div className="absolute inset-0 bg-gradient-to-r from-dark-950/60 to-dark-950/40" />

              <div className="absolute left-0 top-0 h-16 w-px bg-gradient-to-b from-gold-400/30 to-transparent" />
              <div className="absolute left-0 top-0 h-px w-16 bg-gradient-to-r from-gold-400/30 to-transparent" />
              <div className="absolute bottom-0 right-0 h-16 w-px bg-gradient-to-t from-gold-400/30 to-transparent" />
              <div className="absolute bottom-0 right-0 h-px w-16 bg-gradient-to-l from-gold-400/30 to-transparent" />

              <div className="relative grid items-center gap-12 px-10 py-20 sm:px-16 sm:py-28 lg:grid-cols-2 lg:px-20">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-gold-400">Personalized Match</p>
                  <h2 className="mt-4 font-serif text-3xl font-light text-white sm:text-4xl lg:text-[2.8rem] lg:leading-[1.15]">
                    Find your<br />perfect retreat
                  </h2>
                  <p className="mt-5 max-w-md text-[14px] leading-relaxed text-dark-200/80">
                    Answer 8 research-backed questions about your wellness goals,
                    travel style, and budget. Our algorithm analyzes 120+
                    retreats across 15 categories to find your perfect match.
                  </p>
                </div>
                <div className="text-center lg:text-right">
                  <a href="/quiz" className="btn-luxury btn-luxury-lg">
                    Take the Quiz
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                  <p className="mt-4 text-[11px] text-dark-400">
                    Free &middot; 2 minutes &middot; 8 questions
                  </p>
                </div>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          3. FEATURED RETREATS — horizontal scroll
          ══════════════════════════════════════════════════ */}
      <section id="featured" className="py-28">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
          <div className="mb-16 grid items-end gap-6 sm:grid-cols-2">
            <div>
              <AnimateIn>
                <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-gold-500">The Collection</p>
              </AnimateIn>
              <AnimateIn delay={0.1}>
                <h2 className="mt-4 font-serif text-4xl font-light text-white sm:text-[3.2rem] sm:leading-[1.1]">
                  Highest rated retreats<br />
                  <span className="text-dark-400">in the vault</span>
                </h2>
              </AnimateIn>
            </div>
            <AnimateIn delay={0.15}>
              <div className="flex items-center gap-6 sm:justify-end">
                <p className="max-w-xs text-[13px] leading-relaxed text-dark-500">
                  Independently scored. Scroll to explore our top-rated properties worldwide.
                </p>
                <a href="/retreats" className="hidden shrink-0 text-[10px] font-medium uppercase tracking-[0.2em] text-gold-400 transition-colors hover:text-gold-300 sm:block">
                  View All &rarr;
                </a>
              </div>
            </AnimateIn>
          </div>
        </div>

        <HorizontalScroll retreats={featured} />

        <div className="mt-10 text-center sm:hidden">
          <a href="/retreats" className="btn-outline btn-outline-sm">View All Retreats</a>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          4. HOW IT WORKS — 3 steps (no tier badges)
          ══════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400/[0.015] blur-[150px]" />
        <div className="line-gold" />

        <div className="relative mx-auto max-w-[1440px] px-6 py-32 sm:px-10 lg:px-16">
          <div className="mb-20 text-center">
            <AnimateIn>
              <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-gold-500">The Method</p>
            </AnimateIn>
            <AnimateIn delay={0.1}>
              <h2 className="mt-4 font-serif text-4xl font-light text-white sm:text-[3.2rem]">
                How we rate every retreat
              </h2>
            </AnimateIn>
            <AnimateIn delay={0.2}>
              <p className="mx-auto mt-5 max-w-lg text-[14px] leading-relaxed text-dark-400">
                A framework designed by an analytical chemist. Not influencer opinions.
                Not paid reviews. Science-grade evaluation applied to wellness travel.
              </p>
            </AnimateIn>
          </div>

          <StaggerContainer className="grid gap-6 sm:grid-cols-3" staggerDelay={0.15}>
            {[
              {
                step: "01",
                title: "Deep Research",
                desc: "We analyze each retreat across 15 categories\u200a\u2014\u200anutrition, fitness, medical, spa, sleep, sustainability, and 9 more. Up to 8 sub-criteria per category.",
                detail: "15 categories \u00b7 120+ data points",
              },
              {
                step: "02",
                title: "Independent Scoring",
                desc: "Every sub-criterion is scored 1\u201310 using verifiable evidence: menus, staff credentials, certifications, real guest reviews. No self-reported data accepted.",
                detail: "Evidence-based \u00b7 Zero paid placements",
              },
              {
                step: "03",
                title: "Weighted Vault Score",
                desc: "Category scores are weighted by impact on the wellness experience and combined into a single Vault Score out of 10. Tier badges\u200a\u2014\u200aElite, Exceptional, Recommended\u200a\u2014\u200aare assigned.",
                detail: "Weighted formula \u00b7 Updated quarterly",
              },
            ].map((item) => (
              <StaggerItem key={item.step}>
                <div className="group relative rounded-2xl border border-white/[0.04] bg-white/[0.015] p-8 transition-all duration-700 hover:border-gold-400/15 hover:bg-white/[0.03] sm:p-10">
                  <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-700 group-hover:opacity-100" style={{ boxShadow: "inset 0 0 80px rgba(212,175,55,0.03)" }} />
                  <div className="relative">
                    <span className="font-serif text-5xl font-light text-gold-400/20 transition-colors duration-700 group-hover:text-gold-400/40">
                      {item.step}
                    </span>
                    <h3 className="mt-4 font-serif text-2xl font-light text-white">{item.title}</h3>
                    <p className="mt-4 text-[13px] leading-relaxed text-dark-400">{item.desc}</p>
                    <div className="mt-6 flex items-center gap-2">
                      <div className="h-px flex-1 bg-white/[0.04]" />
                      <span className="text-[9px] uppercase tracking-[0.2em] text-dark-500">{item.detail}</span>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        <div className="line-gold" />
      </section>

      {/* ══════════════════════════════════════════════════
          5. SOCIAL PROOF / MARKET DATA — above regions
          ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-white/[0.04]">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-900/50 to-dark-950" />
        <div className="absolute right-0 top-0 h-[400px] w-[400px] translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400/[0.02] blur-[120px]" />

        <div className="relative mx-auto max-w-[1440px] px-6 py-28 sm:px-10 lg:px-16">
          <div className="mb-16 text-center">
            <AnimateIn>
              <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-gold-500">The Market</p>
            </AnimateIn>
            <AnimateIn delay={0.1}>
              <h2 className="mt-4 font-serif text-4xl font-light text-white sm:text-[3.2rem]">
                Wellness is not a trend.<br />
                <span className="text-dark-400">It&rsquo;s the economy.</span>
              </h2>
            </AnimateIn>
          </div>

          <StaggerContainer className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6" staggerDelay={0.1}>
            {[
              { target: 6.8, prefix: "$", suffix: "T", label: "Global Wellness Economy", sub: "6.12% of world GDP" },
              { target: 651, prefix: "$", suffix: "B", label: "Wellness Tourism", sub: "8\u201312% CAGR through 2033" },
              { target: 248, prefix: "$", suffix: "B", label: "Retreat Market 2025", sub: "Projected $363B by 2029" },
              { target: 78, prefix: "", suffix: "%", label: "Women-Led Decisions", sub: "Primary travel planners" },
              { target: 88, prefix: "", suffix: "%", label: "Fitness-Critical Travelers", sub: "McKinsey 2025 luxury travel" },
              { target: 56, prefix: "", suffix: "%", label: "Travel 2+ Hours", sub: "For wellness retreats (Skift)" },
            ].map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="rounded-2xl border border-white/[0.04] bg-white/[0.015] p-6 text-center sm:p-8">
                  <div className="font-serif text-3xl font-light text-white sm:text-4xl">
                    <Counter target={stat.target} prefix={stat.prefix} suffix={stat.suffix} />
                  </div>
                  <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-dark-300">{stat.label}</div>
                  <div className="mt-1 text-[10px] text-dark-500">{stat.sub}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <AnimateIn delay={0.4}>
            <p className="mt-10 text-center text-[9px] text-dark-600">
              Source: Global Wellness Institute 2024&ndash;2025 Economy Monitor &middot; Business Research Company &middot; Straits Research
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          6. MARQUEE — right above regions
          ══════════════════════════════════════════════════ */}
      <div className="border-b border-white/[0.04] py-5">
        <Marquee speed={45} className="text-dark-500">
          {retreats.slice(0, 10).map((r) => (
            <span key={r.id} className="mx-10 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.15em]">
              <span className="text-gold-500">{r.wrd_score.toFixed(1)}</span>
              <span className="text-dark-300">{r.name}</span>
              <span className="text-dark-700">&bull;</span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* ══════════════════════════════════════════════════
          7. REGIONS — connected to marquee above
          ══════════════════════════════════════════════════ */}
      <section className="py-32">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
          <div className="grid items-start gap-20 lg:grid-cols-12">
            <div className="lg:sticky lg:top-32 lg:col-span-5">
              <AnimateIn>
                <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-gold-500">Global Reach</p>
                <h2 className="mt-4 font-serif text-4xl font-light text-white sm:text-[3.2rem] sm:leading-[1.1]">
                  Five regions.<br />
                  <span className="text-dark-400">One standard.</span>
                </h2>
                <p className="mt-6 max-w-sm text-[14px] leading-relaxed text-dark-400">
                  From the Hamptons to the Himalayas. Every retreat held to the
                  same 15-category framework. No regional curve. No exceptions.
                </p>
              </AnimateIn>

              <AnimateIn delay={0.3}>
                <div className="mt-12 hidden lg:block">
                  <div className="relative mx-auto h-48 w-48">
                    <div className="absolute inset-0 rounded-full border border-white/[0.06]" />
                    <div className="absolute inset-4 rounded-full border border-white/[0.04]" />
                    <div className="absolute inset-8 rounded-full border border-gold-400/[0.08]" />
                    <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400/40 shadow-[0_0_20px_rgba(212,175,55,0.3)]" />
                    {[
                      { x: "30%", y: "35%" },
                      { x: "55%", y: "28%" },
                      { x: "35%", y: "42%" },
                      { x: "28%", y: "30%" },
                      { x: "72%", y: "45%" },
                    ].map((dot, i) => (
                      <div key={i} className="absolute h-1.5 w-1.5 rounded-full bg-gold-400/60" style={{ left: dot.x, top: dot.y }}>
                        <div className="absolute inset-0 animate-ping rounded-full bg-gold-400/30" />
                      </div>
                    ))}
                  </div>
                </div>
              </AnimateIn>
            </div>

            <div className="lg:col-span-7">
              <StaggerContainer className="space-y-4" staggerDelay={0.1}>
                {regions.map((region) => {
                  const regionRetreats = retreats.filter((r) => r.region === region.name);
                  const topScore = regionRetreats[0]?.wrd_score || 0;
                  const topName = regionRetreats[0]?.name || "";
                  const topImage = regionRetreats[0]?.hero_image_url;
                  return (
                    <StaggerItem key={region.name}>
                      <a
                        href={`/retreats?region=${region.name}`}
                        className="group relative flex items-center gap-6 overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.015] p-6 transition-all duration-700 hover:border-gold-400/15 hover:bg-white/[0.03] sm:p-8"
                      >
                        <div className="hidden h-20 w-20 shrink-0 overflow-hidden rounded-xl sm:block">
                          {topImage ? (
                            <Image
                              src={topImage}
                              alt=""
                              width={80}
                              height={80}
                              loading="lazy"
                              sizes="80px"
                              quality={70}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-dark-800">
                              <span className="text-[9px] uppercase tracking-[0.2em] text-dark-500">{region.name.slice(0, 2)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-serif text-2xl font-light text-white transition-colors duration-500 group-hover:text-gold-300">
                            {region.name}
                          </h3>
                          <p className="mt-1 text-[12px] text-dark-400">
                            {region.count} retreat{region.count > 1 ? "s" : ""} &middot; Top rated: {topName}
                          </p>
                        </div>
                        <div className="flex items-center gap-5">
                          <div className="hidden text-right sm:block">
                            <div className="text-[9px] uppercase tracking-[0.15em] text-dark-500">Best Score</div>
                            <div className="font-serif text-xl text-gold-400">{topScore.toFixed(1)}</div>
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] transition-all duration-500 group-hover:border-gold-400/20 group-hover:bg-gold-400/5">
                            <svg className="h-4 w-4 text-dark-400 transition-all duration-500 group-hover:translate-x-0.5 group-hover:text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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

      {/* ═══ EMAIL CAPTURE ═══ */}
      <section className="py-20">
        <div className="mx-auto max-w-xl px-6 sm:px-10">
          <EmailCapture source="homepage" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          8. RETREAT GUIDES — curated matchmaker links
          ══════════════════════════════════════════════════ */}
      <section className="border-t border-white/[0.06] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Retreat Matchmaker</p>
          <h2 className="mt-3 font-serif text-3xl font-light text-white md:text-4xl">Find Your Perfect Retreat</h2>
          <p className="mt-4 text-[14px] text-dark-400">Data-driven guides filtered by your goals, budget, and travel style</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
              <a
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-center transition-all hover:border-gold-400/25 hover:bg-white/[0.04]"
              >
                <span className="text-[13px] font-medium text-white group-hover:text-gold-300 transition-colors">{g.title}</span>
              </a>
            ))}
          </div>
          <div className="mt-8 text-center">
            <a href="/guides" className="text-[11px] uppercase tracking-wider text-gold-400 hover:text-gold-300 transition-colors">
              View All Guides →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
