// scripts/google-reviews-scraper/scraper.ts

import { chromium, type Browser, type Page } from "playwright";
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

  // Force English UI regardless of IP geolocation
  let url = placeIdOrUrl.startsWith("http")
    ? placeIdOrUrl
    : placeIdToUrl(placeIdOrUrl);
  const sep = url.includes("?") ? "&" : "?";
  if (!url.includes("hl=en")) {
    url = `${url}${sep}hl=en`;
  }

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
