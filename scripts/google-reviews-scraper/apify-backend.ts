// scripts/google-reviews-scraper/apify-backend.ts
//
// Alternative extraction backend using Apify's Google Maps Reviews actor.
// Works regardless of your IP location. Costs ~$0.25-0.40 per 1,000 reviews.
// Free tier includes $5/month of compute.
//
// Setup: add APIFY_API_KEY to .env.local
//   1. Sign up at https://apify.com (free)
//   2. Settings → Integrations → API token
//   3. Add: APIFY_API_KEY=apify_api_...

import { ApifyClient } from "apify-client";
import type { GoogleReview, ScrapeResult, ScrapeOptions } from "./types";

const ACTOR_ID = "compass/crawler-google-places-reviews";

export async function scrapeViaApify(
  placeUrl: string,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> {
  const apiKey = process.env.APIFY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "APIFY_API_KEY not set. Add it to .env.local. Get one free at https://apify.com"
    );
  }

  const client = new ApifyClient({ token: apiKey });
  const maxReviews = options.maxReviews ?? 100;

  console.log(`  Apify: extracting up to ${maxReviews} reviews...`);

  const run = await client.actor(ACTOR_ID).call({
    startUrls: [{ url: placeUrl }],
    maxReviews,
    reviewsSort: "newest",
    language: "en",
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  const reviews: GoogleReview[] = items.map((item: any, i: number) => ({
    author_name: item.name || item.author || "Anonymous",
    rating: item.stars || item.rating || 0,
    review_text: item.text || item.reviewBody || "",
    review_date: item.publishedAtDate || item.date || "",
    owner_response: item.responseFromOwnerText || null,
    review_id: item.reviewId || `apify-${i}`,
  })).filter((r: GoogleReview) => r.review_text || r.rating > 0);

  const placeName = items[0]?.title || items[0]?.placeName || "Unknown";

  console.log(`  Apify: got ${reviews.length} reviews for "${placeName}"`);

  return {
    place_name: placeName,
    place_url: placeUrl,
    total_reviews_found: reviews.length,
    reviews,
    scraped_at: new Date().toISOString(),
    errors: [],
  };
}
