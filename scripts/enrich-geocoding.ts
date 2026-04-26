/**
 * Geocode retreats missing lat/lng using OpenStreetMap Nominatim (free, no API key).
 *
 * Fetches retreats from Supabase where lat=0 AND lng=0 but have location info
 * (name, city, country, address), geocodes them via Nominatim, and updates
 * the lat/lng columns in Supabase.
 *
 * Usage:
 *   npx tsx scripts/enrich-geocoding.ts              # geocode all missing, apply updates
 *   npx tsx scripts/enrich-geocoding.ts --limit 10   # only process first 10
 *   npx tsx scripts/enrich-geocoding.ts --dry-run     # preview without updating Supabase
 *   npx tsx scripts/enrich-geocoding.ts --limit 5 --dry-run
 *
 * Nominatim usage policy:
 *   - Max 1 request per second (enforced via sleep)
 *   - Meaningful User-Agent header required
 *   - https://operations.osmfoundation.org/policies/nominatim/
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

// ─── Config ───────────────────────────────────────────────────────────────────

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "RetreatvVault-Geocoder/1.0 (https://retreatvault.com; admin@retreatvault.com)";
const RATE_LIMIT_MS = 1100; // slightly over 1s to be safe

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs(): { limit: number; dryRun: boolean } {
  const args = process.argv.slice(2);
  let limit = 0; // 0 = no limit
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    }
  }

  return { limit, dryRun };
}

// ─── Nominatim types ──────────────────────────────────────────────────────────

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  importance: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build multiple query strings from available retreat location fields,
 * ordered from most specific to most general.
 */
function buildSearchQueries(retreat: {
  name: string;
  address: string;
  city: string;
  country: string;
  region: string;
}): string[] {
  const queries: string[] = [];

  // 1) Full address if present and meaningful (not just "City, ST XXXXX")
  if (retreat.address && retreat.address.length > 10) {
    queries.push(retreat.address);
  }

  // 2) Name + city + country (most reliable for named venues)
  if (retreat.city && retreat.country) {
    queries.push(`${retreat.name}, ${retreat.city}, ${retreat.country}`);
  }

  // 3) Name + country
  if (retreat.country) {
    queries.push(`${retreat.name}, ${retreat.country}`);
  }

  // 4) City + country
  if (retreat.city && retreat.country) {
    queries.push(`${retreat.city}, ${retreat.country}`);
  }

  // 5) Just the name (last resort)
  queries.push(retreat.name);

  return queries;
}

/**
 * Query Nominatim with a search string. Returns the best result or null.
 */
async function geocodeQuery(query: string): Promise<NominatimResult | null> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
    addressdetails: "0",
  });

  const url = `${NOMINATIM_BASE}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`    Nominatim HTTP ${response.status} for query: "${query}"`);
      return null;
    }

    const results: NominatimResult[] = await response.json();

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (err: any) {
    console.error(`    Nominatim error for query "${query}": ${err.message}`);
    return null;
  }
}

/**
 * Try multiple search queries for a retreat until one returns a result.
 * Respects rate limit between each request.
 */
async function geocodeRetreat(retreat: {
  name: string;
  address: string;
  city: string;
  country: string;
  region: string;
}): Promise<{ lat: number; lng: number; display_name: string; query_used: string } | null> {
  const queries = buildSearchQueries(retreat);

  for (const query of queries) {
    await sleep(RATE_LIMIT_MS);
    const result = await geocodeQuery(query);

    if (result) {
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        display_name: result.display_name,
        query_used: query,
      };
    }
  }

  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { limit, dryRun } = parseArgs();

  console.log("RetreatvVault Geocoding Enrichment");
  console.log("──────────────────────────────────");
  console.log(`Mode:  ${dryRun ? "DRY RUN (no updates)" : "LIVE (will update Supabase)"}`);
  if (limit) console.log(`Limit: ${limit} retreats`);
  console.log("");

  // Fetch retreats missing coordinates (lat=0 and lng=0)
  // that have at least some location info to work with
  let query = supabase
    .from("retreats")
    .select("id, slug, name, address, city, country, region, lat, lng")
    .eq("lat", 0)
    .eq("lng", 0)
    .order("name", { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: retreats, error: fetchErr } = await query;

  if (fetchErr) {
    console.error("Failed to fetch retreats:", fetchErr.message);
    process.exit(1);
  }

  if (!retreats || retreats.length === 0) {
    console.log("No retreats found with missing coordinates. All good!");
    return;
  }

  console.log(`Found ${retreats.length} retreats missing coordinates.\n`);

  let geocoded = 0;
  let failed = 0;
  let updated = 0;
  const failures: string[] = [];

  for (let i = 0; i < retreats.length; i++) {
    const r = retreats[i];
    const progress = `[${i + 1}/${retreats.length}]`;

    // Skip if no location info at all
    if (!r.city && !r.country && !r.address) {
      console.log(`${progress} SKIP ${r.name} — no location data available`);
      failed++;
      failures.push(`${r.slug}: no location data`);
      continue;
    }

    console.log(`${progress} Geocoding: ${r.name}`);
    console.log(`           Location: ${[r.address, r.city, r.country].filter(Boolean).join(", ")}`);

    const result = await geocodeRetreat({
      name: r.name,
      address: r.address || "",
      city: r.city || "",
      country: r.country || "",
      region: r.region || "",
    });

    if (!result) {
      console.log(`           FAIL — no results from Nominatim\n`);
      failed++;
      failures.push(`${r.slug}: no Nominatim results`);
      continue;
    }

    console.log(`           Found: ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}`);
    console.log(`           Match: "${result.display_name}"`);
    console.log(`           Query: "${result.query_used}"`);
    geocoded++;

    if (!dryRun) {
      const { error: updateErr } = await supabase
        .from("retreats")
        .update({
          lat: result.lat,
          lng: result.lng,
        })
        .eq("id", r.id);

      if (updateErr) {
        console.log(`           UPDATE FAILED: ${updateErr.message}\n`);
        failures.push(`${r.slug}: update failed — ${updateErr.message}`);
      } else {
        console.log(`           Updated in Supabase\n`);
        updated++;
      }
    } else {
      console.log(`           [DRY RUN] Would update lat=${result.lat}, lng=${result.lng}\n`);
    }
  }

  // ─── Summary ───
  console.log("──────────────────────────────────");
  console.log("Summary:");
  console.log(`  Total processed: ${retreats.length}`);
  console.log(`  Geocoded:        ${geocoded}`);
  if (!dryRun) {
    console.log(`  Updated in DB:   ${updated}`);
  }
  console.log(`  Failed:          ${failed}`);

  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const f of failures) {
      console.log(`  - ${f}`);
    }
  }

  if (dryRun && geocoded > 0) {
    console.log("\nRe-run without --dry-run to apply updates.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
