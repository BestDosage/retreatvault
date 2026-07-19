import type { Metadata } from "next";
import Link from "next/link";
import AnimateIn, { StaggerContainer, StaggerItem } from "@/components/AnimateIn";

export const metadata: Metadata = {
  title: "For Retreat Owners — Claim & Verify Your Listing | RetreatVault",
  description:
    "Your retreat is likely already on RetreatVault. Claim your listing for free, get owner-verified, or apply for a founder on-site visit. Scores are never for sale.",
};

const LADDER = [
  {
    step: "01",
    tier: "Claim",
    price: "Free",
    desc: "Verify the factual details on your listing, correct amenity data, and add official photos in place of representative imagery.",
  },
  {
    step: "02",
    tier: "Verified",
    price: "Owner-confirmed",
    desc: "Your data carries a dated “Verified” badge, confirmed directly by your team. Verification never affects scores.",
  },
  {
    step: "03",
    tier: "Founder Verified — We Stayed Here",
    price: "Application-only",
    desc: "An on-site verification visit from the RetreatVault team. Fewer than 15 properties are selected per year.",
  },
] as const;

const CLAIM_MAILTO =
  "mailto:founder@retreatvault.com?subject=Claim%20my%20retreat%20listing";

export default function ForRetreatsPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.retreatvault.com" },
      { "@type": "ListItem", position: 2, name: "For Retreat Owners" },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="min-h-screen bg-cream-50 pt-28 pb-24 text-ink-900">
        <div className="mx-auto max-w-4xl px-6 sm:px-10">
          {/* Hero */}
          <AnimateIn>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sage-700">For Retreat Owners</p>
            <h1 className="mt-4 max-w-2xl font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.05] tracking-tight text-ink-900">
              Your retreat is likely already on RetreatVault.
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-700">
              We index 9,400+ wellness retreats worldwide, whether or not the owner has ever heard of
              us. If yours is one of them, here&rsquo;s how to take control of your listing &mdash;
              without touching your score.
            </p>
          </AnimateIn>

          {/* The ladder */}
          <div className="mt-16">
            <AnimateIn>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">The Ladder</p>
              <h2 className="mt-3 font-display text-3xl leading-[1.05] tracking-tight text-ink-900 sm:text-4xl">
                Three ways to engage
              </h2>
            </AnimateIn>

            <StaggerContainer className="mt-10 grid gap-4 sm:grid-cols-3">
              {LADDER.map((t) => (
                <StaggerItem key={t.step}>
                  <div className="flex h-full flex-col rounded-[1.5rem] bg-cream-100 p-6 ring-1 ring-cream-200">
                    <span className="font-display text-3xl tabular-nums text-sage-700/40">{t.step}</span>
                    <h3 className="mt-4 font-display text-xl leading-tight text-ink-900">{t.tier}</h3>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">{t.price}</p>
                    <p className="mt-4 flex-1 text-[13px] leading-relaxed text-ink-700">{t.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>

          {/* Independence Charter */}
          <AnimateIn delay={0.1}>
            <div className="mt-16 rounded-[1.75rem] border border-sage-700/20 bg-sage-50/60 p-6 sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sage-700">The Independence Charter</p>
              <p className="mt-4 font-display text-2xl leading-snug text-ink-900 sm:text-3xl">
                Scores and rankings are never for sale.
              </p>
              <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-ink-700">
                Claiming your listing, getting verified, or hosting a founder visit changes what
                guests see about your property &mdash; never how it&rsquo;s scored. The same weighted
                15-category formula runs on every retreat in the vault, whether or not you ever
                reach out.
              </p>
            </div>
          </AnimateIn>

          {/* CTA */}
          <AnimateIn delay={0.16}>
            <div className="mt-16 rounded-[1.75rem] bg-ink-900 p-8 text-center sm:p-12">
              <h2 className="font-display text-2xl text-cream-50 sm:text-3xl">
                Claim your listing
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-cream-200/70">
                Tell us which property is yours and we&rsquo;ll walk you through verification.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
                <a
                  href={CLAIM_MAILTO}
                  className="inline-flex items-center gap-3 rounded-full bg-cream-50 py-3 pl-7 pr-3 text-sm font-medium text-ink-900 transition-transform duration-150 ease-out active:scale-[0.97]"
                >
                  Claim your listing
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900/10">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-cream-50/25 px-6 py-3 text-sm font-medium text-cream-50 transition-colors duration-200 ease-out hover:bg-cream-50/10"
                >
                  Or use the contact form
                </Link>
              </div>
            </div>
          </AnimateIn>
        </div>
      </div>
    </>
  );
}
