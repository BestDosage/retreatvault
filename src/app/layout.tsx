import type { Metadata } from "next";
import { Gloock, Hanken_Grotesk } from "next/font/google";
import Image from "next/image";
import Script from "next/script";
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
    "Compare 9,400+ wellness retreats rated across 15 categories. Unbiased scores for spa resorts, medical clinics, yoga retreats & detox centers worldwide. Find your perfect retreat.",
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
    "theme-color": "#f7f4ec",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <head>
        {/* Images load as plain <img> (no CORS), so preconnect must NOT be
            crossorigin or it won't match the real connection. Warm both image
            CDNs — Unsplash is the dominant host, Pexels covers enriched heroes. */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://images.pexels.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.pexels.com" />
      </head>
      <body>
        {process.env.NEXT_PUBLIC_GA4_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA4_ID}');`}
            </Script>
          </>
        )}
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
              fbq('track', 'PageView');`}
          </Script>
        )}
        <CompareProvider>

        {/* ═══ NAV ═══ */}
        <SiteNav />

        <main>{children}</main>
        <CompareBar />

        {/* ═══ FOOTER ═══ */}
        <footer className="border-t border-cream-50/10 bg-ink-900">
          <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
            <div className="border-t border-cream-50/10" />
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
              <p className="mx-auto mt-6 max-w-md text-[13px] leading-relaxed text-cream-200/60 md:mx-0">
                The world&rsquo;s most rigorous wellness retreat rating system.
                15 weighted categories. Scores are never for sale &mdash; retreats
                pay us when you book; you pay nothing and the score doesn&rsquo;t move.
              </p>
              <div className="mt-8">
                <p className="mb-3 font-display text-[9px] font-semibold uppercase tracking-[0.3em] text-cream-50">Weekly Vault Report</p>
                <div className="mx-auto max-w-sm md:mx-0 md:max-w-lg">
                  <EmailCapture source="footer" variant="footer" />
                </div>
              </div>
            </div>

            <div className="border-t border-cream-50/10" />

            {/* Footer link columns — unified row */}
            <div className="grid grid-cols-1 gap-10 py-14 text-center sm:grid-cols-3 sm:text-left">
              <div>
                <h4 className="font-display text-[9px] font-semibold uppercase tracking-[0.3em] text-cream-50">Regions</h4>
                <div className="mt-5 flex flex-col gap-3">
                  {["USA", "Europe", "Canada", "Mexico", "Asia"].map((r) => (
                    <a key={r} href={`/retreats?region=${r}`} className="text-[13px] text-cream-200/60 transition-colors duration-500 hover:text-cream-50">
                      {r}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-display text-[9px] font-semibold uppercase tracking-[0.3em] text-cream-50">Retreat Types</h4>
                <div className="mt-5 flex flex-col gap-3">
                  <a href="/retreats/type/yoga" className="text-[13px] text-cream-200/60 transition-colors duration-500 hover:text-cream-50">Yoga</a>
                  <a href="/retreats/type/meditation" className="text-[13px] text-cream-200/60 transition-colors duration-500 hover:text-cream-50">Meditation</a>
                  <a href="/retreats/type/detox" className="text-[13px] text-cream-200/60 transition-colors duration-500 hover:text-cream-50">Detox</a>
                  <a href="/retreats/type/luxury" className="text-[13px] text-cream-200/60 transition-colors duration-500 hover:text-cream-50">Luxury</a>
                  <a href="/retreats/type/wellness" className="text-[13px] text-cream-200/60 transition-colors duration-500 hover:text-cream-50">Wellness</a>
                  <a href="/destinations" className="text-[13px] text-cream-200/60 transition-colors duration-500 hover:text-cream-50">All Destinations</a>
                </div>
              </div>
              <div>
                <h4 className="font-display text-[9px] font-semibold uppercase tracking-[0.3em] text-cream-50">Company</h4>
                <div className="mt-5 flex flex-col gap-3">
                  <a href="/about" className="text-[13px] text-cream-200/60 transition-colors duration-500 hover:text-cream-50">About</a>
                  <a href="/methodology" className="text-[13px] text-cream-200/60 transition-colors duration-500 hover:text-cream-50">Methodology</a>
                  <a href="/for-retreats" className="text-[13px] text-cream-200/60 transition-colors duration-500 hover:text-cream-50">For Retreat Owners</a>
                  <a href="/guides" className="text-[13px] text-cream-200/60 transition-colors duration-500 hover:text-cream-50">Guides</a>
                  <a href="/science" className="text-[13px] text-cream-200/60 transition-colors duration-500 hover:text-cream-50">Science</a>
                  <a href="/blog" className="text-[13px] text-cream-200/60 transition-colors duration-500 hover:text-cream-50">Journal</a>
                  <a href="/contact" className="text-[13px] text-cream-200/60 transition-colors duration-500 hover:text-cream-50">Contact</a>
                  <a href="/quiz" className="text-[13px] text-cream-200/60 transition-colors duration-500 hover:text-cream-50">Quiz</a>
                  <a href="/compare" className="text-[13px] text-cream-200/60 transition-colors duration-500 hover:text-cream-50">Compare</a>
                </div>
              </div>
            </div>
            <div className="border-t border-cream-50/10" />
            <div className="flex flex-col items-center gap-2 py-8 sm:flex-row sm:justify-between">
              <span className="text-[10px] text-cream-200/60">&copy; {new Date().getFullYear()} RetreatVault.com</span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-cream-200/60">Precision-Rated Wellness Travel</span>
            </div>
            <div className="border-t border-cream-50/10 pt-4 pb-6">
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-cream-200/60 sm:justify-start">
                <a href="/for-retreats" className="hover:text-cream-50 transition-colors">For Retreat Owners →</a>
                <a href="/about" className="hover:text-cream-50 transition-colors">About</a>
              </div>
            </div>
          </div>
        </footer>
        </CompareProvider>
      </body>
    </html>
  );
}
