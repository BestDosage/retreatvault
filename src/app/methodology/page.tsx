import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How We Score Retreats — 15 Categories, Zero Bias | Methodology",
  description:
    "Our scoring methodology explained: 15 weighted categories, triangulated data sources, first-hand visits, and peer-reviewed research. Built by an analytical chemist. No paid placements.",
};

import AnimateIn, { StaggerContainer, StaggerItem } from "@/components/AnimateIn";

const scoringCategories = [
  { name: "Nutrition & Food Quality", weight: "10%", desc: "Menu analysis, dietary accommodation, organic sourcing, chef credentials, on-site gardens." },
  { name: "Fitness & Movement", weight: "9%", desc: "Class variety, instructor qualifications, equipment quality, outdoor programming, personal training availability." },
  { name: "Mindfulness & Meditation", weight: "8%", desc: "Daily offerings, teacher lineage, meditation spaces, silence options, breathwork programs." },
  { name: "Spa & Relaxation", weight: "8%", desc: "Treatment breadth, therapist training, facility quality, hydrotherapy, signature experiences." },
  { name: "Sleep & Recovery", weight: "7%", desc: "Mattress quality, blackout capability, noise environment, sleep programs, evening protocols." },
  { name: "Medical & Clinical", weight: "8%", desc: "Physician credentials, diagnostic capability, lab access, treatment protocols, clinical research." },
  { name: "Personalization", weight: "7%", desc: "Intake assessment depth, custom programming, staff-to-guest ratio, follow-up protocols." },
  { name: "Amenities & Facilities", weight: "7%", desc: "Architecture, pools, grounds, room quality, common spaces, overall property impression." },
  { name: "Pricing & Value", weight: "8%", desc: "Cost relative to inclusions, service bundling, hidden fees, cancellation policies." },
  { name: "Activities & Excursions", weight: "6%", desc: "Off-property options, adventure programming, cultural experiences, nature access." },
  { name: "Education & Workshops", weight: "6%", desc: "Lecture quality, workshop depth, take-home knowledge, expert faculty, cooking classes." },
  { name: "Ease of Travel", weight: "5%", desc: "Airport proximity, transfer logistics, international accessibility, visa requirements." },
  { name: "Sustainability & Ethics", weight: "5%", desc: "Environmental certifications, energy sourcing, waste management, community impact, local employment." },
  { name: "Social Proof & Reputation", weight: "5%", desc: "Google/TripAdvisor ratings, press coverage, industry awards, longevity, word-of-mouth." },
  { name: "Add-Ons & Options", weight: "1%", desc: "Upgrade availability, extended programs, specialist consultations, aesthetic services." },
];

const dataSources = [
  { name: "Retreat Websites", desc: "Every program page, menu, rate card, and facility description is manually reviewed and cataloged." },
  { name: "Google Reviews", desc: "Aggregate ratings and sentiment analysis across hundreds of verified guest reviews." },
  { name: "TripAdvisor", desc: "Cross-referenced ratings, review volume, and recency-weighted sentiment scoring." },
  { name: "Industry Awards", desc: "World Spa Awards, Cond\u00e9 Nast Traveler, Travel + Leisure, Forbes Travel Guide designations." },
  { name: "First-Hand Visits", desc: "Select retreats are visited personally by our team. On-site observations calibrate our scoring models." },
  { name: "Published Research", desc: "PubMed studies on retreat outcomes, fasting protocols, and wellness modality efficacy inform category weights." },
];

