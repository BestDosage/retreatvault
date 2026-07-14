import AnimateIn from "./AnimateIn";

// Quiet grayscale credibility row for the cream editorial system.
// No color, no gold — publications read as a muted ink whisper, not a banner.
export default function PressStrip() {
  return (
    <section className="border-y border-cream-200 bg-cream-50">
      <div className="mx-auto max-w-[1440px] px-6 py-10 sm:px-10 lg:px-16">
        <AnimateIn>
          <div className="mb-6 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-ink-500">
              Retreats recognized by
            </p>
          </div>
        </AnimateIn>
        <AnimateIn delay={0.15}>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {[
              { name: "World Spa Awards", abbr: "WORLD SPA AWARDS" },
              { name: "Condé Nast Traveler", abbr: "CONDÉ NAST TRAVELER" },
              { name: "Michelin Guide", abbr: "MICHELIN GUIDE" },
              { name: "Travel + Leisure", abbr: "TRAVEL + LEISURE" },
              { name: "Forbes Travel", abbr: "FORBES TRAVEL GUIDE" },
            ].map((pub, i) => (
              <span key={pub.name} className="flex items-center gap-8 sm:gap-12">
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-500/70 transition-colors duration-500 hover:text-ink-700 sm:text-[11px]">
                  {pub.abbr}
                </span>
                {i < 4 && (
                  <span className="hidden h-4 w-px bg-cream-200 sm:block" />
                )}
              </span>
            ))}
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
