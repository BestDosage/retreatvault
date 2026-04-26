/**
 * Enrich retreat listings with Google Places data (ratings, review counts, place IDs).
 *
 * Queries the Google Places API (New) Text Search endpoint for each retreat
 * missing google_rating or google_review_count, then updates Supabase directly.
 *
 * NOTE: No GOOGLE_PLACES_API_KEY found in .env.local as of 2026-04-26.
 *       Add one before running: GOOGLE_PLACES_API_KEY=AIza...
 *
 * Usage:
 *   npx tsx scripts/enrich-google-ratings.ts              # all unenriched
 *   npx tsx scripts/enrich-google-ratings.ts --limit 10   # first 10 only
 *   npx tsx scripts/enrich-google-ratings.ts --dry-run    # preview without updating
 *
 * Requires in .env.local:
 *   GOOGLE_PLACES_API_KEY=...
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=... (or SUPABASE_SERVICE_ROLE_KEY)
 *
 * Cost: ~$0.017 per retreat (Text Search Pro SKU).
 * Rate limit: 100ms delay between requests (~10 req/sec, well within quota).
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// ─── Config ───────────────────────────────────────────────────────────────────

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const BATCH_SIZE = 50;
const DELAY_MS = 100; // 10 req/sec — well within Google's limits

// Only request the fields we need (keeps cost at Basic/Pro tier)
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.rating",
  "places.userRatingCount",
  "places.formattedAddress",
  "places.googleMapsUri",
].join(",");

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs(): { limit: number; dryRun: boolean } {
  const args = process.argv.slice(2);
  let limit = 0; // 0 = no limit
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === "--dry-run") {
      dryRun = true;
    }
  }

  return { limit, dryRun };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RetreatRow {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  country: string;
  google_rating: number | null;
  google_review_count: number | null;
}

interface GooglePlace {
  id: string;
  displayName?: { text: string; languageCode?: string };
  rating?: number;
  userRatingCount?: number;
  formattedAddress?: string;
  googleMapsUri?: string;
}

interface EnrichResult {
  google_rating: number | null;
  google_review_count: number;
  google_place_id: string | null;
}

// ─── Google Places lookup ─────────────────────────────────────────────────────

async function searchPlace(
  name: string,
  city: string | null,
  country: string
): Promise<GooglePlace | null> {
  const queryParts = [name];
  if (city) queryParts.push(city);
  if (country && !(city || "").toLowerCase().includes(country.toLowerCase())) {
    queryParts.push(country);
  }

  const textQuery = queryParts.join(" ");

  const resp = await fetch(SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({ textQuery, maxResultCount: 1 }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Google API ${resp.status}: ${body.slice(0, 200)}`);
  }

  const data = await resp.json();
  const places: GooglePlace[] = data.places || [];
  return places[0] || null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function timestamp(): string {
  return new Date().toISOString().slice(11, 19);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { limit, dryRun } = parseArgs();

  // Validate env
  if (!GOOGLE_API_KEY) {
    console.error("ERROR: GOOGLE_PLACES_API_KEY not set in .env.local");
    process.exit(1);
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE key in .env.local");
    process.exit(1);
  }

  const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

  // ─── Fetch retreats missing Google data ───────────────────────────────────
  console.log(`[${timestamp()}] Fetching retreats missing Google ratings...`);

  let query = supabase
    .from("retreats")
    .select("id, slug, name, city, country, google_rating, google_review_count")
    .or("google_rating.is.null,google_review_count.is.null,google_review_count.eq.0")
    .order("wrd_score", { ascending: false });

  if (limit > 0) {
    query = query.limit(limit);
  }

  const { data: retreats, error: fetchError } = await query;

  if (fetchError) {
    console.error("Supabase fetch error:", fetchError.message);
    process.exit(1);
  }

  if (!retreats || retreats.length === 0) {
    console.log("No retreats need enrichment. All done!");
    process.exit(0);
  }

  console.log(`[${timestamp()}] Found ${retreats.length} retreats to enrich`);
  if (dryRun) console.log("  (DRY RUN — no updates will be written)");

  // ─── Process in batches ───────────────────────────────────────────────────
  let enriched = 0;
  let skipped = 0;
  let errors = 0;
  let noMatch = 0;

  const batches = Math.ceil(retreats.length / BATCH_SIZE);

  for (let b = 0; b < batches; b++) {
    const batchStart = b * BATCH_SIZE;
    const batch = retreats.slice(batchStart, batchStart + BATCH_SIZE);
    console.log(
      `\n[${timestamp()}] Batch ${b + 1}/${batches} (${batch.length} retreats)`
    );

    for (let i = 0; i < batch.length; i++) {
      const retreat = batch[i] as RetreatRow;
      const idx = batchStart + i + 1;
      const label = retreat.name.slice(0, 50);

      // Skip if already has valid data (defensive — query should exclude these)
      if (retreat.google_rating && retreat.google_review_count && retreat.google_review_count > 0) {
        console.log(`  [${idx}/${retreats.length}] SKIP ${label} — already enriched`);
        skipped++;
        continue;
      }

      try {
        const place = await searchPlace(retreat.name, retreat.city, retreat.country);

        if (!place) {
          console.log(`  [${idx}/${retreats.length}] -- ${label} — no match found`);
          noMatch++;
          await sleep(DELAY_MS);
          continue;
        }

        const result: EnrichResult = {
          google_rating: place.rating ?? null,
          google_review_count: place.userRatingCount ?? 0,
          google_place_id: place.id ?? null,
        };

        if (dryRun) {
          console.log(
            `  [${idx}/${retreats.length}] OK ${label} — ${result.google_rating}/5 (${result.google_review_count} reviews) [dry-run]`
          );
        } else {
          // Update Supabase
          const { error: updateError } = await supabase
            .from("retreats")
            .update({
              google_rating: result.google_rating,
              google_review_count: result.google_review_count,
              // google_place_id: result.google_place_id,  // Uncomment after adding column via migration
              updated_at: new Date().toISOString(),
            })
            .eq("id", retreat.id);

          if (updateError) {
            console.error(
              `  [${idx}/${retreats.length}] ERR ${label} — Supabase update failed: ${updateError.message}`
            );
            errors++;
            continue;
          }

          const ratingStr = result.google_rating ? `${result.google_rating}/5` : "no rating";
          console.log(
            `  [${idx}/${retreats.length}] OK ${label} — ${ratingStr} (${result.google_review_count} reviews) [place: ${result.google_place_id}]`
          );
        }

        enriched++;
      } catch (err: any) {
        console.error(
          `  [${idx}/${retreats.length}] ERR ${label} — ${err.message || err}`
        );
        errors++;

        // If we hit a quota/auth error, stop early
        if (err.message?.includes("403") || err.message?.includes("429")) {
          console.error("\nStopping: API quota or auth error. Check your API key and billing.");
          break;
        }
      }

      await sleep(DELAY_MS);
    }

    // Batch summary
    console.log(
      `[${timestamp()}] Batch ${b + 1} done — enriched: ${enriched}, errors: ${errors}, no match: ${noMatch}`
    );
  }

  // ─── Final summary ─────────────────────────────────────────────────────────
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Google Places Enrichment Complete`);
  console.log(`${"=".repeat(50)}`);
  console.log(`  Total processed: ${retreats.length}`);
  console.log(`  Enriched:        ${enriched}`);
  console.log(`  No match:        ${noMatch}`);
  console.log(`  Skipped:         ${skipped}`);
  console.log(`  Errors:          ${errors}`);
  if (dryRun) console.log(`  Mode:            DRY RUN (no writes)`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
