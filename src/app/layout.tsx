import type { Metadata } from "next";
import { Gloock, Hanken_Grotesk } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import CompareProvider from "@/components/CompareProvider";
import CompareBar from "@/components/CompareBar";
import PressStrip from "@/components/PressStrip";
import SiteNav from "@/components/SiteNav";
import EmailCapture from "@/components/EmailCapture";

const display = Gloock({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-display",
  adjustFontFallback: true,
});

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: {
    default: "RetreatVault | Wellness Retreat Reviews & Ratings 2026",
    template: "%s | RetreatVault",
  },
  description:
    "Compare 120+ wellness retreats rated across 15 categories. Unbiased scores for spa resorts, medical clinics, yoga retreats & detox centers worldwide. Find your perfect retreat.",
  metadataBase: new URL("https://www.retreatvault.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "RetreatVault",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "RetreatVault — Wellness Retreat Reviews & Ratings",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/logo.png"],
  },
  other: {
    "theme-color": "#050505",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
      </head>
      <body>
        <CompareProvider>

        {/* ═══ NAV ═══ */}
        <SiteNav />

        <main>{children}</main>
        <CompareBar />

        {/* ═══ FOOTER ═══ */}
        <footer className="border-t border-white/[0.04] bg-dark-950">
          <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
            <div className="line-gold" />
            {/* Logo + Description + Subscribe (horizontal bar on desktop) */}
            <div className="py-16 text-center md:text-left">
              <div className="flex justify-center md:justify-start">
                <Image
                  src="/logo-transparent.png"
                  alt="RetreatVault"
                  width={288}
                  height={144}
                  loading="lazy"
                  className="h-36 w-auto"
                />
              </div>
              <p className="mx-auto mt-6 max-w-md text-[13px] leading-relaxed text-dark-400 md:mx-0">
                The world&rsquo;s most rigorous wellness retreat rating system.
                15 weighted categories. Zero bias. Built by an analytical chemist
                who demands precision from every score.
              </p>
              <div className="mt-8">
                <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Weekly Vault Report</p>
                <div className="mx-auto max-w-sm md:mx-0 md:max-w-lg">
                  <EmailCapture source="footer" variant="footer" />
                </div>
              </div>
            </div>

            <div className="line-gold" />

            {/* Footer link columns — unified row */}
            <div className="grid grid-cols-1 gap-10 py-14 text-center sm:grid-cols-3 sm:text-left">
              <div>
                <h4 className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Regions</h4>
                <div className="mt-5 flex flex-col gap-3">
                  {["USA", "Europe", "Canada", "Mexico", "Asia"].map((r) => (
                    <a key={r} href={`/retreats?region=${r}`} className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">
                      {r}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Retreat Types</h4>
                <div className="mt-5 flex flex-col gap-3">
                  <a href="/retreats/type/yoga" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Yoga</a>
                  <a href="/retreats/type/meditation" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Meditation</a>
                  <a href="/retreats/type/detox" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Detox</a>
                  <a href="/retreats/type/luxury" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Luxury</a>
                  <a href="/retreats/type/wellness" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Wellness</a>
                  <a href="/destinations" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">All Destinations</a>
                </div>
              </div>
              <div>
                <h4 className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Company</h4>
                <div className="mt-5 flex flex-col gap-3">
                  <a href="/methodology" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Methodology</a>
                  <a href="/guides" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Guides</a>
                  <a href="/science" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Science</a>
                  <a href="/blog" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Journal</a>
                  <a href="/contact" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Contact</a>
                  <a href="/quiz" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Quiz</a>
                  <a href="/compare" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Compare</a>
                </div>
              </div>
            </div>
            <div className="line-gold" />
            <div className="flex flex-col items-center gap-2 py-8 sm:flex-row sm:justify-between">
              <span className="text-[10px] text-dark-500">&copy; {new Date().getFullYear()} RetreatVault.com</span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-dark-600">Precision-Rated Wellness Travel</span>
            </div>
            <div className="border-t border-white/[0.04] pt-4 pb-6">
              <p className="text-[10px] uppercase tracking-[0.15em] text-dark-600 mb-2">Also by Chad Waldman</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-dark-600">
                <a href="https://bestdosage.com" target="_blank" rel="noopener" className="hover:text-dark-400 transition-colors">BestDosage — Find wellness practitioners</a>
                <a href="https://oktodive.com" target="_blank" rel="noopener" className="hover:text-dark-400 transition-colors">OkToDive — Compare dive sites</a>
                <a href="https://sourchad.com" target="_blank" rel="noopener" className="hover:text-dark-400 transition-colors">SourChad — Fermentation science</a>
                <a href="https://dumpstercomparison.com" target="_blank" rel="noopener" className="hover:text-dark-400 transition-colors">DumpsterComparison — Compare dumpster rental</a>
              </div>
            </div>
          </div>
        </footer>
        </CompareProvider>
      </body>
    </html>
  );
}
