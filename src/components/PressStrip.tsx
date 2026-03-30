import AnimateIn from "./AnimateIn";

export default function PressStrip() {
  return (
    <section className="border-t border-white/[0.04] bg-dark-950">
      <div className="mx-auto max-w-[1440px] px-6 py-12 sm:px-10 lg:px-16">
        <AnimateIn>
          <div className="mb-6 text-center">
            <p className="text-[8px] font-semibold uppercase tracking-[0.4em] text-dark-500">
              Retreats recognized by
            </p>
          </div>
        </AnimateIn>
        <AnimateIn delay={0.15}>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {[
              { name: "World Spa Awards", abbr: "WORLD SPA AWARDS" },
              { name: "Cond\u00e9 Nast Traveler", abbr: "COND\u00c9 NAST TRAVELER" },
              { name: "Michelin Guide", abbr: "MICHELIN GUIDE" },
              { name: "Travel + Leisure", abbr: "TRAVEL + LEISURE" },
              { name: "Forbes Travel", abbr: "FORBES TRAVEL GUIDE" },
            ].map((pub, i) => (
              <span key={pub.name} className="flex items-center gap-8 sm:gap-12">
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-dark-400 sm:text-[11px]">
                  {pub.abbr}
                </span>
                {i < 4 && (
                  <span className="hidden h-4 w-px bg-gold-400/20 sm:block" />
                )}
              </span>
            ))}
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
