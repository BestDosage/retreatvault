/**
 * Generate honest FAQ sections for each retreat using Claude API.
 *
 * 8-10 questions per retreat covering the things travelers actually
 * want to know but are embarrassed to ask.
 *
 * Usage:
 *   npx tsx scripts/generate-faqs.ts [limit] [--insert] [--concurrency=N] [--batch-size=N]
 *
 *   limit          Number of retreats to process (default: 100)
 *   --insert       Upsert directly into Supabase as 'published' (default: JSON only)
 *   --concurrency  Parallel API calls (default: 3)
 *   --batch-size   DB upsert batch size (default: 25)
 *
 * Requires in .env.local:
 *   ANTHROPIC_API_KEY=sk-ant-...
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=... (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
 *
 * Stores in Supabase table: retreat_faqs
 * Also writes: data/generated-faqs.json (dry-run backup)
 *
 * Cost estimate (Claude Haiku 4.5):
 *   ~800 input tokens + ~600 output tokens per retreat
 *   1,000 retreats ~ $0.70 total
 *   9,400 retreats ~ $6.60 total
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

// ─── Rate limiter ────────────────────────────────────────────────────
class RateLimiter {
  private timestamps: number[] = [];
  constructor(private maxPerMinute: number) {}

  async wait(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < 60_000);
    if (this.timestamps.length >= this.maxPerMinute) {
      const oldest = this.timestamps[0];
      const waitMs = 60_000 - (now - oldest) + 100;
      console.log(`  Rate limit: waiting ${(waitMs / 1000).toFixed(1)}s...`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    this.timestamps.push(Date.now());
  }
}

const rateLimiter = new RateLimiter(50); // Haiku tier-1: ~50 RPM

// ─── Context builder ─────────────────────────────────────────────────
function buildContext(retreat: any): string {
  const scores = retreat.scores || {};
  const sortedScores = Object.entries(scores)
    .map(([key, val]: [string, any]) => ({
      category: CATEGORY_LABELS[key] || key,
      score: val?.score || 0,
      notes: val?.notes || "",
    }))
    .sort((a, b) => b.score - a.score);

  const scoreBreakdown = sortedScores
    .map((s) => `  ${s.category}: ${s.score.toFixed(1)}/10${s.notes ? ` - "${s.notes}"` : ""}`)
    .join("\n");

  const priceRange = `$${retreat.price_min_per_night}-$${retreat.price_max_per_night}/night`;
  const pricingModel = (retreat.pricing_model || "").replace(/_/g, " ");

  let context = `RETREAT: ${retreat.name}
LOCATION: ${retreat.city || ""}, ${retreat.country} (${retreat.region})
VAULT SCORE: ${retreat.wrd_score}/10 (Tier: ${retreat.score_tier})
PRICE: ${priceRange} (${pricingModel})
MIN STAY: ${retreat.minimum_stay_nights} night(s)
PROPERTY: ${retreat.property_size} - ${retreat.room_count} rooms, max ${retreat.max_guests} guests
FOUNDED: ${retreat.founded_year || "Unknown"}
GOOGLE: ${retreat.google_rating}/5 (${retreat.google_review_count} reviews)`;

  if (retreat.tripadvisor_rating) {
    context += `\nTRIPADVISOR: ${retreat.tripadvisor_rating}/5 (${retreat.tripadvisor_review_count} reviews)`;
  }

  context += `\nSPECIALTIES: ${(retreat.specialty_tags || []).join(", ") || "None listed"}`;
  context += `\nPROGRAMS: ${(retreat.program_types || []).join(", ") || "None listed"}`;
  context += `\nDIETARY: ${(retreat.dietary_options || []).join(", ") || "None listed"}`;
  context += `\n\nSCORE BREAKDOWN (best to worst):\n${scoreBreakdown}`;

  return context;
}

// ─── FAQ generation ──────────────────────────────────────────────────
async function generateFAQs(retreat: any, retryCount = 0): Promise<{ question: string; answer: string }[]> {
  await rateLimiter.wait();

  const context = buildContext(retreat);

  const prompt = `You are Chad Waldman, analytical chemist and founder of RetreatVault.com. Generate 8-10 honest FAQ questions and answers for this retreat. These should be the questions travelers ACTUALLY want answered - not the marketing FAQ on the retreat's website.

${context}

COVER THESE TOPICS (adapt each to this specific retreat's data):
1. What makes this retreat unique / worth choosing over competitors?
2. How much does it really cost (including what's NOT included)?
3. What should I expect during a typical day?
4. Who is this retreat best for (and who should skip it)?
5. How do I get there / what's the travel situation?
6. What should I pack or prepare for?
7. What's the cancellation/booking flexibility situation?
8. Can they handle dietary restrictions or food allergies?
9. What's nearby / what else can I do in the area?
10. What's the best time of year to visit?

RULES:
- Tailor EVERY Q&A to THIS specific retreat's actual data. Reference real scores, prices, details.
- Keep answers 2-3 sentences. Direct, honest, no fluff.
- Vary the question phrasing - don't start every question with "What" or "How".
- Skip any topic where the data doesn't support a meaningful answer.
- Never fabricate amenities, policies, or facts not supported by the data.

Respond with ONLY valid JSON array, no markdown:
[
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."}
]`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    const cleaned = text.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed) || parsed.length < 4) {
      throw new Error(`Only ${parsed?.length || 0} FAQs generated, expected 8-10`);
    }

    // Validate structure
    const valid = parsed.filter(
      (f: any) =>
        typeof f.question === "string" &&
        typeof f.answer === "string" &&
        f.question.length > 10 &&
        f.answer.length > 20
    );

    if (valid.length < 4) {
      throw new Error(`Only ${valid.length} valid FAQs after filtering`);
    }

    return valid;
  } catch (e: any) {
    if (retryCount < 2) {
      const backoff = (retryCount + 1) * 2000;
      console.log(`  Retry ${retryCount + 1}/2 for ${retreat.name} in ${backoff / 1000}s (${e.message})`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return generateFAQs(retreat, retryCount + 1);
    }
    throw e;
  }
}

// ─── Concurrency runner ──────────────────────────────────────────────
async function runConcurrent<T>(items: T[], fn: (item: T) => Promise<void>, concurrency: number) {
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const shouldInsert = args.includes("--insert");
  const limit = parseInt(args.find((a) => /^\d+$/.test(a)) || "100", 10);
  const concurrency = parseInt(args.find((a) => a.startsWith("--concurrency="))?.split("=")[1] || "3", 10);
  const batchSize = parseInt(args.find((a) => a.startsWith("--batch-size="))?.split("=")[1] || "25", 10);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Missing ANTHROPIC_API_KEY in .env.local");
    process.exit(1);
  }

  console.log(`\n=== RetreatVault FAQ Generator ===`);
  console.log(`Limit: ${limit} | Concurrency: ${concurrency} | Batch size: ${batchSize}`);
  console.log(`Mode: ${shouldInsert ? "Generate + Insert (published)" : "Dry run (JSON only)"}\n`);

  // Fetch all retreats (paginated)
  console.log("Fetching retreats...");
  const allRetreats: any[] = [];
  let offset = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("retreats")
      .select("*")
      .gt("wrd_score", 0)
      .neq("slug", "test")
      .order("wrd_score", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      console.error("Fetch error:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    allRetreats.push(...data);
    offset += data.length;
    if (data.length < PAGE_SIZE) break;
  }
  console.log(`Fetched ${allRetreats.length} total retreats`);

  // Check existing FAQs
  const existingIds = new Set<string>();
  let faqOffset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("retreat_faqs")
      .select("retreat_id")
      .range(faqOffset, faqOffset + PAGE_SIZE - 1);
    if (error || !data || data.length === 0) break;
    data.forEach((r: any) => existingIds.add(r.retreat_id));
    faqOffset += data.length;
    if (data.length < PAGE_SIZE) break;
  }
  console.log(`${existingIds.size} retreats already have FAQs`);

  // Filter to retreats needing FAQs, prioritized by wrd_score (already sorted)
  const needsFaqs = allRetreats.filter((r) => !existingIds.has(r.id)).slice(0, limit);
  console.log(`Generating FAQs for ${needsFaqs.length} retreats (highest-scored first)\n`);

  if (needsFaqs.length === 0) {
    console.log("All retreats already have FAQs!");
    return;
  }

  // Estimate cost
  const estInputTokens = needsFaqs.length * 800;
  const estOutputTokens = needsFaqs.length * 600;
  const estCost = (estInputTokens * 0.80 + estOutputTokens * 4.0) / 1_000_000;
  console.log(`Estimated cost: $${estCost.toFixed(2)} (${needsFaqs.length} calls to Haiku 4.5)\n`);

  let completed = 0;
  let failed = 0;
  const startTime = Date.now();
  const insertBatch: any[] = [];
  const allGenerated: any[] = [];

  async function flush() {
    if (!shouldInsert || insertBatch.length === 0) return;
    const batch = insertBatch.splice(0, insertBatch.length);
    const { error } = await supabase
      .from("retreat_faqs")
      .upsert(batch, { onConflict: "retreat_id" });
    if (error) console.error(`  DB upsert error: ${error.message}`);
    else console.log(`  Flushed ${batch.length} rows to Supabase`);
  }

  await runConcurrent(needsFaqs, async (retreat) => {
    const idx = ++completed;
    const pct = Math.round((idx / needsFaqs.length) * 100);
    try {
      const faqs = await generateFAQs(retreat);
      const row = {
        retreat_id: retreat.id,
        faqs: JSON.stringify(faqs),
        status: "published",
      };
      insertBatch.push(row);
      allGenerated.push({ ...row, slug: retreat.slug, name: retreat.name, faq_count: faqs.length });
      console.log(`[${idx}/${needsFaqs.length}] ${pct}% - ${retreat.name} - ${faqs.length} FAQs`);

      if (insertBatch.length >= batchSize) await flush();
    } catch (e: any) {
      failed++;
      console.log(`[${idx}/${needsFaqs.length}] ${pct}% - ${retreat.name} - FAILED: ${e.message}`);
    }
  }, concurrency);

  // Flush remaining
  await flush();

  // Write JSON backup
  const outDir = "/Users/waldman/Projects/retreatvault/data";
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = `${outDir}/generated-faqs.json`;
  fs.writeFileSync(outPath, JSON.stringify(allGenerated, null, 2));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n=== Summary ===`);
  console.log(`Generated: ${completed - failed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Previously existed: ${existingIds.size}`);
  console.log(`New total in DB: ${existingIds.size + completed - failed}`);
  console.log(`Coverage: ${existingIds.size + completed - failed}/${allRetreats.length} (${Math.round(((existingIds.size + completed - failed) / allRetreats.length) * 100)}%)`);
  console.log(`Time: ${elapsed}s`);
  console.log(`JSON backup: ${outPath}`);
}

main().catch(console.error);
