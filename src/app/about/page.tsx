import type { Metadata } from "next";
import Link from "next/link";
import AnimateIn from "@/components/AnimateIn";

export const metadata: Metadata = {
  title: "About RetreatVault — Who Built This and Why",
  description:
    "RetreatVault is founded and run by Chad Waldman: 9,400+ wellness retreats indexed and scored across 15 weighted categories. Scores are never for sale.",
};

export default function AboutPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.retreatvault.com" },
      { "@type": "ListItem", position: 2, name: "About" },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="min-h-screen bg-cream-50 pt-28 pb-24 text-ink-900">
        <div className="mx-auto max-w-3xl px-6 sm:px-10">
          {/* Hero */}
          <AnimateIn>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sage-700">About</p>
            <h1 className="mt-4 font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.05] tracking-tight text-ink-900">
              About RetreatVault
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-700">
              RetreatVault is founded and run by Chad Waldman. It exists for one reason: wellness
              retreats cost $5,000&ndash;$50,000, and the reviews people rely on to choose one are
              almost always for sale in one form or another. RetreatVault is built not to be.
            </p>
          </AnimateIn>

          {/* What it is */}
          <AnimateIn delay={0.08}>
            <div className="mt-16 rounded-[1.75rem] bg-cream-100 p-6 ring-1 ring-cream-200 sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sage-700">The Vault</p>
              <h2 className="mt-3 font-display text-2xl text-ink-900">9,408 retreats. One standard.</h2>
              <div className="mt-4 space-y-4 text-[14px] leading-relaxed text-ink-700">
                <p>
                  RetreatVault indexes 9,400+ wellness retreats worldwide &mdash; luxury spas, medical
                  clinics, yoga ashrams, detox centers, and everything between &mdash; and scores every
                  one of them across the same 15 weighted categories: nutrition, fitness, medical care,
                  spa quality, sleep, sustainability, and nine more.
                </p>
                <p>
                  No retreat is graded on a curve. No retreat is graded because it&rsquo;s well-known
                  or advertises heavily. The same weighted formula runs on all 9,408 properties, and
                  the result is published whether it flatters the retreat or not.
                </p>
              </div>
            </div>
          </AnimateIn>

          {/* Independence Charter */}
          <AnimateIn delay={0.14}>
            <div className="mt-8 rounded-[1.75rem] border border-sage-700/20 bg-sage-50/60 p-6 sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sage-700">The Independence Charter</p>
              <p className="mt-4 font-display text-2xl leading-snug text-ink-900 sm:text-3xl">
                Scores are never for sale.
              </p>
              <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-ink-700">
                Retreats pay us when you book &mdash; you pay nothing, and the score doesn&rsquo;t move.
                That&rsquo;s the whole model: RetreatVault makes money on bookings and leads, never on
                rankings. The scoring pipeline is sealed off from the revenue side of the business, and
                it stays that way regardless of who&rsquo;s paying for what.
              </p>
            </div>
          </AnimateIn>

          {/* Honest current state */}
          <AnimateIn delay={0.2}>
            <div className="mt-8 rounded-[1.75rem] bg-cream-100 p-6 ring-1 ring-cream-200 sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sage-700">Where Things Stand</p>
              <h2 className="mt-3 font-display text-2xl text-ink-900">Honest about the current state</h2>
              <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-ink-700">
                We score from verifiable data first &mdash; retreat websites, published research,
                aggregated guest reviews, industry awards. On-site verification visits are beginning in
                2026 and are always disclosed on the listings they touch. A visit adds verified photos
                and corrected facts to a property&rsquo;s profile. It never adds points.
              </p>
            </div>
          </AnimateIn>

          {/* Links out */}
          <AnimateIn delay={0.26}>
            <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-cream-200 pt-8">
              <Link
                href="/methodology"
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage-700 transition-colors hover:text-sage-600"
              >
                Read the full methodology →
              </Link>
              <Link
                href="/contact"
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage-700 transition-colors hover:text-sage-600"
              >
                Get in touch →
              </Link>
            </div>
          </AnimateIn>
        </div>
      </div>
    </>
  );
}
