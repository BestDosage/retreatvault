# RetreatVault Premium Uplift + Data Moat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Design tasks additionally require the `frontend-master` skill loaded in the executing agent.

**Goal:** Uplift retreatvault.com to an Awwwards-caliber premium editorial design, deepen the researcher experience, and widen the data moat with scraping pipelines competitors don't have — without losing the Mobile 95 / Desktop 100 PageSpeed scores.

**Architecture:** Three workstreams executed in phases: (1) design system + section-by-section page redesign (detail page → homepage → directory), (2) researcher features (schema markup, shareable compare, city pages), (3) data enrichment pipelines extending the existing `scripts/` enrichment pattern (Supabase writes, read-time rendering). All design changes are CSS-first; Framer Motion never above the fold.

**Tech Stack:** Next.js 14 App Router, Tailwind v4 (`@theme` in globals.css), Supabase, next/font, Anthropic SDK (already a dependency), Playwright/rebrowser-playwright (already dependencies) for scraping, Open-Meteo (free, no key) for climate.

## Global Constraints

- PageSpeed floor: Mobile ≥ 95, Desktop ≥ 100 — verify after every design phase; a regression blocks the next phase.
- No Framer Motion above the fold. Entrance animations = CSS keyframes only (existing `AnimateIn.tsx` pattern).
- Only animate `transform` and `opacity`. `prefers-reduced-motion` fallback on every animation.
- Image safety invariant: every image URL rendered must pass through `safeImageUrl()`/`isSafeImageUrl()` (`src/lib/retreat-images.ts`). Never render a raw scraped URL.
- Banned (AI-slop tells): purple/blue gradients, gradient text, side-stripe borders (`border-left` > 1px), 3-equal-card rows, pure #000/#fff, centered-everything, Inter/Fraunces/Playfair/DM/Space Grotesk and the rest of the reflex-font ban list.
- DO NOT touch: `/quiz` flow, `EmailCapture.tsx` logic, `CompareProvider.tsx` state logic (visual reskins allowed; behavior changes are not).
- Supabase writes go through `scripts/*.ts` run with `tsx`; the site reads via `src/lib/data.ts` `mapRow` only.
- All new scraped data must degrade gracefully: missing data renders a designed "Data pending" state, never an empty box.
- ISR stays at 1h for retreat + guide pages; static generation stays capped at top 200 retreats (Vercel OOM guard).
- Structure-of-truth for scoring copy: WRD methodology (`/methodology`). Never invent score justifications.

## Assumptions locked in (change before execution if wrong)

