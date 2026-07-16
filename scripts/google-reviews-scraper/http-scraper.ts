// scripts/google-reviews-scraper/http-scraper.ts
//
// HTTP-based Google Reviews scraper — intercepts the listugcposts API.
// Uses Playwright to search Google Maps + click Reviews tab.
// All review data comes from the API response, not DOM scraping.
// Zero CSS selectors to maintain.

import { chromium, type Browser, type Page } from "playwright";
import { humanDelay } from "./rate-limiter";
import type { GoogleReview, ScrapeResult, ScrapeOptions } from "./types";

const DEFAULT_OPTIONS: Required<ScrapeOptions> = {
  maxReviews: 100,
  scrollDelay: 2000,
  proxy: "",
  headless: false, // Google detects headless and hides Reviews tab
  timeout: 30000,
};

/**
 * Parse the listugcposts API response into structured reviews.
 *
 * Response structure (after stripping )]}' prefix):
 * [null, paginationToken, [
 *   [  // each review wrapper
 *     [  // inner[0..5]
 *       reviewId,           // [0] base64 string
 *       reviewMetadata,     // [1] array — author at [4][5][0], date at [6]
 *       reviewContent,      // [2] array — rating at [0][0], text is longest string (recursive)
 *       links,              // [3] business response links
 *       stats,              // [4] review stats
 *       sessionToken        // [5] string
 *     ],
 *     null,
 *     nextPageToken
 *   ],
 *   ...
 * ]]
 */
function parseReviewResponse(raw: string): GoogleReview[] {
  const clean = raw.replace(/^\)\]\}'\n/, "");
  const reviews: GoogleReview[] = [];

  try {
    const data = JSON.parse(clean);
    const reviewWrappers = data?.[2] || [];

    for (const wrapper of reviewWrappers) {
      try {
        const inner = wrapper?.[0];
        if (!inner || !Array.isArray(inner)) continue;

        const reviewId = inner[0] || "";
        const metadata = inner[1]; // author, date
        const content = inner[2]; // rating, text

        // Author name: metadata[4][5][0]
        const authorName = metadata?.[4]?.[5]?.[0] || "Anonymous";

        // Date: metadata[6]
        const reviewDate = metadata?.[6] || "";

        // Rating: content[0][0] or content[0]
        let rating = 0;
        if (Array.isArray(content?.[0]) && typeof content[0][0] === "number") {
          rating = content[0][0];
        } else if (typeof content?.[0] === "number") {
          rating = content[0];
        }

        // Review text: find the longest string in content (recursive)
        let reviewText = "";
        const contentStr = JSON.stringify(content || []);
        const textMatches = contentStr.match(/"([A-Z][^"]{30,})"/g) || [];
        if (textMatches.length > 0) {
          reviewText = textMatches
            .sort((a, b) => b.length - a.length)[0]
            .replace(/^"|"$/g, "")
            .replace(/\\n/g, "\n")
            .replace(/\\u003d/g, "=")
            .replace(/\\"/g, '"');
        }

        // Owner response: check inner[3] for response text
        let ownerResponse: string | null = null;
        if (inner[3]) {
          const respStr = JSON.stringify(inner[3]);
          const respMatch = respStr.match(/"([A-Z][^"]{30,})"/g);
          if (respMatch) {
            ownerResponse = respMatch
              .sort((a, b) => b.length - a.length)[0]
              .replace(/^"|"$/g, "");
          }
        }

        if (reviewText || rating > 0) {
          reviews.push({
            author_name: authorName,
            rating,
            review_text: reviewText,
            review_date: reviewDate,
            owner_response: ownerResponse,
            review_id: reviewId,
          });
        }
      } catch {
        // Skip malformed entries
      }
    }
  } catch {
    // JSON parse failure — return empty
  }

  return reviews;
}

/**
 * Scrape reviews using the HTTP API interception approach.
 * Flow: open Maps → search → click Reviews tab → intercept listugcposts → scroll for more.
 */
