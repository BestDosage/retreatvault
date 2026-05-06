# Google Reviews Scraper — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable Google Reviews scraper that extracts full review text for any business, usable across RetreatVault, BestDosage, OkToDive, and DumpsterComparison.

**Architecture:** CLI tool using rebrowser-playwright (stealth Playwright fork) to open Google Maps place pages, scroll the reviews panel to load all reviews, extract structured data from the DOM, and output JSON. Designed as a standalone `scripts/google-reviews-scraper/` package that any project can copy or symlink.

**Tech Stack:** rebrowser-playwright (anti-detection Playwright), TypeScript, dotenv, optional residential proxy support

---

## Why rebrowser-playwright

| Option | Status | Google Maps success | Maintenance |
|--------|--------|-------------------|-------------|
| playwright-extra + stealth | Dead (last update Mar 2023) | Fails | Don't use |
| Camoufox | Overkill (200MB/instance, Firefox-only) | Works but slow | Experimental JS bindings |
| Patchright | Good (Chromium-level patches) | Works | Newer, less community |
| **rebrowser-playwright** | **Active, drop-in Playwright replacement** | **Works with residential proxies** | **Best Node.js option** |

rebrowser-playwright patches CDP (Chrome DevTools Protocol) leaks that Google detects. It's a drop-in replacement — same API as Playwright, just `import { chromium } from 'rebrowser-playwright'` instead of `from 'playwright'`.

---

## File Structure

```
scripts/google-reviews-scraper/
├── index.ts              # CLI entry point + arg parsing
├── scraper.ts            # Core scraping logic (open page, scroll, extract)
├── selectors.ts          # Google Maps DOM selectors (isolated for easy updates)
├── types.ts              # Shared TypeScript interfaces
├── rate-limiter.ts       # Delay + jitter between requests
├── README.md             # Usage docs for any project
```

**Why this structure:** Selectors change when Google updates their DOM. Isolating them in one file means fixing breakage is a 5-minute edit, not a codebase hunt. The scraper core never changes — only selectors do.

---

### Task 1: Project scaffold and dependencies

**Files:**
- Create: `scripts/google-reviews-scraper/types.ts`
- Create: `scripts/google-reviews-scraper/selectors.ts`

- [ ] **Step 1: Install rebrowser-playwright**

```bash
cd ~/Projects/retreatvault
npm install rebrowser-playwright
npx rebrowser-playwright install chromium
```

The second command downloads the Chromium binary. ~200MB, one-time.

- [ ] **Step 2: Create types file**

```typescript
// scripts/google-reviews-scraper/types.ts

export interface GoogleReview {
  author_name: string;
  rating: number;          // 1-5
  review_text: string;
  review_date: string;     // relative like "2 months ago" — we store as-is
  owner_response: string | null;
  review_id: string;       // from data-review-id attribute
}

export interface ScrapeResult {
  place_name: string;
  place_url: string;
  total_reviews_found: number;
  reviews: GoogleReview[];
  scraped_at: string;      // ISO timestamp
  errors: string[];
}

export interface ScrapeOptions {
  maxReviews?: number;     // default: 100. Set 0 for all.
  scrollDelay?: number;    // ms between scrolls. default: 1500
  proxy?: string;          // e.g., "http://user:pass@host:port"
  headless?: boolean;      // default: true
  timeout?: number;        // page load timeout ms. default: 30000
}
```

- [ ] **Step 3: Create selectors file**

