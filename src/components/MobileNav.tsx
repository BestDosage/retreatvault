"use client";

import { useState, useEffect } from "react";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? (
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 top-0 z-[999] bg-dark-950/98 backdrop-blur-xl">
          <div className="flex h-full flex-col px-8 pt-24 pb-12">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/10"
              aria-label="Close menu"
            >
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <nav className="flex flex-col gap-1">
              {[
                { href: "/retreats", label: "Directory" },
                { href: "/quiz", label: "Take the Quiz" },
                { href: "/destinations", label: "Destinations" },
                { href: "/guides", label: "Guides" },
                { href: "/compare", label: "Compare" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-white/[0.04] py-4 text-lg font-light text-white transition-colors hover:text-gold-400"
                >
                  {link.label}
                </a>
              ))}

              <div className="mt-6 mb-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Regions</p>
              </div>
              {["USA", "Europe", "Asia", "Central America", "South America"].map((region) => (
                <a
                  key={region}
                  href={`/retreats?region=${region}`}
                  onClick={() => setOpen(false)}
                  className="py-2.5 text-[15px] font-light text-dark-300 transition-colors hover:text-gold-400"
                >
                  {region}
                </a>
              ))}

              <div className="mt-6 mb-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">Popular Types</p>
              </div>
              {[
                { href: "/retreats/type/yoga", label: "Yoga" },
                { href: "/retreats/type/meditation", label: "Meditation" },
                { href: "/retreats/type/detox", label: "Detox" },
                { href: "/retreats/type/luxury", label: "Luxury" },
                { href: "/retreats/type/ayahuasca", label: "Ayahuasca" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="py-2.5 text-[15px] font-light text-dark-300 transition-colors hover:text-gold-400"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="mt-auto">
              <a
                href="/quiz"
                onClick={() => setOpen(false)}
                className="btn-luxury btn-luxury-lg btn-luxury-full"
              >
                Find Your Perfect Retreat
              </a>
              <div className="mt-6 flex items-center justify-center gap-4">
                <a href="/methodology" onClick={() => setOpen(false)} className="text-[11px] text-dark-500 hover:text-gold-400">Methodology</a>
                <span className="h-3 w-px bg-white/10" />
                <a href="/blog" onClick={() => setOpen(false)} className="text-[11px] text-dark-500 hover:text-gold-400">Journal</a>
                <span className="h-3 w-px bg-white/10" />
                <a href="/contact" onClick={() => setOpen(false)} className="text-[11px] text-dark-500 hover:text-gold-400">Contact</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