- **References:** sixsenses.com (mood/photography restraint), Wirecutter (data trust), Aman.com (typographic quiet).
- **Scope order:** Retreat detail page first (it's where researchers land and where retreats judge us for free-stay pitches), then homepage, then directory.
- **Aesthetic direction:** Editorial Luxury — warm cream, high-contrast display serif + refined grotesk, paper-grain, macro-whitespace. Dials: DESIGN_VARIANCE 6, MOTION_INTENSITY 4, VISUAL_DENSITY 4 (5–6 on data panels).

---

## Phase 0 — Design Context

### Task 1: Write `.impeccable.md`

**Files:**
- Create: `.impeccable.md` (project root)

**Interfaces:**
- Produces: design context consumed by every design task below and by any future `frontend-master` invocation.

- [ ] **Step 1: Write the file**

```markdown
# Design Context — RetreatVault

## Users
Affluent wellness-travel researchers (skew female ~78%, 30–65), planning a
$2k–$40k trip. They arrive from Google queries like "best detox retreat
2026" / "[retreat name] review". They compare 3–8 retreats over multiple
sessions. Secondary audience: retreat owners/GMs evaluating whether
RetreatVault is credible enough to host us (free-stay monetization).

## Brand Personality
Three words: **rigorous, serene, editorial.**
"Condé Nast Traveler meets Wirecutter." An analytical-chemist's scoring
system wearing a luxury-travel magazine's clothes. Calm authority — never
hype, never wellness-woo.

## Aesthetic Direction
Editorial Luxury archetype. Warm cream surfaces (never pure white), deep
warm ink (never pure black), one deep-green accent used rarely. Display
serif for headlines (Gloock), Hanken Grotesk for body/UI, tabular numerals
for all scores/prices. Subtle paper-grain overlay (opacity ≤ 0.03).
Macro-whitespace: sections breathe at py-24–py-40. Asymmetric editorial
layouts; left-aligned headlines; no 3-equal-card rows.

## Design Principles
1. Data is the luxury — score panels styled like a lab report in a
   magazine, not a SaaS widget.
2. Photography restraint — full-bleed images only when the image deserves
   it; stock fallbacks get muted duotone treatment so they read as
   ambience, not as a lie.
3. Honesty states — "Data pending" is a designed element, never hidden.
4. Speed is part of premium — nothing ships that drops PageSpeed below
   95/100. CSS-first motion, 150–300ms, ease-out.

## Dials
DESIGN_VARIANCE: 6 · MOTION_INTENSITY: 4 · VISUAL_DENSITY: 4 (6 on data panels)
```

- [ ] **Step 2: Commit**

```bash
git add .impeccable.md && git commit -m "docs: add design context (.impeccable.md)"
```

---

## Phase 1 — Design System Foundation

### Task 2: Tokens + fonts in Tailwind v4 `@theme`

**Files:**
- Modify: `src/app/globals.css` (add `@theme` tokens + grain utility)
- Modify: `src/app/layout.tsx` (next/font setup, font variables on `<html>`)

**Interfaces:**
- Produces: CSS variables `--color-cream-*`, `--color-ink-*`, `--color-sage-*`, `--color-gold`, `--font-display`, `--font-sans`; Tailwind utilities `font-display`, `bg-cream-50` etc. All later tasks style exclusively with these tokens.

- [ ] **Step 1: Fonts via next/font in `src/app/layout.tsx`**

```tsx
import { Gloock, Hanken_Grotesk } from "next/font/google";

const display = Gloock({
  subsets: ["latin"], weight: "400", display: "swap",
  variable: "--font-display", adjustFontFallback: true,
});
const sans = Hanken_Grotesk({
  subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap",
  variable: "--font-sans", adjustFontFallback: true,
});
// on <html>: className={`${display.variable} ${sans.variable}`}
```

Remove any Google Fonts `<link>` tags if present.

- [ ] **Step 2: Add `@theme` block to `globals.css`**

```css
@theme {
  --font-display: var(--font-display), "Georgia", serif;
  --font-sans: var(--font-sans), system-ui, sans-serif;

  /* Warm cream surfaces — OKLCH, hue 85 (warm) */
  --color-cream-50: oklch(0.975 0.008 85);
  --color-cream-100: oklch(0.955 0.010 85);
  --color-cream-200: oklch(0.925 0.012 85);
  /* Warm ink */
  --color-ink-900: oklch(0.24 0.015 85);
  --color-ink-700: oklch(0.36 0.014 85);
  --color-ink-500: oklch(0.50 0.012 85);
  /* Single accent: deep sage green */
  --color-sage-700: oklch(0.42 0.075 155);
  --color-sage-600: oklch(0.48 0.080 155);
  --color-sage-100: oklch(0.93 0.025 155);
  /* Score gold — badges only, never body text on cream */
  --color-gold: oklch(0.70 0.115 85);
}
```

- [ ] **Step 3: Paper-grain utility (fixed, pointer-events-none)**

```css
.grain::after {
  content: ""; position: fixed; inset: 0; pointer-events: none;
  opacity: 0.03; z-index: 1;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
}
```

- [ ] **Step 4: Verify build + baseline PageSpeed**

Run: `npm run build` → expect success. Deploy preview; record PageSpeed baseline for `/` and one `/retreats/[slug]` page in `docs/superpowers/plans/pagespeed-log.md` (create it: date, URL, mobile, desktop, LCP, TBT, CLS).

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx docs/superpowers/plans/pagespeed-log.md
git commit -m "feat: editorial-luxury design tokens, Gloock + Hanken Grotesk via next/font"
```

---

## Phase 2 — Retreat Detail Page Redesign (`src/app/retreats/[slug]/page.tsx`)

Build section-by-section, top to bottom. Each task = one section, verified visually (localhost screenshot at 390px and 1440px) before the next.

### Task 3: Hero + identity block

**Files:**
- Modify: `src/app/retreats/[slug]/page.tsx` (hero section)
- Modify: `src/lib/retreat-images.ts` (add `isStockFallback(url): boolean` — true when the URL is one of our Unsplash location fallbacks)

**Interfaces:**
- Produces: `isStockFallback(url: string): boolean` exported from `src/lib/retreat-images.ts` (Task 8 reuses it for cards).

Spec (photo-reality principle):
- **Real photo available** (Unsplash/Pexels/local, not a location fallback): full-bleed hero, `next/image` `fill priority fetchPriority="high" sizes="100vw" quality={70}`, retreat name overlaid bottom-left in `font-display text-5xl md:text-7xl tracking-tight` on a bottom gradient scrim (`from-ink-900/60 to-transparent`).
- **Stock fallback** (`isStockFallback` true): editorial split instead — left 60%: cream panel, name in display serif, subtitle, location line, tier badge; right 40%: the stock image with CSS duotone mute (`filter: sepia(0.25) saturate(0.55)`) and caption `text-xs text-ink-500` "Location imagery — official photos pending". The page never pretends stock is the property.
- Identity strip under hero: location · property type · price band (tabular nums) · nearest airport, as a single `border-y border-cream-200` row, `text-sm text-ink-700`, left-aligned.

- [ ] **Step 1: Implement `isStockFallback` in `src/lib/retreat-images.ts`** — return true iff the URL matches the fallback-generation pattern already used by `safeImageUrl()` (same host + the location-keyed path/params it constructs). Unit-verify by calling it in a scratch `tsx` script against one known fallback URL and one real Unsplash gallery URL.
- [ ] **Step 2: Build both hero variants** in `page.tsx` per spec above.
- [ ] **Step 3: Visual check** — `npm run dev`, screenshot one retreat with a real image and one with a fallback at 390px/1440px. Run the AI-slop test against the banned list.
- [ ] **Step 4: Commit** — `git commit -m "feat: editorial hero with photo-reality split for stock fallbacks"`

### Task 4: WRD score presentation — "lab report" panel

**Files:**
- Modify: `src/components/WrdScore.tsx`, `src/components/ScoreBar.tsx`, `src/components/RadarChart.tsx`, `src/components/TierBadge.tsx`

Spec:
- Double-bezel enclosure: outer `bg-ink-900/[0.04] ring-1 ring-ink-900/5 rounded-[2rem] p-1.5`, inner `bg-cream-50 rounded-[calc(2rem-0.375rem)] p-8 md:p-10`.
- Headline number: WRD score in `font-display text-6xl tabular-nums`, "/ 10" in `text-ink-500 text-xl`. Tier badge = small pill (`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]`), gold bg for Elite, sage for Exceptional — no emoji icons.
- Category bars: 1px-track bars (`h-px bg-cream-200` track, `h-[3px] bg-sage-600` fill), category label `text-xs uppercase tracking-wide text-ink-500`, value right-aligned tabular. Density dial 6: tight 10px row gaps.
- Radar chart recolored to token palette (ink stroke, sage fill at 12% alpha); no chart.js default blue.
- Every category with no data renders "Data pending" in italic `text-ink-500` — never a zero bar.
- Methodology link: quiet text link "How we score →" to `/methodology`.

- [ ] **Step 1: Restyle the four components** per spec (visual reskin only — score math untouched).
- [ ] **Step 2: Visual check** at both breakpoints; confirm chart.js bundle is not loaded above the fold (radar stays below fold or lazy via existing pattern).
- [ ] **Step 3: Commit** — `git commit -m "feat: lab-report WRD score panel with double-bezel + token palette"`

### Task 5: Editorial review + intelligence panels

**Files:**
- Modify: `src/components/EditorialReview.tsx`, `src/components/IntelligencePanels.tsx`, `src/components/GuestIntelligence.tsx`, `src/components/GuestSentiment.tsx`, `src/components/VaultVsGuest.tsx`

Spec:
- Editorial review styled as a magazine pull-quote block: opening line as a `font-display text-2xl md:text-3xl leading-snug` deck, body at `max-w-[65ch] text-ink-700 leading-relaxed`, thin rule above with an eyebrow tag ("THE VAULT REVIEW", `text-[10px] uppercase tracking-[0.2em]`), byline "RetreatVault Editorial" with review date.
- Intelligence panels: no cards-in-cards; each panel is a rule-separated editorial section (`border-t border-cream-200 pt-8`), heading left, content right on md+ (asymmetric 1fr/2fr grid), single column < 768px.
- `GuestSentiment` empty state (table is empty until Phase 6 Task 13): designed pending state — "Guest sentiment analysis in progress · based on aggregated public reviews" — so shipping design doesn't wait on data.
- Existing disclaimers on derived panels stay verbatim.

- [ ] **Step 1: Restyle the five components** per spec.
- [ ] **Step 2: Visual check** both breakpoints, all states (with data / pending).
- [ ] **Step 3: Commit** — `git commit -m "feat: editorial review pull-quote + rule-separated intelligence panels"`

### Task 6: Detail-page CTAs, sticky bar, similar retreats + phase gate

**Files:**
- Modify: `src/components/StickyMobileBar.tsx`, `src/components/AddToCompareButton.tsx`, `src/components/SimilarRetreatCard.tsx`, `src/components/SimilarRetreats.tsx`, `src/components/RealCostCalculator.tsx` (reskin only)

Spec:
- Primary CTA = full-rounded pill, `bg-ink-900 text-cream-50`, trailing arrow nested in its own `w-8 h-8 rounded-full bg-white/10` circle; `active:scale-[0.97]`, 150ms ease-out. Secondary (Add to compare) = `ring-1 ring-ink-900/20` ghost pill.
- Sticky mobile bar: cream glass (`bg-cream-50/90 backdrop-blur-md border-t border-cream-200`), price + one CTA, safe-area padding.
- Similar retreats: horizontal scroll strip (existing `HorizontalScroll.tsx`), cards per Task 8 spec once it lands (until then, token recolor only).

- [ ] **Step 1: Reskin the five components** per spec.
- [ ] **Step 2: PHASE GATE — full verification**: `npm run build`; deploy; PageSpeed on one detail page → Mobile ≥ 95 / Desktop ≥ 100, log to `pagespeed-log.md`. Any regression: fix before Phase 3 (check the Four Killers: raw img / font link / above-fold motion / rAF loops).
- [ ] **Step 3: Commit** — `git commit -m "feat: detail page CTAs, sticky bar, similar-retreats reskin"`

---

## Phase 3 — Homepage + Retreat Cards

### Task 7: Homepage hero + section rhythm (`src/app/page.tsx`)

Spec:
- Split editorial hero (anti-center): left — display-serif headline (concrete value prop, e.g. "9,400 wellness retreats. Scored like they matter." — final copy at execution, no "Elevate/Unleash" filler), sub-line, search/quiz entry; right — one full-height image (real photo from a top-scored retreat, `next/image priority`). Single column < 768px, image second.
- Section order kept (guides, featured, regions, press, email capture) but re-spaced at `py-24`–`py-32` with eyebrow tags; PressStrip as quiet grayscale row.
- Featured retreats: NO 3-equal-cards — asymmetric 2fr/1fr/1fr grid: one large editorial feature card + stacked smaller ones; single column on mobile.
- All entrance animation = existing CSS `AnimateIn` pattern; zero Framer Motion above fold.

- [ ] **Step 1: Rebuild hero** per spec. Visual check.
- [ ] **Step 2: Re-space + reskin remaining sections** top-to-bottom, one commit per section, visual check each.
- [ ] **Step 3: Commit** (final) — `git commit -m "feat: editorial homepage — split hero, asymmetric featured grid"`

### Task 8: `RetreatCard.tsx` — the system-wide card

**Files:**
- Modify: `src/components/RetreatCard.tsx`
- Consumes: `isStockFallback()` from Task 3.

Spec:
- Image top (4:3, `next/image` with `sizes`), duotone-muted when `isStockFallback`; tier pill overlaid top-left only for Elite/Exceptional.
- Body: name in `font-display text-xl`, one-line location `text-sm text-ink-500`, bottom row = WRD score (tabular, `font-semibold`) + price band right-aligned. Full `ring-1 ring-cream-200` border, `rounded-2xl`, no drop shadow at rest; hover: `-translate-y-1` + `shadow-[0_20px_40px_-24px_rgba(0,0,0,0.15)]`, 200ms ease-out, gated `@media (hover:hover)`.
- No side-stripes, no gradient overlays on text.

- [ ] **Step 1: Rebuild card** per spec.
- [ ] **Step 2: Verify everywhere it renders** (home, directory, guides, similar) at both breakpoints.
- [ ] **Step 3: PHASE GATE** — build + PageSpeed on `/` → floor holds; log it.
- [ ] **Step 4: Commit** — `git commit -m "feat: editorial retreat card, photo-reality aware"`

---

## Phase 4 — Directory / Researcher Workbench

### Task 9: `/retreats` filters + results (`src/app/retreats/page.tsx`, `src/components/RetreatFilters.tsx`, `src/components/CompareBar.tsx`)

Spec:
- Filters as a sticky top toolbar of pill controls (region, price band, specialty, score tier, sort) — not a left sidebar; horizontal scroll of pills on mobile. Active filter pills `bg-ink-900 text-cream-50`.
- Result count + applied-filters summary line ("142 retreats · Europe · Detox · 8.0+") in `text-sm text-ink-500` — researchers need scent of state.
- CompareBar reskinned as floating bottom cream-glass pill showing selected thumbnails + "Compare (n)" CTA. Behavior untouched.
- VISUAL_DENSITY 5 here: tighter card grid gaps than homepage.

- [ ] **Step 1: Rebuild filter toolbar** (reskin; filter logic untouched). Visual check.
- [ ] **Step 2: Reskin CompareBar.** Visual check, then commit both:

```bash
git commit -m "feat: directory workbench — sticky pill filters, floating compare bar"
```

---

## Phase 5 — Researcher Features (SEO + trust)

### Task 10: JSON-LD structured data on detail pages

**Files:**
- Create: `src/components/RetreatJsonLd.tsx`
- Modify: `src/app/retreats/[slug]/page.tsx` (render it in the page)

- [ ] **Step 1: Implement component**

```tsx
// src/components/RetreatJsonLd.tsx
import type { Retreat } from "@/lib/types";