```typescript
// scripts/google-reviews-scraper/selectors.ts

// Google Maps DOM selectors — updated 2026-05-06
// Google changes these periodically. When the scraper breaks,
// open a Google Maps place page, inspect the reviews panel,
// and update these selectors. Nothing else needs to change.

export const SELECTORS = {
  // The reviews tab button
  reviewsTab: 'button[aria-label*="Reviews"]',

  // The scrollable reviews container
  reviewsPanel: 'div.m6QErb.DxyBCb.kA9KIf.dS8AEf',
  // Fallback if class names change:
  reviewsPanelFallback: '[role="main"] [tabindex="-1"]',

  // Individual review container
  review: 'div[data-review-id]',

  // Within each review:
  authorName: '.d4r55',
  authorNameFallback: '[class*="d4r55"]',

  rating: 'span.kvMYJc',
  ratingFallback: '[role="img"][aria-label*="star"]',

  reviewText: '.wiI7pd',
  reviewTextFallback: '[class*="wiI7pd"]',

  // "More" button to expand truncated reviews
  expandButton: 'button.w8nwRe.kyuRq',
  expandButtonFallback: 'button[aria-expanded="false"][aria-label="See more"]',

  reviewDate: '.rsqaWe',
  reviewDateFallback: '[class*="rsqaWe"]',

  ownerResponse: '.CDe7pd',
  ownerResponseFallback: '[class*="CDe7pd"]',

  // Total review count text (e.g., "1,234 reviews")
  totalReviewCount: 'div.fontBodySmall[role="img"]',

  // Sort button (to sort by newest)
  sortButton: 'button[aria-label="Sort reviews"]',
  sortNewest: 'div[data-index="1"]', // "Newest" is typically index 1
} as const;
```

- [ ] **Step 4: Commit**

```bash
git add scripts/google-reviews-scraper/
git commit -m "feat(scraper): scaffold google reviews scraper with types and selectors"
```

---

### Task 2: Rate limiter

**Files:**
- Create: `scripts/google-reviews-scraper/rate-limiter.ts`

- [ ] **Step 1: Write the rate limiter**

```typescript
// scripts/google-reviews-scraper/rate-limiter.ts

/**
 * Human-like delay with jitter.
 * Google's behavioral analysis flags uniform timing.
 * This adds 30-70% random jitter to any base delay.
 */
export async function humanDelay(baseMs: number): Promise<void> {
  const jitter = baseMs * (0.3 + Math.random() * 0.7);
  const total = Math.floor(baseMs + jitter);
  return new Promise(resolve => setTimeout(resolve, total));
}

/**
 * Rate limiter that enforces minimum gaps between actions.
 * Tracks last action time and waits if called too soon.
 */
export class RateLimiter {
  private lastAction = 0;

  constructor(private minGapMs: number) {}

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastAction;
    if (elapsed < this.minGapMs) {
      await humanDelay(this.minGapMs - elapsed);
    }
    this.lastAction = Date.now();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/google-reviews-scraper/rate-limiter.ts
git commit -m "feat(scraper): add human-like rate limiter with jitter"
```

---

### Task 3: Core scraper

**Files:**
- Create: `scripts/google-reviews-scraper/scraper.ts`

- [ ] **Step 1: Write the scraper**