export async function scrapeReviewsHttp(
  searchQuery: string,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];

  const launchOptions: any = {
    headless: opts.headless,
    ...(opts.headless ? { channel: "chromium" } : {}),
    args: [
      "--window-position=9999,9999", // push far off-screen
      "--window-size=1,1",           // minimize window size
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--disable-extensions",
    ],
  };
  if (opts.proxy) {
    launchOptions.proxy = { server: opts.proxy };
  }

  const browser: Browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    locale: "en-US",
    timezoneId: "America/New_York",
    viewport: { width: 1280, height: 900 },
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
  });

  const page: Page = await context.newPage();
  const apiResponses: string[] = [];

  page.on("response", async (res) => {
    if (res.url().includes("listugcposts")) {
      const body = await res.text().catch(() => "");
      if (body.length > 100) apiResponses.push(body);
    }
  });

  try {
    // Step 1: Open Google Maps
    console.log("  Opening Google Maps...");
    await page.goto("https://www.google.com/maps?hl=en", {
      waitUntil: "domcontentloaded",
      timeout: opts.timeout,
    });
    await humanDelay(3000);

    // Step 2: Search
    console.log(`  Searching: ${searchQuery}`);
    const searchBox = page
      .locator('input[name="q"], #searchboxinput, input[aria-label*="Search"], input[aria-label*="חיפוש"]')
      .first();
    await searchBox.waitFor({ timeout: 10000 });
    await searchBox.fill(searchQuery);
    await searchBox.press("Enter");
    await humanDelay(6000);

    // Get place name
    let placeName = searchQuery;
    try {
      const h1 = await page.locator("h1").first().textContent();
      if (h1) placeName = h1.trim();
    } catch {}

    // Step 2.5: Extract business photos before clicking Reviews
    let photoUrls: string[] = [];
    try {
      const photos = await page.evaluate(() => {
        const urls = new Set<string>();
        document.querySelectorAll('img[src*="googleusercontent.com"], img[src*="gstatic.com/mapfiles"]').forEach(img => {
          const src = (img as HTMLImageElement).src;
          const w = (img as HTMLImageElement).naturalWidth || (img as HTMLImageElement).width;
          if (src && !src.includes('/maps/') && !src.includes('streetview') && !src.includes('icon') && (w === 0 || w >= 80)) {
            const upgraded = src.replace(/=w\d+-h\d+/, '=w800-h600').replace(/=s\d+/, '=s800');
            urls.add(upgraded);
          }
        });
        return [...urls];
      });
      photoUrls = photos.slice(0, 8);
      if (photoUrls.length > 0) {
        console.log(`  Found ${photoUrls.length} business photos`);
      }
    } catch {
      // Photos extraction is best-effort
    }

    // Step 3: Click Reviews tab
    console.log("  Looking for Reviews tab...");
    const reviewsTab = page
      .locator('[role="tab"]')
      .filter({ hasText: /^Reviews$/i })
      .first();

    if (await reviewsTab.isVisible({ timeout: 8000 }).catch(() => false)) {
      console.log("  Clicking Reviews tab...");
      await reviewsTab.click();
      await humanDelay(5000);
    } else {
      errors.push("No Reviews tab found");
      console.log("  No Reviews tab — trying scroll approach...");
    }

    // Step 4: Scroll to load more reviews
    const targetCount = opts.maxReviews === 0 ? Infinity : opts.maxReviews;
    const scrollPanel = page.locator("div.m6QErb.DxyBCb").first();

    if (await scrollPanel.isVisible({ timeout: 5000 }).catch(() => false)) {
      let staleScrolls = 0;
      let lastReviewCount = 0;

      console.log(`  Scrolling (target: ${targetCount === Infinity ? "all" : targetCount})...`);

      while (staleScrolls < 5) {
        await scrollPanel.evaluate((el) => el.scrollBy(0, 3000));
        await humanDelay(opts.scrollDelay);

        // Count extracted reviews so far
        const seen = new Set<string>();
        for (const resp of apiResponses) {
          for (const rev of parseReviewResponse(resp)) {
            seen.add(rev.review_id);
          }
        }
        const currentCount = seen.size;

        if (currentCount > lastReviewCount) {
          lastReviewCount = currentCount;
          staleScrolls = 0;
          if (currentCount % 10 === 0 || currentCount >= targetCount) {
            console.log(`  ${currentCount} reviews loaded...`);
          }
          if (currentCount >= targetCount) break;
        } else {
          staleScrolls++;
        }
      }
    }

    // Step 5: Deduplicate and return
    const seen = new Set<string>();
    const allReviews: GoogleReview[] = [];
    for (const resp of apiResponses) {
      for (const rev of parseReviewResponse(resp)) {
        if (!seen.has(rev.review_id)) {
          seen.add(rev.review_id);
          allReviews.push(rev);
        }
      }
    }

    const finalReviews =
      targetCount === Infinity ? allReviews : allReviews.slice(0, targetCount);

    console.log(`  Extracted ${finalReviews.length} unique reviews for "${placeName}"`);

    return {
      place_name: placeName,
      place_url: page.url(),
      total_reviews_found: finalReviews.length,
      reviews: finalReviews,
      photo_urls: photoUrls,
      scraped_at: new Date().toISOString(),
      errors,
    };
  } finally {
    await browser.close();
  }
}
