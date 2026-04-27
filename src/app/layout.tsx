import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import CompareProvider from "@/components/CompareProvider";
import CompareBar from "@/components/CompareBar";
import PressStrip from "@/components/PressStrip";
import MobileNav from "@/components/MobileNav";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
  adjustFontFallback: true,
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
  variable: "--font-cormorant",
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
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
      </head>
      <body>
        <CompareProvider>

        {/* ═══ NAV ═══ */}
        <nav className="fixed top-0 z-50 w-full">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 sm:px-10 lg:px-16">
            {/* Logo */}
            <a href="/" className="group flex items-center -my-8">
              <Image
                src="/logo-transparent.png"
                alt="RetreatVault"
                width={224}
                height={112}
                priority
                className="h-28 w-auto"
              />
            </a>

            {/* Links */}
            <div className="flex items-center gap-8">
              <a href="/retreats" className="hidden text-[11px] font-medium uppercase tracking-[0.2em] text-dark-300 transition-colors duration-500 hover:text-white sm:block">
                Directory
              </a>
              <a href="/retreats?region=USA" className="hidden text-[11px] font-medium uppercase tracking-[0.2em] text-dark-400 transition-colors duration-500 hover:text-white md:block">
                USA
              </a>
              <a href="/retreats?region=Europe" className="hidden text-[11px] font-medium uppercase tracking-[0.2em] text-dark-400 transition-colors duration-500 hover:text-white md:block">
                Europe
              </a>
              <a href="/retreats?region=Asia" className="hidden text-[11px] font-medium uppercase tracking-[0.2em] text-dark-400 transition-colors duration-500 hover:text-white lg:block">
                Asia
              </a>
              <a href="/blog" className="hidden text-[11px] font-medium uppercase tracking-[0.2em] text-dark-400 transition-colors duration-500 hover:text-white lg:block">
                Journal
              </a>
              <a href="/quiz" className="hidden sm:inline-flex btn-luxury !py-2.5 !px-6 !text-[9px]">
                Take the Quiz
              </a>
              <MobileNav />
            </div>
          </div>
          {/* Fade line */}
          <div className="line-gold" />
        </nav>

        <main>{children}</main>
        <CompareBar />

        {/* ═══ FOOTER ═══ */}
        <footer className="border-t border-white/[0.04] bg-dark-950">
          <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
            <div className="line-gold" />
            <div className="grid gap-16 py-20 md:grid-cols-12">
              <div className="md:col-span-5">
                <Image
                  src="/logo-transparent.png"
                  alt="RetreatVault"
                  width={288}
                  height={144}
                  loading="lazy"
                  className="h-36 w-auto"
                />
                <p className="mt-6 max-w-sm text-[13px] leading-relaxed text-dark-400">
                  The world&rsquo;s most rigorous wellness retreat rating system.
                  15 weighted categories. Zero bias. Built by an analytical chemist
                  who demands precision from every score.
                </p>
              </div>
              <div className="md:col-span-3 md:col-start-7">
                <h4 className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Regions</h4>
                <div className="mt-6 flex flex-col gap-3">
                  {["USA", "Europe", "Canada", "Mexico", "Asia"].map((r) => (
                    <a key={r} href={`/retreats?region=${r}`} className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">
                      {r}
                    </a>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Retreat Types</h4>
                <div className="mt-6 flex flex-col gap-3">
                  <a href="/retreats/type/yoga" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Yoga</a>
                  <a href="/retreats/type/meditation" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Meditation</a>
                  <a href="/retreats/type/detox" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Detox</a>
                  <a href="/retreats/type/luxury" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Luxury</a>
                  <a href="/retreats/type/wellness" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Wellness</a>
                  <a href="/destinations" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">All Destinations</a>
                </div>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Company</h4>
                <div className="mt-6 flex flex-col gap-3">
                  <a href="/methodology" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Methodology</a>
                  <a href="/guides" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Guides</a>
                  <a href="/blog" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Journal</a>
                  <a href="/contact" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Contact</a>
                  <a href="/quiz" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Quiz</a>
                  <a href="/compare" className="text-[13px] text-dark-400 transition-colors duration-500 hover:text-gold-400">Compare</a>
                </div>
              </div>
            </div>
            <div className="line-gold" />
            <div className="flex items-center justify-between py-8">
              <span className="text-[10px] text-dark-500">&copy; {new Date().getFullYear()} RetreatVault.com</span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-dark-600">Precision-Rated Wellness Travel</span>
            </div>
          </div>
        </footer>
        </CompareProvider>
      </body>
    </html>
  );
}
