/**
 * Generate honest FAQ sections for each retreat using Claude API.
 *
 * 8-10 questions per retreat covering the things travelers actually
 * want to know but are embarrassed to ask.
 *
 * Usage:
 *   npx tsx scripts/generate-faqs.ts [limit] [--insert] [--concurrency=N]
 *
 * Stores in Supabase table: retreat_faqs
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
  nutrition: "Nutrition & Food", fitness: "Fitness", mindfulness: "Mindfulness",
  spa: "Spa", sleep: "Sleep", medical: "Medical", personalization: "Personalization",
  amenities: "Amenities", pricing_value: "Value", activities: "Activities",
  education: "Education", travel_access: "Travel Access", sustainability: "Sustainability",
  social_proof: "Reputation", addons: "Add-Ons",
};

function buildContext(retreat: any): string {
  const scores = retreat.scores || {};
  const sorted = Object.entries(scores)
    .map(([k, v]: [string, any]) => `${CATEGORY_LABELS[k] || k}: ${v?.score?.toFixed(1) || "N/A"}`)
    .join(", ");

  return `RETREAT: ${retreat.name}
LOCATION: ${retreat.city || ""}, ${retreat.country} (${retreat.region})
SCORE: ${retreat.wrd_score}/10 | TIER: ${retreat.score_tier}
PRICE: $${retreat.price_min_per_night}-$${retreat.price_max_per_night}/night (${(retreat.pricing_model || "").replace(/_/g, " ")})
MIN STAY: ${retreat.minimum_stay_nights} nights | MAX GUESTS: ${retreat.max_guests}
GOOGLE: ${retreat.google_rating}/5 (${retreat.google_review_count} reviews)
SPECIALTIES: ${(retreat.specialty_tags || []).join(", ")}
PROGRAMS: ${(retreat.program_types || []).join(", ")}
DIETARY: ${(retreat.dietary_options || []).join(", ")}
SCORES: ${sorted}`;
}

async function generateFAQs(retreat: any): Promise<{ question: string; answer: string }[]> {
  const context = buildContext(retreat);

  const prompt = `You are Chad Waldman, analytical chemist and founder of RetreatVault.com. Generate 8 honest FAQ questions and answers for this retreat. These should be the questions travelers ACTUALLY want answered — not the marketing FAQ on the retreat's website.

${context}

Include questions like:
- Is it worth the price?
- Can I go solo / with my partner?
- What's the food actually like?
- How hard is it to get there?
- Do I need to be fit / spiritual / experienced?
- What's NOT included that I should budget for?
- What's the best room / time of year?
- Any dealbreakers I should know about?

Tailor each Q&A to THIS specific retreat's data. Reference real scores, prices, and details.

Keep answers 2-3 sentences. Direct, honest, no fluff.

Respond with ONLY valid JSON array, no markdown:
[
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."}
]`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const cleaned = text.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    return JSON.parse(cleaned);
  } catch {
    console.error(`  JSON parse failed for ${retreat.name}`);
    return [];
  }
}

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

async function main() {
  const args = process.argv.slice(2);
  const shouldInsert = args.includes("--insert");
  const limit = parseInt(args.find((a) => !a.startsWith("--")) || "100", 10);
  const concurrency = parseInt(args.find((a) => a.startsWith("--concurrency="))?.split("=")[1] || "2", 10);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Missing ANTHROPIC_API_KEY in .env.local");
    process.exit(1);
  }

  console.log(`Generating FAQs (limit: ${limit}, concurrency: ${concurrency})...`);
  console.log(`Mode: ${shouldInsert ? "Generate + Insert" : "JSON only"}\n`);

  // Fetch retreats
  const allRetreats: any[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("retreats").select("*")
      .gt("wrd_score", 0).neq("slug", "test")
      .order("wrd_score", { ascending: false })
      .range(offset, offset + 999);
    if (error || !data || data.length === 0) break;
    allRetreats.push(...data);
    offset += data.length;
    if (data.length < 1000) break;
  }
  console.log(`Fetched ${allRetreats.length} retreats`);

  // Check existing FAQs
  const { data: existing } = await supabase
    .from("retreat_faqs").select("retreat_id");
  const existingIds = new Set((existing || []).map((r: any) => r.retreat_id));
  console.log(`${existingIds.size} already have FAQs`);

  const needsFaqs = allRetreats.filter((r) => !existingIds.has(r.id)).slice(0, limit);
  console.log(`Generating for ${needsFaqs.length} retreats\n`);

  if (needsFaqs.length === 0) { console.log("All done!"); return; }

  let completed = 0;
  let failed = 0;
  const insertBatch: any[] = [];

  async function flush() {
    if (!shouldInsert || insertBatch.length === 0) return;
    const batch = insertBatch.splice(0, insertBatch.length);
    const { error } = await supabase.from("retreat_faqs").upsert(batch, { onConflict: "retreat_id" });
    if (error) console.error(`  DB error: ${error.message}`);
  }

  await runConcurrent(needsFaqs, async (retreat) => {
    const idx = ++completed;
    try {
      const faqs = await generateFAQs(retreat);
      if (faqs.length > 0) {
        insertBatch.push({
          retreat_id: retreat.id,
          faqs: JSON.stringify(faqs),
          status: "published",
        });
        console.log(`[${idx}/${needsFaqs.length}] ${retreat.name} — ${faqs.length} FAQs ✓`);
      } else {
        failed++;
        console.log(`[${idx}/${needsFaqs.length}] ${retreat.name} — no FAQs generated`);
      }

      if (insertBatch.length >= 25) await flush();
    } catch (e: any) {
      failed++;
      console.log(`[${idx}/${needsFaqs.length}] ${retreat.name} — FAILED: ${e.message}`);
    }
  }, concurrency);

  await flush();

  console.log(`\n--- Summary ---`);
  console.log(`Generated: ${completed - failed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total in DB: ${existingIds.size + completed - failed}`);
}

main().catch(console.error);