export default function MethodologyPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does RetreatVault score wellness retreats?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Every retreat is scored 0-10 across 15 weighted categories including Nutrition & Food Quality, Fitness & Movement, Medical & Clinical, Spa & Relaxation, Sleep & Recovery, and 10 more. The final Vault Score is a weighted average calibrated by peer-reviewed research on what drives wellness outcomes. The system was designed by an analytical chemist.",
        },
      },
      {
        "@type": "Question",
        name: "Can retreats pay for a higher score on RetreatVault?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. RetreatVault does not accept paid placements, affiliate commissions, or sponsored content. Every score is independently calculated using the same weighted methodology across all retreats. There is zero pay-to-play.",
        },
      },
      {
        "@type": "Question",
        name: "What types of retreats are listed on RetreatVault?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "RetreatVault covers luxury wellness resorts, medical spas, yoga ashrams, detox centers, fitness boot camps, meditation retreats, Ayurvedic centers, and integrative health clinics across five global regions.",
        },
      },
      {
        "@type": "Question",
        name: "How do I find the best retreat for my goals?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Take the free RetreatVault quiz — 8 research-backed questions about your wellness goals, travel style, and budget. Our algorithm analyzes 120+ retreats across 15 categories to find your ideal match. You can also filter the directory by region, tier, and price.",
        },
      },
      {
        "@type": "Question",
        name: "How often are retreat scores updated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "All retreat scores are re-evaluated quarterly. Changes in staff, menus, programs, facilities, and guest reviews are incorporated into updated scores. The Vault Score History chart on each retreat page shows how ratings have changed over time.",
        },
      },
    ],
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
    <div className="min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-4xl px-6 sm:px-10">
        {/* Hero */}
        <AnimateIn>
          <div className="text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-gold-500">Our Process</p>
            <h1 className="mt-4 font-serif text-4xl font-light text-white sm:text-5xl">
              How We Score Every Retreat
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[14px] leading-relaxed text-dark-400">
              RetreatVault doesn&rsquo;t accept paid placements, affiliate commissions, or sponsored content.
              Every score is independently calculated using the same weighted methodology across all 120+ retreats.
            </p>
          </div>
        </AnimateIn>

        {/* Philosophy */}
        <AnimateIn delay={0.1}>
          <div className="mt-16 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Philosophy</p>
            <h2 className="mt-3 font-serif text-2xl font-light text-white">Built by an Analytical Chemist</h2>
            <div className="mt-4 space-y-4 text-[13px] leading-relaxed text-dark-300">
              <p>
                RetreatVault was founded on a simple premise: if you&rsquo;re spending $5,000&ndash;$50,000 on a wellness retreat,
                you deserve data you can trust &mdash; not marketing copy.
              </p>
              <p>
                Our scoring system was designed by an analytical chemist with deep experience in quantitative evaluation.
                The same rigor applied to laboratory analysis is applied to every retreat in our vault: controlled variables,
                weighted criteria, reproducible methodology, and zero conflicts of interest.
              </p>
              <p>
                Where possible, retreats are visited first-hand. Where not, we rely on a triangulation of multiple verified
                data sources &mdash; never a single point of reference. The result is the most comprehensive, unbiased
                wellness retreat rating system available.
              </p>
            </div>
          </div>
        </AnimateIn>

        {/* The RV Score */}
        <AnimateIn delay={0.15}>
          <div className="mt-12">
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">The RV Score</p>
            <h2 className="mt-3 font-serif text-2xl font-light text-white">15 Weighted Categories, One Number</h2>
            <p className="mt-3 text-[13px] leading-relaxed text-dark-400">
              Each retreat is scored 0&ndash;10 across 15 categories. The final RV Score is a weighted average,
              with weights calibrated to what matters most to informed wellness travelers. Categories like Nutrition
              and Medical carry more weight than Add-Ons because peer-reviewed research shows they drive outcomes.
            </p>
          </div>
        </AnimateIn>

        {/* Scoring grid */}
        <StaggerContainer className="mt-8 space-y-2">
          {scoringCategories.map((cat) => (
            <StaggerItem key={cat.name}>
              <div className="flex items-start gap-4 rounded-xl border border-white/[0.04] bg-white/[0.015] px-5 py-4">
                <span className="mt-0.5 min-w-[40px] rounded-full bg-gold-400/10 px-2 py-0.5 text-center text-[10px] font-bold text-gold-400">
                  {cat.weight}
                </span>
                <div className="flex-1">
                  <h3 className="text-[13px] font-medium text-white">{cat.name}</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-dark-400">{cat.desc}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Score Tiers */}
        <AnimateIn delay={0.1}>
          <div className="mt-12">
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Score Tiers</p>
            <h2 className="mt-3 font-serif text-2xl font-light text-white">What the Numbers Mean</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { tier: "Elite", range: "9.0 \u2013 10.0", desc: "The absolute pinnacle. Fewer than 5% of retreats earn this distinction.", color: "text-gold-300 border-gold-400/30" },
                { tier: "Exceptional", range: "8.0 \u2013 8.9", desc: "Outstanding across nearly every dimension. Worth traveling for.", color: "text-emerald-400 border-emerald-400/30" },
                { tier: "Highly Recommended", range: "7.0 \u2013 7.9", desc: "Strong programs with clear strengths. Great for specific goals.", color: "text-blue-400 border-blue-400/30" },
                { tier: "Good", range: "6.0 \u2013 6.9", desc: "Solid fundamentals. May excel in one or two areas.", color: "text-dark-300 border-white/[0.08]" },
              ].map((t) => (
                <div key={t.tier} className={`rounded-xl border ${t.color} bg-white/[0.015] p-5`}>
                  <div className={`text-[14px] font-medium ${t.color.split(" ")[0]}`}>{t.tier}</div>
                  <div className="mt-0.5 text-[11px] text-dark-500">{t.range}</div>
                  <p className="mt-2 text-[11px] leading-relaxed text-dark-400">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimateIn>

        {/* Data Sources */}
        <AnimateIn delay={0.1}>
          <div className="mt-12">
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Data Sources</p>
            <h2 className="mt-3 font-serif text-2xl font-light text-white">Where Our Data Comes From</h2>
            <p className="mt-3 text-[13px] leading-relaxed text-dark-400">
              No single source is trusted in isolation. Every retreat is evaluated using multiple independent data
              streams, cross-referenced for accuracy and recency.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {dataSources.map((s) => (
                <div key={s.name} className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5">
                  <h3 className="text-[12px] font-medium text-white">{s.name}</h3>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-dark-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimateIn>

        {/* Updates */}
        <AnimateIn delay={0.1}>
          <div className="mt-12 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Ongoing</p>
            <h2 className="mt-3 font-serif text-2xl font-light text-white">Scores Are Never Final</h2>
            <p className="mt-3 text-[13px] leading-relaxed text-dark-400">
              Retreats evolve. Chefs change. New programs launch. Facilities renovate. We re-evaluate every retreat
              quarterly and update scores to reflect the current experience &mdash; not what it was two years ago.
              The Vault Score History chart on each retreat page shows exactly how a property&rsquo;s rating has moved over time.
            </p>
          </div>
        </AnimateIn>

        {/* CTA */}
        <div className="mt-12 text-center">
          <a href="/retreats" className="btn-luxury !py-3 !px-8 !text-[10px]">
            Explore the Vault
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
