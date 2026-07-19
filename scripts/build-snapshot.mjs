#!/usr/bin/env node
/**
 * Build-time data snapshot. Runs in the `prebuild` npm step (before `next build`).
 *
 * Fetches all retreats ONCE and writes them to src/data/retreats-snapshot.json.
 * getAllRetreats() then reads that file during static generation instead of
 * hitting Supabase from every page — which removes the entire build-time DB load
 * (the "thundering herd" that made cold builds time out) and lets static
 * generation run fully parallel again. Fast, cheap, reliable builds.
 *
 * Robust by design: if the env is missing or the fetch fails after retries, it
 * writes nothing and exits 0 — the build then falls back to the live query path
 * in data.ts, so a snapshot failure can never make the build worse than before.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OUT = path.join(process.cwd(), "src/data/retreats-snapshot.json");

// Must match LIST_COLUMNS + filters in src/lib/data.ts _fetchAllRetreats.
const LIST_COLUMNS =
  "id,slug,name,subtitle,website_url,booking_url,country,region,city,address," +
  "lat,lng,nearest_airport,airport_distance_km,property_size,room_count,max_guests," +
  "founded_year,property_type,price_min_per_night,price_max_per_night,pricing_model," +
  "minimum_stay_nights,hero_image_url,instagram_handle,scores,wrd_score,score_tier," +
  "google_rating,google_review_count,tripadvisor_rating,tripadvisor_review_count," +
  "specialty_tags,dietary_options,program_types,last_data_refresh,is_sponsored," +
  "is_verified,created_at";

if (!url || !key) {
  console.warn("[snapshot] Supabase env missing — skipping; build falls back to live query.");
  process.exit(0);
}

const supabase = createClient(url, key);
let rows = null;
let lastErr = "unknown";
for (let attempt = 1; attempt <= 4; attempt++) {
  try {
    const res = await supabase
      .from("retreats")
      .select(LIST_COLUMNS)
      .neq("slug", "test")
      .neq("slug", "cape-kalevala")
      .gt("wrd_score", 0)
      .order("wrd_score", { ascending: false })
      .order("slug", { ascending: true })
      .range(0, 49999)
      .abortSignal(AbortSignal.timeout(60_000));
    if (!res.error && res.data && res.data.length > 0) {
      rows = res.data;
      break;
    }
    lastErr = res.error?.message || "returned 0 rows";
  } catch (e) {
    lastErr = e instanceof Error ? e.message : String(e);
  }
  console.warn(`[snapshot] attempt ${attempt}/4 failed: ${lastErr}`);
  if (attempt < 4) await new Promise((r) => setTimeout(r, 2000 * attempt));
}

if (!rows) {
  console.warn(`[snapshot] could not fetch after 4 attempts (${lastErr}) — skipping; build falls back to live query.`);
  process.exit(0);
}

fs.writeFileSync(OUT, JSON.stringify(rows));
console.log(`[snapshot] wrote ${rows.length} retreats to ${OUT}`);
