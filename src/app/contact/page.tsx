import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact RetreatVault — Submit a Retreat or Partner With Us",
  description:
    "Get in touch with the RetreatVault team. Submit a wellness retreat for review, ask about our scoring methodology, or explore partnership opportunities. Operated by BestDosage LLC.",
};

import AnimateIn from "@/components/AnimateIn";

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
    <div className="min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-4xl px-6 sm:px-10">
        {/* Hero */}
        <AnimateIn>
          <div className="text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-gold-500">Get in Touch</p>
            <h1 className="mt-4 font-serif text-4xl font-light text-white sm:text-5xl">
              Contact Us
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[14px] leading-relaxed text-dark-400">
              RetreatVault is a property of BestDosage LLC &mdash; a wellness company building data-driven
              tools and content across the wellness industry. We&rsquo;d love to hear from you.
            </p>
          </div>
        </AnimateIn>

        <div className="mt-14 grid gap-8 sm:grid-cols-2">
          {/* Contact Form */}
          <AnimateIn delay={0.1}>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
              <h2 className="font-serif text-xl font-light text-white">Send a Message</h2>
              <p className="mt-2 text-[12px] text-dark-400">
                Questions about our methodology, partnership opportunities, or retreat submissions &mdash; we respond within 48 hours.
              </p>
              <form
                action={`mailto:info@bestdosage.com`}
                method="POST"
                encType="text/plain"
                className="mt-6 space-y-4"
              >
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-dark-500">Name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="mt-1 w-full rounded-xl border border-white/[0.08] bg-dark-900 px-4 py-3 text-[13px] text-white placeholder-dark-500 outline-none transition-colors focus:border-gold-400/30"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-dark-500">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="mt-1 w-full rounded-xl border border-white/[0.08] bg-dark-900 px-4 py-3 text-[13px] text-white placeholder-dark-500 outline-none transition-colors focus:border-gold-400/30"
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-dark-500">Subject</label>
                  <select
                    name="subject"
                    className="mt-1 w-full rounded-xl border border-white/[0.08] bg-dark-900 px-4 py-3 text-[13px] text-white outline-none transition-colors focus:border-gold-400/30"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="methodology">Question About Our Scoring</option>
                    <option value="submit">Submit a Retreat for Review</option>
                    <option value="partnership">Partnership / Advertising</option>
                    <option value="press">Press / Media</option>
                    <option value="correction">Data Correction</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-dark-500">Message</label>
                  <textarea
                    name="message"
                    rows={5}
                    required
                    className="mt-1 w-full rounded-xl border border-white/[0.08] bg-dark-900 px-4 py-3 text-[13px] text-white placeholder-dark-500 outline-none transition-colors focus:border-gold-400/30 resize-none"
                    placeholder="How can we help?"
                  />
                </div>
                <button type="submit" className="btn-luxury w-full !py-3 !text-[10px]">
                  Send Message
                </button>
              </form>
            </div>
          </AnimateIn>

          {/* Info Cards */}
          <div className="space-y-6">
            <AnimateIn delay={0.15}>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Email</p>
                <a href="mailto:info@bestdosage.com" className="mt-3 block font-serif text-xl font-light text-white hover:text-gold-300 transition-colors">
                  info@bestdosage.com
                </a>
                <p className="mt-2 text-[12px] text-dark-400">For all inquiries. We typically respond within 48 hours.</p>
              </div>
            </AnimateIn>

            <AnimateIn delay={0.2}>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Submit a Retreat</p>
                <h3 className="mt-3 font-serif text-xl font-light text-white">Think we&rsquo;re missing a property?</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-dark-400">
                  We&rsquo;re always expanding the vault. If you own, manage, or have visited a wellness retreat that
                  deserves to be rated, let us know. We review all submissions and add qualifying properties to our
                  next quarterly evaluation cycle.
                </p>
              </div>
            </AnimateIn>

            <AnimateIn delay={0.25}>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Partnerships</p>
                <h3 className="mt-3 font-serif text-xl font-light text-white">Work with Us</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-dark-400">
                  RetreatVault does not sell placements or accept payment to influence scores. We do partner with
                  retreats on verified badges, enhanced profiles, and featured placement in our editorial content.
                  Reach out to discuss options.
                </p>
              </div>
            </AnimateIn>

            <AnimateIn delay={0.3}>
              <div className="rounded-2xl border border-gold-400/[0.08] bg-gradient-to-br from-white/[0.025] to-white/[0.01] p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">About</p>
                <h3 className="mt-3 font-serif text-lg font-light text-white">BestDosage LLC</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-dark-400">
                  RetreatVault is built and operated by BestDosage LLC, a wellness company creating
                  data-driven tools, content, and resources across the global wellness industry.
                  Our mission: help people make smarter decisions about their health and wellbeing.
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <a href="https://bestdosage.com" target="_blank" rel="noopener noreferrer" className="text-[11px] text-gold-400 hover:text-gold-300 transition-colors">
                    BestDosage.com &rarr;
                  </a>
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