```typescript
// scripts/google-reviews-scraper/scraper.ts

import { chromium, type Browser, type Page } from "rebrowser-playwright";
import { SELECTORS } from "./selectors";
import { humanDelay, RateLimiter } from "./rate-limiter";
import type { GoogleReview, ScrapeResult, ScrapeOptions } from "./types";

const DEFAULT_OPTIONS: Required<ScrapeOptions> = {
  maxReviews: 100,
  scrollDelay: 1500,
  proxy: "",
  headless: true,
  timeout: 30000,
};

/**
 * Build a Google Maps URL from a Place ID.
 * Format: https://www.google.com/maps/place/?q=place_id:ChIJ...
 */
export function placeIdToUrl(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
}

/**
 * Scrape reviews for a single Google Maps place.
 */
export async function scrapeReviews(
  placeIdOrUrl: string,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];

  const url = placeIdOrUrl.startsWith("http")
    ? placeIdOrUrl
    : placeIdToUrl(placeIdOrUrl);

  // Launch browser
  const launchOptions: any = {
    headless: opts.headless,
  };
  if (opts.proxy) {
    launchOptions.proxy = { server: opts.proxy };
  }

  const browser: Browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    locale: "en-US",
    timezoneId: "America/New_York",
    viewport: { width: 1280, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  });

  const page: Page = await context.newPage();

  try {
    // Navigate to the place
    console.log(`  Opening: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: opts.timeout });
    await humanDelay(2000);

    // Accept cookies if dialog appears
    try {
      const acceptBtn = page.locator('button:has-text("Accept all")');
      if (await acceptBtn.isVisible({ timeout: 3000 })) {
        await acceptBtn.click();
        await humanDelay(1000);
      }
    } catch {
      // No cookie dialog — continue
    }

    // Get place name
    const placeName = await page.locator("h1").first().textContent() || "Unknown";

    // Click the Reviews tab
    console.log(`  Clicking reviews tab...`);
    const reviewsTab = page.locator(SELECTORS.reviewsTab);
    await reviewsTab.waitFor({ timeout: opts.timeout });
    await reviewsTab.click();
    await humanDelay(2000);

    // Sort by newest (more useful for recency)
    try {
      const sortBtn = page.locator(SELECTORS.sortButton);
      if (await sortBtn.isVisible({ timeout: 3000 })) {
        await sortBtn.click();
        await humanDelay(800);
        const newestOption = page.locator(SELECTORS.sortNewest);
        if (await newestOption.isVisible({ timeout: 2000 })) {
          await newestOption.click();
          await humanDelay(2000);
        }
      }
    } catch {
      errors.push("Could not sort by newest — using default order");
    }

    // Find the scrollable reviews panel
    let panel = page.locator(SELECTORS.reviewsPanel);
    if (!(await panel.isVisible({ timeout: 5000 }).catch(() => false))) {
      panel = page.locator(SELECTORS.reviewsPanelFallback);
    }

    // Scroll to load reviews
    const targetCount = opts.maxReviews === 0 ? Infinity : opts.maxReviews;
    let lastCount = 0;
    let staleScrolls = 0;

    console.log(`  Scrolling to load reviews (target: ${targetCount === Infinity ? "all" : targetCount})...`);

    while (staleScrolls < 5) {
      // Count current reviews
      const currentCount = await page.locator(SELECTORS.review).count();

      if (currentCount >= targetCount) {
        console.log(`  Reached target: ${currentCount} reviews`);
        break;
      }

      if (currentCount === lastCount) {
        staleScrolls++;
      } else {
        staleScrolls = 0;
        if (currentCount % 20 === 0) {
          console.log(`  Loaded ${currentCount} reviews...`);
        }
      }
      lastCount = currentCount;

      // Scroll the panel
      await panel.evaluate((el) => el.scrollBy(0, 3000));
      await humanDelay(opts.scrollDelay);
    }

    // Expand all truncated reviews ("More" buttons)
    console.log(`  Expanding truncated reviews...`);
    const expandButtons = page.locator(`${SELECTORS.expandButton}, ${SELECTORS.expandButtonFallback}`);
    const expandCount = await expandButtons.count();
    for (let i = 0; i < expandCount; i++) {
      try {
        await expandButtons.nth(i).click();
        await humanDelay(200);
      } catch {
        // Button may have already been clicked or disappeared
      }
    }

    // Extract reviews
    console.log(`  Extracting review data...`);
    const reviewElements = page.locator(SELECTORS.review);
    const count = await reviewElements.count();
    const reviews: GoogleReview[] = [];

    for (let i = 0; i < Math.min(count, targetCount === Infinity ? count : targetCount); i++) {
      try {
        const el = reviewElements.nth(i);

        const reviewId = (await el.getAttribute("data-review-id")) || `unknown-${i}`;

        // Author name
        let authorName = "";
        try {
          authorName = (await el.locator(SELECTORS.authorName).textContent()) || "";
        } catch {
          try {
            authorName = (await el.locator(SELECTORS.authorNameFallback).textContent()) || "";
          } catch {
            authorName = "Anonymous";
          }
        }

        // Rating — extract from aria-label like "5 stars"
        let rating = 0;
        try {
          const ratingEl = el.locator(SELECTORS.rating).first();
          const ariaLabel = (await ratingEl.getAttribute("aria-label")) || "";
          const match = ariaLabel.match(/(\d)/);
          if (match) rating = parseInt(match[1]);
        } catch {
          try {
            const ratingEl = el.locator(SELECTORS.ratingFallback).first();
            const ariaLabel = (await ratingEl.getAttribute("aria-label")) || "";
            const match = ariaLabel.match(/(\d)/);
            if (match) rating = parseInt(match[1]);
          } catch {
            errors.push(`Could not extract rating for review ${i}`);
          }
        }

        // Review text
        let reviewText = "";
        try {
          reviewText = (await el.locator(SELECTORS.reviewText).textContent()) || "";
        } catch {
          try {
            reviewText = (await el.locator(SELECTORS.reviewTextFallback).textContent()) || "";
          } catch {
            // Some reviews have no text (rating only)
          }
        }

        // Date
        let reviewDate = "";
        try {
          reviewDate = (await el.locator(SELECTORS.reviewDate).textContent()) || "";
        } catch {
          try {
            reviewDate = (await el.locator(SELECTORS.reviewDateFallback).textContent()) || "";
          } catch {
            // Date not found
          }
        }

        // Owner response
        let ownerResponse: string | null = null;
        try {
          const responseEl = el.locator(SELECTORS.ownerResponse);
          if (await responseEl.isVisible().catch(() => false)) {
            ownerResponse = (await responseEl.textContent()) || null;
          }
        } catch {
          // No owner response
        }

        if (reviewText || rating > 0) {
          reviews.push({
            author_name: authorName.trim(),
            rating,
            review_text: reviewText.trim(),
            review_date: reviewDate.trim(),
            owner_response: ownerResponse?.trim() || null,
            review_id: reviewId,
          });
        }
      } catch (err: any) {
        errors.push(`Error extracting review ${i}: ${err.message}`);
      }
    }

    console.log(`  Extracted ${reviews.length} reviews for "${placeName}"`);

    return {
      place_name: placeName.trim(),
      place_url: url,
      total_reviews_found: reviews.length,
      reviews,
      scraped_at: new Date().toISOString(),
      errors,
    };
  } finally {
    await browser.close();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/google-reviews-scraper/scraper.ts
git commit -m "feat(scraper): core Google Maps review extraction with scroll + fallback selectors"
```

---

### Task 4: CLI entry point

**Files:**
- Create: `scripts/google-reviews-scraper/index.ts`

- [ ] **Step 1: Write the CLI**

```typescript
// scripts/google-reviews-scraper/index.ts

import { config } from "dotenv";
config({ path: ".env.local" });

import { scrapeReviews, placeIdToUrl } from "./scraper";
import type { ScrapeOptions } from "./types";
import * as fs from "fs";

function printUsage() {
  console.log(`
Google Reviews Scraper — extract full review text from Google Maps

Usage:
  npx tsx scripts/google-reviews-scraper/index.ts <place_id_or_url> [options]
  npx tsx scripts/google-reviews-scraper/index.ts --file <json_file> [options]

Options:
  --max <n>        Max reviews per place (default: 100, 0 = all)
  --delay <ms>     Scroll delay in ms (default: 1500)
  --proxy <url>    Proxy URL (e.g., http://user:pass@host:port)
  --visible        Run browser visibly (not headless)
  --output <path>  Output JSON file (default: stdout)
  --file <path>    JSON file with array of {id, name, place_id} objects

Examples:
  # Single place by Place ID
  npx tsx scripts/google-reviews-scraper/index.ts ChIJN1t_tDeuEmsRUsoyG83frY4

  # Single place by URL
  npx tsx scripts/google-reviews-scraper/index.ts "https://www.google.com/maps/place/..." --max 50

  # Batch from file
  npx tsx scripts/google-reviews-scraper/index.ts --file data/place-ids.json --max 100 --output data/reviews.json

  # With proxy
  npx tsx scripts/google-reviews-scraper/index.ts ChIJ... --proxy http://user:pass@proxy.example.com:8080
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    printUsage();
    process.exit(0);
  }

  // Parse options
  const options: ScrapeOptions = {};
  let target = "";
  let batchFile = "";
  let outputPath = "";

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--max":
        options.maxReviews = parseInt(args[++i]);
        break;
      case "--delay":
        options.scrollDelay = parseInt(args[++i]);
        break;
      case "--proxy":
        options.proxy = args[++i];
        break;
      case "--visible":
        options.headless = false;
        break;
      case "--output":
        outputPath = args[++i];
        break;
      case "--file":
        batchFile = args[++i];
        break;
      default:
        if (!args[i].startsWith("--")) target = args[i];
    }
  }

  // Single place or batch
  if (batchFile) {
    const places = JSON.parse(fs.readFileSync(batchFile, "utf-8"));
    console.log(`Batch mode: ${places.length} places`);

    const results = [];
    for (let i = 0; i < places.length; i++) {
      const place = places[i];
      console.log(`\n[${i + 1}/${places.length}] ${place.name || place.place_id}`);

      try {
        const result = await scrapeReviews(place.place_id, options);
        results.push({ ...result, retreat_id: place.id });

        // Save incrementally
        if (outputPath) {
          fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        }
      } catch (err: any) {
        console.error(`  FAILED: ${err.message}`);
        results.push({
          retreat_id: place.id,
          place_name: place.name,
          error: err.message,
          reviews: [],
        });
      }

      // Wait between places (3-8 seconds with jitter)
      if (i < places.length - 1) {
        const gap = 3000 + Math.random() * 5000;
        console.log(`  Waiting ${Math.round(gap / 1000)}s before next...`);
        await new Promise((r) => setTimeout(r, gap));
      }
    }

    if (outputPath) {
      console.log(`\nDone. ${results.length} results saved to ${outputPath}`);
    } else {
      console.log(JSON.stringify(results, null, 2));
    }
  } else if (target) {
    const result = await scrapeReviews(target, options);

    if (outputPath) {
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      console.log(`Saved ${result.reviews.length} reviews to ${outputPath}`);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } else {
    printUsage();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Commit**

```bash
git add scripts/google-reviews-scraper/index.ts
git commit -m "feat(scraper): CLI entry point with single and batch modes"
```

---

### Task 5: README for cross-project use

**Files:**
- Create: `scripts/google-reviews-scraper/README.md`

- [ ] **Step 1: Write the README**

```markdown
# Google Reviews Scraper

Extracts full review text from Google Maps for any business. Built for RetreatVault, works with any project.

## Setup

```bash
npm install rebrowser-playwright
npx rebrowser-playwright install chromium
```

## Usage

```bash
# Single place by Place ID
npx tsx scripts/google-reviews-scraper/index.ts ChIJN1t_tDeuEmsRUsoyG83frY4

# Single place by URL
npx tsx scripts/google-reviews-scraper/index.ts "https://www.google.com/maps/place/..." --max 50

# Batch from file (JSON array of {id, name, place_id})
npx tsx scripts/google-reviews-scraper/index.ts --file data/place-ids.json --max 100 --output data/reviews.json

# Visible browser (for debugging)
npx tsx scripts/google-reviews-scraper/index.ts ChIJ... --visible

# With residential proxy
npx tsx scripts/google-reviews-scraper/index.ts ChIJ... --proxy http://user:pass@host:port
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--max <n>` | 100 | Max reviews per place. 0 = all. |
| `--delay <ms>` | 1500 | Scroll delay between loads |
| `--proxy <url>` | none | HTTP proxy URL |
| `--visible` | false | Show browser window |
| `--output <path>` | stdout | Save results to JSON file |
| `--file <path>` | none | Batch mode — JSON file with place data |

## When it breaks

Google changes their DOM class names periodically. When the scraper stops extracting data:

1. Open any Google Maps place page in a real browser
2. Right-click a review → Inspect
3. Update the selectors in `selectors.ts`
4. That's it — nothing else needs to change

## Using in other projects

Copy or symlink the `scripts/google-reviews-scraper/` directory into any project. Only dependency is `rebrowser-playwright`.
```

- [ ] **Step 2: Commit**

```bash
git add scripts/google-reviews-scraper/README.md
git commit -m "docs(scraper): add README with usage and maintenance guide"
```

---

### Task 6: Test with a real retreat

- [ ] **Step 1: Test single place in visible mode**

Pick a retreat with a known Google listing (e.g., Canyon Ranch Tucson):

```bash
npx tsx scripts/google-reviews-scraper/index.ts "https://www.google.com/maps/place/Canyon+Ranch+Tucson" --max 20 --visible --output data/test-reviews.json
```

Watch the browser:
- Does it load the page?
- Does it click the Reviews tab?
- Does it scroll to load reviews?
- Does `data/test-reviews.json` contain review text?

- [ ] **Step 2: Check output quality**

```bash
cat data/test-reviews.json | node -e "
const d = require('fs').readFileSync('/dev/stdin','utf8');
const r = JSON.parse(d);
console.log('Reviews:', r.reviews?.length || r.total_reviews_found);
console.log('Errors:', r.errors?.length || 0);
if (r.reviews?.[0]) {
  console.log('Sample:', JSON.stringify(r.reviews[0], null, 2));
}
"
```

Verify: `review_text` is populated, `rating` is 1-5, `author_name` exists.

- [ ] **Step 3: If selectors are broken, update selectors.ts**

Open the same URL in a real browser, inspect the DOM, and update `selectors.ts`. This is the expected maintenance pattern.

- [ ] **Step 4: Test headless mode**

```bash
npx tsx scripts/google-reviews-scraper/index.ts "https://www.google.com/maps/place/Canyon+Ranch+Tucson" --max 10 --output data/test-reviews-headless.json
```

If headless fails but visible works, Google is detecting the headless browser. Check if rebrowser-playwright needs an update:

```bash
npm update rebrowser-playwright
```

- [ ] **Step 5: Commit test results**

```bash
git add data/test-reviews.json
git commit -m "test(scraper): verify extraction with Canyon Ranch Tucson"
```

---

### Task 7: Batch test with 5 retreats

- [ ] **Step 1: Create a test batch file**

```bash
node -e "
const retreats = [
  { id: '1', name: 'Canyon Ranch Tucson', place_id: 'ChIJGwVKWNhq1oYRfY0uFXCdOAI' },
  { id: '2', name: 'Golden Door', place_id: 'ChIJrxNRX7Rr3IARwBWDPlbNpQQ' },
  { id: '3', name: 'Miraval Arizona', place_id: 'ChIJ8YWI-r0HK4cRGIjR7Sj1V4s' },
];
// Note: You'll need real Place IDs — get them from your existing enrichment script
// or look them up manually on Google Maps (the part after /place/ in the URL)
require('fs').writeFileSync('data/test-batch.json', JSON.stringify(retreats, null, 2));
"
```

If you don't have Place IDs yet, run your existing enrichment script first:
```bash
npx tsx scripts/enrich-google-ratings.ts --limit 5
```

- [ ] **Step 2: Run batch**

```bash
npx tsx scripts/google-reviews-scraper/index.ts --file data/test-batch.json --max 50 --output data/batch-reviews.json
```

- [ ] **Step 3: Verify results**

```bash
node -e "
const data = JSON.parse(require('fs').readFileSync('data/batch-reviews.json','utf8'));
data.forEach(r => console.log(r.place_name + ': ' + r.total_reviews_found + ' reviews, ' + r.errors.length + ' errors'));
"
```

- [ ] **Step 4: Commit**

```bash
git add data/test-batch.json data/batch-reviews.json
git commit -m "test(scraper): batch extraction verified with 5 retreats"
```

---

## Maintenance guide

**When it breaks (and it will):**

1. Google changes DOM class names every 1-3 months
2. Open `scripts/google-reviews-scraper/selectors.ts`
3. Open any Google Maps place in Chrome, inspect the reviews
4. Update the broken selector(s)
5. Run the test command to verify
6. Commit the selector fix

**That's a 5-minute fix.** The scraper architecture, scroll logic, and CLI never change — only the CSS selectors.

**If Google starts blocking entirely:**

1. First try: add a residential proxy (`--proxy` flag)
2. Second try: update `rebrowser-playwright` (`npm update rebrowser-playwright`)
3. Third try: increase delays (`--delay 3000`)
4. Nuclear: switch to Patchright (`npm install patchright`, change the import in `scraper.ts` line 1)

---

## Cost comparison (why building this is worth it)

| Approach | RetreatVault cost | All 4 projects cost | Annual cost |
|----------|------------------|--------------------|----|
| Apify | $5-44 | $20-176 | $80-700/yr |
| Outscraper | $85-257 | $340-1,028 | $1,360-4,112/yr |
| **This scraper** | **$0** | **$0** | **$0 + 1hr/yr maintenance** |

Break-even: first use.
