/**
 * Synthesize Google Reviews into Guest Intelligence using Claude.
 *
 * Reads scraped reviews from JSON, sends batches to Claude for analysis,
 * outputs structured intelligence per retreat.
 *
 * Usage:
 *   npx tsx scripts/synthesize-reviews.ts                           # all retreats
 *   npx tsx scripts/synthesize-reviews.ts --limit 5                 # first 5
 *   npx tsx scripts/synthesize-reviews.ts --input data/reviews.json # custom input
 *   npx tsx scripts/synthesize-reviews.ts --dry-run                 # preview only
 *
 * Requires in .env.local:
 *   ANTHROPIC_API_KEY=sk-ant-...
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYNTHESIS_PROMPT = `You are analyzing guest reviews for a wellness retreat. Given the reviews below, produce a JSON analysis. Be honest — if the food is mediocre, say so. If the spa is world-class, say so. Extract REAL quotes from reviews, do not fabricate.

If there aren't enough reviews to assess a category, use null instead of guessing.

Output valid JSON only, no markdown:

{
  "summary": "2-3 sentence overview of what guests consistently say",
  "strengths": ["specific thing guests praise", "another"],
  "weaknesses": ["specific complaint pattern"],
  "food_verdict": "1-2 sentences on food quality, or null",
  "spa_verdict": "1-2 sentences on spa/treatment quality, or null",
  "rooms_verdict": "1-2 sentences on accommodation quality, or null",
  "staff_verdict": "1-2 sentences on staff/service quality, or null",
  "value_verdict": "1-2 sentences on whether guests feel it's worth the price, or null",
  "best_quotes": [
    {"text": "exact quote from a review", "rating": 5, "topic": "food"},
    {"text": "exact negative quote", "rating": 2, "topic": "value"}
  ],
  "red_flags": ["honest warning a friend would give"],
  "ideal_for": ["type of person this retreat suits"],
  "not_ideal_for": ["type of person who'd be disappointed"],
  "surprise_factor": "one thing guests didn't expect (good or bad)"
}`;

interface ReviewData {
  retreat_id: string;
  place_name: string;
  total_reviews_found: number;
  reviews: {
    author_name: string;
    rating: number;
    review_text: string;
    review_date: string;
  }[];
}

async function synthesize(retreat: ReviewData): Promise<any | null> {
  const reviews = retreat.reviews.filter(r => r.review_text.length > 20);

  if (reviews.length < 3) {
    console.log(`  Skipping ${retreat.place_name} — only ${reviews.length} reviews with text`);
    return null;
  }

  const reviewText = reviews
    .slice(0, 80) // cap at 80 reviews to stay within context
    .map((r, i) => `Review ${i + 1} (${r.rating > 0 ? r.rating + '/5' : 'no rating'}${r.review_date ? ', ' + r.review_date : ''}): ${r.review_text}`)
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `${SYNTHESIS_PROMPT}\n\nRetreat: ${retreat.place_name}\nTotal reviews available: ${retreat.total_reviews_found}\n\n${reviewText}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.log(`  Warning: Could not parse JSON from Claude response for ${retreat.place_name}`);
    return null;
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.log(`  Warning: Invalid JSON for ${retreat.place_name}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  let inputFile = "data/all-reviews-120.json";
  let limit = Infinity;
  let dryRun = false;
  let outputFile = "data/guest-intelligence.json";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input") inputFile = args[++i];
    if (args[i] === "--limit") limit = parseInt(args[++i]);
    if (args[i] === "--output") outputFile = args[++i];
    if (args[i] === "--dry-run") dryRun = true;
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`);
    process.exit(1);
  }

  const allReviews: ReviewData[] = JSON.parse(
    fs.readFileSync(inputFile, "utf-8")
  );
  const toProcess = allReviews
    .filter((r) => r.total_reviews_found >= 3)
    .slice(0, limit);

  console.log(
    `Processing ${toProcess.length} retreats (${allReviews.length} total, ${allReviews.length - toProcess.length} skipped < 3 reviews)`
  );

  if (dryRun) {
    toProcess.forEach((r) =>
      console.log(`  ${r.place_name}: ${r.total_reviews_found} reviews`)
    );
    return;
  }

  // Load existing results to resume
  let results: Record<string, any> = {};
  if (fs.existsSync(outputFile)) {
    results = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
    console.log(`Resuming — ${Object.keys(results).length} already processed`);
  }

  let processed = 0;
  for (const retreat of toProcess) {
    if (results[retreat.retreat_id]) {
      console.log(`  Skipping ${retreat.place_name} — already synthesized`);
      continue;
    }

    console.log(
      `[${++processed}/${toProcess.length}] ${retreat.place_name} (${retreat.total_reviews_found} reviews)...`
    );

    const intel = await synthesize(retreat);
    if (intel) {
      results[retreat.retreat_id] = {
        name: retreat.place_name,
        review_count: retreat.total_reviews_found,
        ...intel,
      };

      // Save incrementally
      fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    }

    // Rate limit: 2 seconds between calls
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(
    `\nDone. ${Object.keys(results).length} retreats synthesized → ${outputFile}`
  );
}

main().catch(console.error);
