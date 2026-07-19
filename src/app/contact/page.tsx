import type { Metadata } from "next";
import AnimateIn from "@/components/AnimateIn";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact RetreatVault — Submit a Retreat or Partner With Us",
  description:
    "Get in touch with the RetreatVault team. Submit a wellness retreat for review, ask about our scoring methodology, or explore partnership opportunities.",
};

export default function ContactPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.retreatvault.com" },
      { "@type": "ListItem", position: 2, name: "Contact" },
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
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sage-700">Get in Touch</p>
              <h1 className="mt-4 font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.05] tracking-tight text-ink-900">
                Contact Us
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-ink-700">
                Questions about our methodology, partnership opportunities, or a retreat you think
                belongs in the vault &mdash; we&rsquo;d love to hear from you.
              </p>
            </div>
          </AnimateIn>

          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            {/* Contact Form */}
            <AnimateIn delay={0.1}>
              <div className="rounded-[1.5rem] bg-cream-100 p-6 ring-1 ring-cream-200 sm:p-8">
                <h2 className="font-display text-xl text-ink-900">Send a Message</h2>
                <p className="mt-2 text-[12px] leading-relaxed text-ink-700">
                  Questions about our methodology, partnership opportunities, or retreat submissions
                  &mdash; we respond within 48 hours.
                </p>
                <ContactForm />
              </div>
            </AnimateIn>

            {/* Info Cards */}
            <div className="space-y-6">
              <AnimateIn delay={0.15}>
                <div className="rounded-[1.5rem] bg-cream-100 p-6 ring-1 ring-cream-200">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sage-700">Email</p>
                  <a
                    href="mailto:hello@retreatvault.com"
                    className="mt-3 block font-display text-xl text-ink-900 transition-colors hover:text-sage-700"
                  >
                    hello@retreatvault.com
                  </a>
                  <p className="mt-2 text-[12px] text-ink-700">For all inquiries. We typically respond within 48 hours.</p>
                </div>
              </AnimateIn>

              <AnimateIn delay={0.2}>
                <div className="rounded-[1.5rem] bg-cream-100 p-6 ring-1 ring-cream-200">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sage-700">Submit a Retreat</p>
                  <h3 className="mt-3 font-display text-xl text-ink-900">Think we&rsquo;re missing a property?</h3>
                  <p className="mt-2 text-[12px] leading-relaxed text-ink-700">
                    We&rsquo;re always expanding the vault. If you own, manage, or have visited a wellness retreat that
                    deserves to be rated, let us know. We review all submissions and add qualifying properties to our
                    next quarterly evaluation cycle.
                  </p>
                </div>
              </AnimateIn>

              <AnimateIn delay={0.25}>
                <div className="rounded-[1.5rem] border border-sage-700/20 bg-sage-50/60 p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sage-700">Partnerships</p>
                  <h3 className="mt-3 font-display text-xl text-ink-900">Work with Us</h3>
                  <p className="mt-2 text-[12px] leading-relaxed text-ink-700">
                    Scores and rankings are never for sale. Retreats can claim their listing, get owner-verified,
                    and pay us on the bookings and leads we send &mdash; none of which ever touches how a property
                    is scored. Reach out to discuss options.
                  </p>
                </div>
              </AnimateIn>

              <AnimateIn delay={0.3}>
                <div className="rounded-[1.5rem] bg-cream-100 p-6 ring-1 ring-cream-200">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sage-700">About</p>
                  <h3 className="mt-3 font-display text-lg text-ink-900">Independent by design</h3>
                  <p className="mt-2 text-[12px] leading-relaxed text-ink-700">
                    RetreatVault indexes and scores 9,400+ wellness retreats worldwide across the same 15 weighted
                    categories. Our mission: help people make smarter, better-informed decisions about where they
                    spend their money and their health.
                  </p>
                </div>
              </AnimateIn>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
