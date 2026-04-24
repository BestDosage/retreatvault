/**
 * Generate editorial reviews for retreats using Claude API.
 *
 * Each review is uniquely written from the retreat's scoring data,
 * analyst notes, location context, and competitive positioning.
 *
 * Usage:
 *   npx tsx scripts/generate-editorial-reviews.ts [limit] [--insert]
 *
 *   limit     Number of retreats to process (default: 10)
 *   --insert  Insert directly into Supabase as 'draft' (default: JSON only)
 *
 * Requires in .env.local:
 *   ANTHROPIC_API_KEY=sk-ant-...
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=... (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
 *
 * Outputs: data/editorial-reviews.json
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORY_LABELS: Record<string, string> = {
  nutrition: "Nutrition & Food Quality",
  fitness: "Fitness & Movement",
  mindfulness: "Mindfulness & Meditation",
  spa: "Spa & Relaxation",
  sleep: "Sleep & Recovery",
  medical: "Medical & Clinical",
  personalization: "Personalization",
  amenities: "Amenities & Facilities",
  pricing_value: "Pricing & Value",
  activities: "Activities & Excursions",
  education: "Education & Workshops",
  travel_access: "Ease of Travel",
  sustainability: "Sustainability & Ethics",
  social_proof: "Social Proof & Reputation",
  addons: "Add-Ons & Options",
};

interface EditorialReview {
  retreat_id: string;
  slug: string;
  name: string;
  review_html: string;
  verdict: string;
  best_for: string[];
  not_ideal_for: string[];
  alternatives: { name: string; slug: string; reason: string }[];
}

function buildRetreatContext(retreat: any, competitors: any[]): string {
  const scores = retreat.scores || {};
  const sortedScores = Object.entries(scores)
    .map(([key, val]: [string, any]) => ({
      category: CATEGORY_LABELS[key] || key,
      score: val?.score || 0,
      notes: val?.notes || "",
      subScores: val?.sub_scores || {},
    }))
    .sort((a, b) => b.score - a.score);

  const priceRange = `$${retreat.price_min_per_night}–$${retreat.price_max_per_night}/night`;
  const pricingModel = (retreat.pricing_model || "").replace(/_/g, " ");

  let context = `
RETREAT: ${retreat.name}
LOCATION: ${retreat.city || ""}, ${retreat.country} (${retreat.region})
VAULT SCORE: ${retreat.wrd_score}/10 (Tier: ${retreat.score_tier})
PRICE: ${priceRange} (${pricingModel})
MIN STAY: ${retreat.minimum_stay_nights} night(s)
PROPERTY: ${retreat.property_size} — ${retreat.room_count} rooms, max ${retreat.max_guests} guests
FOUNDED: ${retreat.founded_year || "Unknown"}
GOOGLE: ${retreat.google_rating}/5 (${retreat.google_review_count} reviews)`;

  if (retreat.tripadvisor_rating) {
    context += `\nTRIPADVISOR: ${retreat.tripadvisor_rating}/5 (${retreat.tripadvisor_review_count} reviews)`;
  }

  context += `\nSPECIALTIES: ${(retreat.specialty_tags || []).join(", ") || "None listed"}`;
  context += `\nDIETARY: ${(retreat.dietary_options || []).join(", ") || "None listed"}`;
  context += `\nPROGRAMS: ${(retreat.program_types || []).join(", ") || "None listed"}`;

  context += `\n\nSCORE BREAKDOWN (sorted best to worst):`;
  for (const s of sortedScores) {
    context += `\n  ${s.category}: ${s.score.toFixed(1)}/10`;
    if (s.notes) context += ` — "${s.notes}"`;
  }

  if (competitors.length > 0) {
    context += `\n\nNEARBY COMPETITORS IN ${retreat.region} (for context):`;
    for (const c of competitors.slice(0, 5)) {
      context += `\n  - ${c.name} (${c.city}, ${c.country}): ${parseFloat(c.wrd_score).toFixed(1)}/10, $${c.price_min_per_night}–$${c.price_max_per_night}/night`;
    }
  }

  return context;
}

function findAlternatives(
  retreat: any,
  allRetreats: any[]
): { name: string; slug: string; reason: string }[] {
  const alternatives: { name: string; slug: string; reason: string }[] = [];
  const sameRegion = allRetreats
    .filter(
      (r: any) =>
        r.region === retreat.region &&
        r.slug !== retreat.slug &&
        (parseFloat(r.wrd_score) || 0) >= 7
    )
    .sort(
      (a: any, b: any) =>
        (parseFloat(b.wrd_score) || 0) - (parseFloat(a.wrd_score) || 0)
    );

  // Better value at similar price
  const betterValue = sameRegion.find(
    (r: any) =>
      r.price_max_per_night <= retreat.price_max_per_night * 1.1 &&
      (parseFloat(r.wrd_score) || 0) > (parseFloat(retreat.wrd_score) || 0)
  );
  if (betterValue) {
    alternatives.push({
      name: betterValue.name,
      slug: betterValue.slug,
      reason: `Higher Vault score (${parseFloat(betterValue.wrd_score).toFixed(1)}) at a similar price point`,
    });
  }

  // Cheaper comparable option
  const cheaper = sameRegion.find(
    (r: any) =>
      r.price_max_per_night < retreat.price_max_per_night * 0.7 &&
      (parseFloat(r.wrd_score) || 0) >=
        (parseFloat(retreat.wrd_score) || 0) - 0.5
  );
  if (cheaper) {
    alternatives.push({
      name: cheaper.name,
      slug: cheaper.slug,
      reason: `Comparable quality at ${Math.round((1 - cheaper.price_max_per_night / retreat.price_max_per_night) * 100)}% less per night`,
    });
  }

  // Stronger in weakest area
  const scores = retreat.scores || {};
  const weakest = Object.entries(scores)
    .map(([key, val]: [string, any]) => ({ key, score: val?.score || 0 }))
    .sort((a, b) => a.score - b.score)
    .find((s) => s.score < 7);

  if (weakest) {
    const strongInWeak = sameRegion.find(
      (r: any) =>
        r.scores?.[weakest.key]?.score >= 8.5 &&
        (parseFloat(r.wrd_score) || 0) >= 7
    );
    if (strongInWeak) {
      alternatives.push({
        name: strongInWeak.name,
        slug: strongInWeak.slug,
        reason: `Excels in ${CATEGORY_LABELS[weakest.key]?.toLowerCase() || weakest.key} where ${retreat.name} falls short`,
      });
    }
  }

  return alternatives.slice(0, 3);
}

async function generateReviewWithClaude(
  retreat: any,
  allRetreats: any[]
): Promise<EditorialReview> {
  const competitors = allRetreats
    .filter(
      (r: any) => r.region === retreat.region && r.slug !== retreat.slug
    )
    .sort(
      (a: any, b: any) =>
        Math.abs((parseFloat(a.wrd_score) || 0) - (parseFloat(retreat.wrd_score) || 0)) -
        Math.abs((parseFloat(b.wrd_score) || 0) - (parseFloat(retreat.wrd_score) || 0))
    );

  const retreatContext = buildRetreatContext(retreat, competitors);
  const alternatives = findAlternatives(retreat, allRetreats);

  const prompt = `You are Chad Waldman — analytical chemist turned wellness operator, founder of RetreatVault.com. You've personally evaluated thousands of wellness retreats using a data-driven scoring system. You write like a chemist who lives the lifestyle: precise, honest, dry humor, zero fluff. You don't hype. You don't hand-wave. You tell people exactly what they're getting.

Your voice rules:
- First person is fine but not required. Mix it up.
- Short sentences land the punches. Use them after longer setups.
- Dry, self-aware humor when it fits. Not forced.
- Real numbers, real comparisons, real trade-offs. No vague praise.
- You'd rather lose a reader than mislead one.
- When something is great, say it plainly. When something falls short, say that too.
- You sound like a smart friend who's been everywhere and will tell you the truth over a beer.

NEVER use these words/phrases: "nestled", "boasts", "curated", "holistic journey", "unlock your potential", "world-class" (unless score is genuinely elite 9+), "hidden gem", "oasis", "haven", "rejuvenate your spirit", "embark on a journey", or any phrase that belongs on a coffee mug. No em dash abuse. No passive voice.

Write an editorial review for this retreat:

${retreatContext}

STRUCTURE:
- 250-350 words across 3-4 paragraphs
- Vary the opening. Sometimes lead with what makes the place interesting. Sometimes lead with who should go. Sometimes lead with the location or a comparison. Don't start every review the same way.
- Include at least one reason to book AND one reason to look elsewhere
- Reference specific scores, pricing, and competitor context
- No made-up facts, amenities, or health outcome claims

OUTPUT FORMAT — respond with ONLY valid JSON, no markdown:
{
  "review_html": "<p>First paragraph...</p>\\n<p>Second paragraph...</p>\\n<p>Third paragraph...</p>",
  "verdict": "One or two sentence bottom-line. Opinionated. The kind of thing you'd text a friend asking for advice.",
  "best_for": ["Specific guest type 1", "Specific guest type 2", "Specific guest type 3"],
  "not_ideal_for": ["Specific guest type 1", "Specific guest type 2"]
}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  let parsed: any;
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error(`  Failed to parse JSON for ${retreat.name}:`, text.slice(0, 200));
    // Fallback to template
    parsed = {
      review_html: `<p>${retreat.name} in ${retreat.city}, ${retreat.country} scores ${retreat.wrd_score}/10 in our evaluation. Review generation failed — please write manually.</p>`,
      verdict: "Review pending manual write.",
      best_for: ["General wellness seekers"],
      not_ideal_for: ["N/A — review pending"],
    };
  }

  return {
    retreat_id: retreat.id,
    slug: retreat.slug,
    name: retreat.name,
    review_html: parsed.review_html,
    verdict: parsed.verdict,
    best_for: parsed.best_for || [],
    not_ideal_for: parsed.not_ideal_for || [],
    alternatives,
  };
}

async function runConcurrent<T>(
  items: T[],
  fn: (item: T) => Promise<any>,
  concurrency: number
): Promise<void> {
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

async function main() {
  const args = process.argv.slice(2);
  const shouldInsert = args.includes("--insert");
  const limit = parseInt(args.find((a) => !a.startsWith("--")) || "10", 10);
  const concurrency = parseInt(args.find((a) => a.startsWith("--concurrency="))?.split("=")[1] || "5", 10);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Missing ANTHROPIC_API_KEY in .env.local");
    process.exit(1);
  }

  console.log(`Generating editorial reviews (limit: ${limit}, concurrency: ${concurrency})...`);
  console.log(`Mode: ${shouldInsert ? "Generate + Insert as published" : "Generate JSON only"}\n`);

  // Fetch all retreats for context
  console.log("Fetching retreats...");
  const allRetreats: any[] = [];
  let offset = 0;
  const batchSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("retreats")
      .select("*")
      .gt("wrd_score", 0)
      .neq("slug", "test")
      .order("wrd_score", { ascending: false })
      .range(offset, offset + batchSize - 1);
    if (error) { console.error("Fetch error:", error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    allRetreats.push(...data);
    offset += data.length;
    if (data.length < batchSize) break;
  }
  console.log(`Fetched ${allRetreats.length} total retreats`);

  // Find which retreats already have reviews
  const { data: existing } = await supabase
    .from("retreat_editorial_reviews")
    .select("retreat_id");
  const existingIds = new Set((existing || []).map((r: any) => r.retreat_id));
  console.log(`${existingIds.size} retreats already have reviews`);

  // Filter to retreats needing reviews, apply limit
  const needsReview = allRetreats.filter((r) => !existingIds.has(r.id)).slice(0, limit);
  console.log(`Generating ${needsReview.length} new reviews\n`);

  if (needsReview.length === 0) {
    console.log("All retreats already have reviews!");
    return;
  }

  // Generate and insert in batches
  let completed = 0;
  let failed = 0;
  const insertBatch: EditorialReview[] = [];
  const BATCH_INSERT_SIZE = 25;

  async function insertRows(rows: EditorialReview[]) {
    if (rows.length === 0) return;
    const dbRows = rows.map((r) => ({
      retreat_id: r.retreat_id,
      review_html: r.review_html,
      verdict: r.verdict,
      best_for: r.best_for,
      not_ideal_for: r.not_ideal_for,
      alternatives: r.alternatives,
      status: "published",
    }));
    const { error } = await supabase
      .from("retreat_editorial_reviews")
      .upsert(dbRows, { onConflict: "retreat_id" });
    if (error) console.error(`  DB insert error: ${error.message}`);
  }

  await runConcurrent(needsReview, async (retreat) => {
    const idx = ++completed;
    const pct = Math.round((idx / needsReview.length) * 100);
    try {
      const review = await generateReviewWithClaude(retreat, allRetreats);
      insertBatch.push(review);
      console.log(`[${idx}/${needsReview.length}] ${pct}% — ${retreat.name} ✓`);

      // Flush batch to Supabase every BATCH_INSERT_SIZE
      if (shouldInsert && insertBatch.length >= BATCH_INSERT_SIZE) {
        const batch = insertBatch.splice(0, BATCH_INSERT_SIZE);
        await insertRows(batch);
      }
    } catch (e: any) {
      failed++;
      console.log(`[${idx}/${needsReview.length}] ${pct}% — ${retreat.name} FAILED: ${e.message}`);
    }
  }, concurrency);

  // Flush remaining
  if (shouldInsert && insertBatch.length > 0) {
    await insertRows(insertBatch);
  }

  // Summary
  console.log("\n--- Summary ---");
  console.log(`Generated: ${completed - failed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Already existed: ${existingIds.size}`);
  console.log(`Total in database: ${existingIds.size + completed - failed}`);
}

main().catch(console.error);