export function RetreatJsonLd({ retreat }: { retreat: Retreat }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Resort",
    name: retreat.name,
    url: `https://www.retreatvault.com/retreats/${retreat.slug}`,
    address: { "@type": "PostalAddress", addressLocality: retreat.city, addressCountry: retreat.country },
    ...(retreat.coordinates && {
      geo: { "@type": "GeoCoordinates", latitude: retreat.coordinates.lat, longitude: retreat.coordinates.lng },
    }),
    ...(retreat.google_rating && retreat.google_review_count >= 5 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: retreat.google_rating,
        reviewCount: retreat.google_review_count,
        bestRating: 5,
      },
    }),
    ...(retreat.price_min_per_night && {
      priceRange: `$${retreat.price_min_per_night}–$${retreat.price_max_per_night} per night`,
    }),
  };
  return (
    <script type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
```

(Adjust field names to `src/lib/types.ts` at execution — the shape above mirrors the schema in Section 6 of the directory spec; verify each property exists on `Retreat` before use.)

- [ ] **Step 2: Validate** one rendered page's JSON-LD with Google's Rich Results Test. Expected: valid `Resort` with `aggregateRating`.
- [ ] **Step 3: Commit** — `git commit -m "feat: Resort + AggregateRating JSON-LD on retreat pages"`

### Task 11: Shareable compare URLs

**Files:**
- Modify: `src/app/compare/page.tsx` (read `?r=` searchParam, hydrate selection)
- Modify: `src/components/CompareProvider.tsx` (add URL-sync effect ONLY — write `?r=slug1,slug2,slug3` via `router.replace` on selection change; selection logic untouched)

- [ ] **Step 1: URL → state**: on `/compare` load, parse `searchParams.r`, split on commas, validate each slug against fetched retreats, seed the compare selection.
- [ ] **Step 2: State → URL**: `useEffect` in provider syncing selection to `?r=` with `router.replace(..., { scroll: false })`.
- [ ] **Step 3: Verify round-trip**: select 3 retreats → copy URL → open in incognito → same 3 appear. Add a "Copy link" button next to the compare header (clipboard API, "Copied" state for 2s).
- [ ] **Step 4: Commit** — `git commit -m "feat: shareable compare URLs (?r=slugs)"`

### Task 12: City-level pages

**Files:**
- Modify: `src/app/retreats/city/page.tsx` → verify current state; build `src/app/retreats/city/[city]/page.tsx` if param route missing
- Modify: `src/app/sitemap.ts` (add city URLs)

- [ ] **Step 1: Query distinct cities** with ≥ 3 retreats from Supabase (script check first: `npx tsx -e` count query) — this is the page list.
- [ ] **Step 2: Build `[city]` page** reusing the destinations-page pattern (`deriveLocationStats` from `src/lib/location-intelligence.ts`, RetreatCard grid, intro paragraph, JSON-LD `ItemList`). `generateStaticParams` for top 50 cities only (OOM guard); rest on-demand ISR.
- [ ] **Step 3: Sitemap + internal links**: add cities to `sitemap.ts`; link city pills from country/region pages.
- [ ] **Step 4: Commit** — `git commit -m "feat: city-level landing pages for cities with 3+ retreats"`

### Task 18: WRD score recalibration — raise scores defensibly (runs any time after Phase 1; before Task 4 is ideal)

**Owner note (from Chad, 2026-07-13):** scores should be higher overall. Constraint: recalibrate, don't inflate — the methodology page must always describe what the numbers actually are.

**Files:**
- Create: `scripts/audit-score-distribution.ts`
- Create: `scripts/recalibrate-scores.ts`
- Modify: `src/app/methodology/page.tsx` (copy updated to match new calibration)
- Modify: `src/lib/data.ts` or score utils (display gate constant)

**Interfaces:**
- Produces: recalibrated `wrd_score` + `score_tier` for all retreats; `MIN_PUBLIC_SCORE` display-gate constant.

- [ ] **Step 1: Audit current distribution** — `audit-score-distribution.ts`: histogram of `wrd_score` (0.5 buckets), per-category null/zero rates, median/p90. Print summary. This tells us exactly why scores skew low.
- [ ] **Step 2: Fix missing-data penalty (the honest lever)** — per the directory spec ("Do not penalize a retreat for categories where data is simply unavailable"): categories with no data are EXCLUDED from the weighted average (weights renormalized over present categories), not scored 0. For most scraped retreats this alone lifts scores substantially.
- [ ] **Step 3: Curve calibration** — after Step 2, map raw scores through a monotonic curve so the fleet median lands ~7.3–7.6 and genuine top properties reach 9.0+ (e.g., piecewise-linear percentile mapping). Tier thresholds unchanged (9.0 Elite / 8.0 Exceptional / 7.0 Highly Recommended). Preserve rank order exactly — recalibration never reorders retreats.
- [ ] **Step 4: Display gate** — add `MIN_PUBLIC_SCORE = 6.5` (BestDosage pattern): below it, pages show tier text "Listed" with no number rather than a low number. Constant in one place.
- [ ] **Step 5: Run recalibration on all retreats**, re-run the audit script, compare before/after histograms in the report. Spot-check: the 20 seed flagship retreats (Kamalaya, The Ranch, Amangiri…) should land 8.5+; a thin scraped listing with 3 data points should read mid-7s, not 4s.
- [ ] **Step 6: Update `/methodology`** — one new paragraph: categories without verified data are excluded from the weighted score rather than penalized; scores are calibrated across the full directory. Publish `MIN_PUBLIC_SCORE` policy.
- [ ] **Step 7: Commit** — `git commit -m "feat: WRD score recalibration — missing-data exclusion, curve calibration, display gate"`

---

## Phase 6 — Data Moat Pipelines

Each pipeline extends the existing `scripts/` pattern: `tsx` script → Supabase write → `mapRow` read → component render. All are independent; run in any order. Nightly scheduling joins `run-nightly-scrape.sh` / launchd (sleep-safe, per infra standard).

### Task 13: Guest sentiment pipeline (fills the empty `retreat_reviews` table)

**Files:**
- Modify/verify: `scripts/enrich-google-ratings.ts` (exists — confirm it captures review TEXT, not just rating; extend if not)
- Create: `scripts/analyze-review-sentiment.ts`
- Modify: `src/components/GuestSentiment.tsx` (swap pending state for real data render)

**Interfaces:**
- Produces: rows in `retreat_reviews` + per-retreat `sentiment_themes jsonb` (shape: `{ food: {pos: n, neg: n, quote: string}, staff: {...}, facilities: {...}, program: {...}, value: {...}, sleep: {...} }`).

- [ ] **Step 1: Audit `scripts/enrich-google-ratings.ts` + `scripts/google-reviews-scraper/`** — determine what review text already lands where; write findings at top of the new script as comments.
- [ ] **Step 2: Write `analyze-review-sentiment.ts`**: batch retreats with ≥ 10 stored reviews; per retreat, one Haiku 4.5 call (Anthropic SDK already in deps) classifying reviews into the six themes with counts + one representative quote each (verbatim, ≤ 200 chars); write `sentiment_themes` to Supabase. Concurrency 2, resumable (skip rows where `sentiment_themes` not null), log to `data/sentiment-$(date +%Y%m%d).log`.
- [ ] **Step 3: Pilot run on 25 retreats**: `npx tsx scripts/analyze-review-sentiment.ts --limit 25`. Manually spot-check 5 outputs for accuracy (quotes must be verbatim from source reviews).
- [ ] **Step 4: Wire `GuestSentiment.tsx`** to render themes (pos/neg counts as paired sage/ink bars, quote as small italic). Keep disclaimer: "Derived from aggregated public reviews."
- [ ] **Step 5: Full run in background** (nohup, concurrency 2 — same ops pattern as editorial reviews). Commit code first:

```bash
git commit -m "feat: guest sentiment pipeline — review themes via Haiku classification"
```

### Task 14: Seasonality — "Best time to go" (zero-cost, zero-competitor layer)

**Files:**
- Create: `scripts/enrich-seasonality.ts`
- Create: `src/components/BestTimeToVisit.tsx`
- Modify: `src/app/retreats/[slug]/page.tsx` (render component)
- Modify: Supabase — add column `monthly_climate jsonb` to retreats table (SQL in `src/lib/supabase-schema.sql` appended, applied via dashboard — per standing rule, no Supabase MCP)

- [ ] **Step 1: Write enrichment script**: for every retreat with coordinates, call Open-Meteo climate normals (`https://climate-api.open-meteo.com/v1/climate?latitude=..&longitude=..&start_date=1991-01-01&end_date=2020-12-31&models=EC_Earth3P_HR&monthly=temperature_2m_mean,precipitation_sum` — verify exact params against current Open-Meteo docs at execution); reduce to 12 rows of `{month, tempC, rainMm}`; write `monthly_climate`. Free API, no key; throttle 2 req/s; resumable.
- [ ] **Step 2: Run on all retreats with coordinates** (background, logged).
- [ ] **Step 3: Build `BestTimeToVisit.tsx`**: 12-month strip — month initials, temp as number, rain as subtle bar; best months (temp 18–28°C, lowest rain) highlighted sage; one summary sentence ("Best: April–June, September"). Tabular nums, dataviz-skill-compliant colors from tokens. "Data pending" state when null.
- [ ] **Step 4: Commit** — `git commit -m "feat: monthly climate layer + Best Time to Visit (Open-Meteo)"`

### Task 15: Forum/Reddit intel (extend existing script)

**Files:**
- Modify: `scripts/discover-forum-intel.ts` (exists — audit first)
- Create (if script's output has no render surface): section inside `src/components/GuestIntelligence.tsx` — "What researchers ask"

- [ ] **Step 1: Audit `discover-forum-intel.ts`**: what does it fetch, where does it write, what blocked it (memory says this needed SerpAPI/paid search)? Document findings.
- [ ] **Step 2: Re-point discovery at free paths**: Reddit's public JSON (`https://www.reddit.com/search.json?q="<retreat name>"&limit=25`, User-Agent set, 1 req/2s) + existing Firecrawl skill for thread content of top hits. Store per retreat: `forum_mentions jsonb` `{source, title, url, snippet, sentiment}`.
- [ ] **Step 3: Pilot on the 20 seed retreats** (the famous ones — Kamalaya, The Ranch, Amangiri… — these have real Reddit chatter). Spot-check output quality; if < half the pilot retreats yield usable mentions, stop and flag before scaling.
- [ ] **Step 4: Render**: "From the forums" list (source tag, quote snippet, outbound nofollow link) inside GuestIntelligence, only when ≥ 2 mentions exist.
- [ ] **Step 5: Commit** — `git commit -m "feat: forum/Reddit intel layer on retreat pages"`

### Task 16: Pricing inclusions/exclusions enrichment (powers Real Cost Calculator)

**Files:**
- Modify: `scripts/enrich-from-websites.ts` (exists — extend extraction)
- Modify: `src/components/RealCostCalculator.tsx` (consume real inclusions)

- [ ] **Step 1: Audit `enrich-from-websites.ts`** — current fields extracted, coverage rate.
- [ ] **Step 2: Extend extraction schema** with `inclusions jsonb`: `{meals: bool|null, transfers: bool|null, treatments_count: number|null, gratuity_required: bool|null, min_stay_nights: number|null, notes: string}` — extracted by Claude from scraped pricing-page text; null when not stated (honesty rule).
- [ ] **Step 3: Run on top 500 retreats by traffic** (GSC/Ahrefs top pages list). Log coverage.
- [ ] **Step 4: Wire calculator**: pre-fill known inclusions ("Meals: included ✓ — per resort website"), keep manual sliders for unknowns, label provenance.
- [ ] **Step 5: Commit** — `git commit -m "feat: pricing inclusions extraction feeding Real Cost Calculator"`

---

## Phase 7 — Photo Recovery + Free-Stay Outreach (business track, runs parallel from Phase 2 onward)

### Task 17: Verified program + official-photo pipeline

**Files:**
- Create: `docs/outreach/verified-program-pitch.md` (email template + program terms)
- Create: `scripts/import-official-photos.ts`
- Modify: `src/lib/retreat-images.ts` (allow new host: our own Supabase storage bucket for uploaded official photos)
- Modify: `src/components/TierBadge.tsx` or detail page — "Verified" mark for participating retreats (`is_verified` field already in schema)

- [ ] **Step 1: Build target list**: top 100 retreat pages by impressions (GSC via Ahrefs MCP), exported to `docs/outreach/top100-targets.csv` with contact emails where scrapable (existing enrichment data).
- [ ] **Step 2: Write the pitch doc**: offer = official photo rights + "Verified" badge + corrected data review; ask = photo pack + fact-check; escalation ask = hosted stay for full firsthand review (the monetization). Draft in Chad's voice (chad-context skill at execution). **CHECKPOINT: Chad approves template before anything sends.**
- [ ] **Step 3: Photo import path**: `import-official-photos.ts` uploads a local folder to Supabase storage `official-photos/` bucket, writes URLs to `hero_image_url`/`gallery_images`; whitelist the bucket host in `isSafeImageUrl()` (this is the ONLY new host allowed — licensed by direct grant).
- [ ] **Step 4: Verified render**: quiet "✓ Verified — data confirmed by property" line under identity strip when `is_verified`.
- [ ] **Step 5: Commit** — `git commit -m "feat: verified-program photo import path + verified mark"`

---

## Sequencing summary

| Order | Phase | Depends on | Parallel-safe with |
|---|---|---|---|
| 1 | 0 + 1 (context, tokens) | — | 6 (pipelines), 7 Step 1–2 |
| 2 | 2 (detail page) | 1 | 6, 7 |
| 3 | 3 (homepage/cards) | 1 (+ Task 3's `isStockFallback`) | 6, 7 |
| 4 | 4 (directory) | Task 8 card | 5, 6, 7 |
| 5 | 5 (SEO features) | — (Task 10–12 independent of design) | everything |
| 6 | 6 (data pipelines) | — | everything |
| 7 | 7 (outreach) | pitch checkpoint (Chad) | everything |

PageSpeed gate after Phases 2, 3, 4. Chad checkpoint: outreach template (Task 17 Step 2) only — everything else executes autonomously per standing instruction.

## Self-review notes

- Spec coverage: design uplift (Phases 0–4), researcher desirability (Phase 5 + score/sentiment/seasonality presentation), scraping differentiation (Phase 6), monetization enablement (Phase 7). Directory-spec items intentionally deferred: FAQ-per-retreat + remaining editorial reviews (needs API credit decision), TripAdvisor API (application lead time), Instagram engagement (Meta API access) — none block the above.
- Field names in Tasks 10/13/14/16 must be reconciled against `src/lib/types.ts` and live Supabase schema at execution start (one read of `types.ts` per task).
- All new Supabase columns are additive jsonb — no migrations of existing data.
