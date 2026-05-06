import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Science Hub — What the Research Actually Says | RetreatVault",
  description:
    "What the clinical research actually says about wellness retreat modalities. PubMed-cited evidence guides on yoga, ayurveda, fasting, spa, functional medicine, and MBSR.",
  alternates: { canonical: "https://www.retreatvault.com/science" },
};

const ARTICLES = [
  {
    slug: "yoga-meditation-science",
    title: "Does yoga and meditation actually work?",
    excerpt:
      "Multiple systematic reviews consistently show that yoga and meditation lower anxiety, reduce stress, and improve sleep. But the effects are more nuanced than retreats suggest.",
  },
  {
    slug: "ayurveda-science",
    title: "Ayurveda at wellness retreats",
    excerpt:
      "Several individual Ayurvedic herbs have legitimate clinical trial evidence. Panchakarma, the signature detox protocol most retreats sell, has far less rigorous data.",
  },
  {
    slug: "fasting-detox-science",
    title: "Fasting and detox retreats",
    excerpt:
      "Fasting has real, measurable metabolic benefits supported by dozens of RCTs. \"Detox,\" on the other hand, is a marketing term with no clinical backing.",
  },
  {
    slug: "spa-hydrotherapy-science",
    title: "Spa and hydrotherapy",
    excerpt:
      "European doctors have prescribed thermal mineral water baths for centuries. American spas charge $400 for a rose petal soak. The research says these are not the same thing.",
  },
  {
    slug: "functional-medicine-longevity-science",
    title: "Functional medicine and longevity",
    excerpt:
      "There are no randomized controlled trials validating functional medicine as a system. Individual components have evidence. The package deal hasn't been tested.",
  },
  {
    slug: "mindfulness-stress-reduction-science",
    title: "Mindfulness-based stress reduction",
    excerpt:
      "If there's one retreat modality with the strongest evidence base, it's MBSR. The sheer volume of clinical trials over 40 years produces a dataset you can actually draw conclusions from.",
  },
];

export default function ScienceIndex() {
  return (
    <main className="min-h-screen bg-dark-950">
      <section className="border-b border-white/[0.06] px-6 pb-16 pt-32 md:px-12 lg:px-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">
            Evidence Library
          </p>
          <h1 className="mt-4 font-serif text-4xl font-light text-white md:text-5xl lg:text-6xl">
            Science hub
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-dark-300">
            What the clinical research actually says about wellness retreat
            modalities. Every claim cites a specific PubMed study with DOI link.
            No marketing fluff, no cherry-picking.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ARTICLES.map((article) => (
              <Link
                key={article.slug}
                href={`/science/${article.slug}`}
                className="group flex flex-col rounded-2xl border border-white/[0.04] bg-white/[0.02] p-8 transition-all duration-300 hover:border-gold-500/20 hover:bg-white/[0.04]"
              >
                <span className="mb-2 w-fit rounded-full bg-gold-500/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gold-400">
                  Evidence Guide
                </span>
                <span className="font-serif text-[18px] font-medium text-white group-hover:text-gold-300 transition-colors">
                  {article.title}
                </span>
                <span className="mt-3 text-[13px] leading-relaxed text-dark-400">
                  {article.excerpt}
                </span>
                <span className="mt-auto pt-6 text-[11px] font-medium uppercase tracking-wider text-gold-500 group-hover:text-gold-400 transition-colors">
                  Read Evidence Guide →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
