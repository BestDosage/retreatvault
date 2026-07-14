"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import MobileNav from "./MobileNav";

/**
 * Site-wide editorial nav (cream). Transparent over the top of a page so cream
 * heroes read seamlessly, then flips to a cream-glass bar with a hairline border
 * once the reader scrolls past the fold. Links use ink micro-label styling; the
 * quiz CTA is the primary ink pill. Fixed height (h-20 = 80px) is the single
 * source of truth for the sticky-toolbar offset in RetreatFilters (top-20).
 *
 * Legibility over the rare full-bleed detail hero: content sits at the bottom
 * behind a bottom scrim, so the image top stays bright — ink links read cleanly
 * there too. Client boundary is minimal: one scroll listener, no other JS.
 */
const LINKS = [
  { href: "/retreats", label: "Directory", vis: "hidden sm:inline-flex" },
  { href: "/retreats?region=USA", label: "USA", vis: "hidden md:inline-flex" },
  { href: "/retreats?region=Europe", label: "Europe", vis: "hidden md:inline-flex" },
  { href: "/retreats?region=Asia", label: "Asia", vis: "hidden lg:inline-flex" },
  { href: "/blog", label: "Journal", vis: "hidden lg:inline-flex" },
];

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Transparent-at-top only on pages that open with a cream/photo hero the nav
  // is meant to float over: the homepage and a retreat detail page. Everywhere
  // else (directory, compare, blog, quiz — some still on the dark theme) the
  // cream bar shows from the top so ink links never sit illegibly on dark.
  const heroPage = pathname === "/" || /^\/retreats\/[^/]+$/.test(pathname);
  const solid = scrolled || !heroPage;

  return (
    <>
    <nav
      className={`fixed top-0 z-50 w-full transition-colors duration-300 ease-out ${
        solid
          ? "border-b border-cream-200 bg-cream-50/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6 sm:px-10 lg:px-16">
        {/* Logo — gold lotus brand mark stays */}
        <a href="/" className="flex items-center" aria-label="RetreatVault home">
          <Image
            src="/logo-transparent.png"
            alt="RetreatVault"
            width={224}
            height={112}
            priority
            className="h-11 w-auto"
          />
        </a>

        {/* Links */}
        <div className="flex items-center gap-7">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`${link.vis} text-[11px] font-medium uppercase tracking-[0.2em] text-ink-700 transition-colors duration-200 ease-out hover:text-ink-900`}
            >
              {link.label}
            </a>
          ))}
          <a
            href="/quiz"
            className="hidden rounded-full bg-ink-900 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream-50 transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.97] sm:inline-flex"
          >
            Take the Quiz
          </a>
        </div>
      </div>
    </nav>
    {/* Sibling of <nav> so its full-screen sheet isn't clipped by the nav's
        backdrop-filter containing block. */}
    <MobileNav />
    </>
  );
}
