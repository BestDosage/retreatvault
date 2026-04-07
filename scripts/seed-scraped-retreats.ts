/**
 * Seed scraped + scored retreats into Supabase.
 * Reads from data/retreats-scored.json (output of auto_score.py)
 * Usage: npx tsx scripts/seed-scraped-retreats.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const dataPath = path.join(__dirname, "..", "data", "retreats-scored.json");
  const retreats = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  console.log(`Seeding ${retreats.length} scraped retreats into Supabase...`);

  let inserted = 0;
  let errors = 0;
  let skipped = 0;
  const batchSize = 100;

  for (let i = 0; i < retreats.length; i += batchSize) {
    const batch = retreats.slice(i, i + batchSize);
    const rows = batch.map((r: any) => ({
      slug: r.slug,
      name: r.name,
      subtitle: r.subtitle || "",
      website_url: r.website_url || "",
      booking_url: r.booking_url || "",
      country: r.country || "",
      region: r.region || "Other",
      city: r.city || "",
      address: r.address || "",
      lat: r.lat || 0,
      lng: r.lng || 0,
      nearest_airport: r.nearest_airport || "",
      airport_distance_km: r.airport_distance_km || 0,
      property_size: r.property_size || "small",
      room_count: r.room_count || 0,
      max_guests: r.max_guests || 0,
      founded_year: r.founded_year || 0,
      property_type: r.property_type || [],
      price_min_per_night: r.price_min_per_night || 0,
      price_max_per_night: r.price_max_per_night || 0,
      pricing_model: r.pricing_model || "all_inclusive",
      minimum_stay_nights: r.minimum_stay_nights || 1,
      hero_image_url: r.hero_image_url || "",
      gallery_images: r.gallery_images || [],
      instagram_handle: r.instagram_handle || "",
      scores: r.scores,
      wrd_score: r.wrd_score,
      score_tier: r.score_tier,
      google_rating: r.google_rating || 0,
      google_review_count: r.google_review_count || 0,
      tripadvisor_rating: r.tripadvisor_rating,
      tripadvisor_review_count: r.tripadvisor_review_count,
      specialty_tags: r.specialty_tags || [],
      dietary_options: r.dietary_options || [],
      program_types: r.program_types || [],
      is_sponsored: false,
      is_verified: false,
    }));

    const { error } = await supabase
      .from("retreats")
      .upsert(rows, { onConflict: "slug" });

    if (error) {
      console.error(`  Batch ${i}-${i + batchSize}: ${error.message}`);
      errors += rows.length;
    } else {
      inserted += rows.length;
      process.stdout.write(`  ✓ Batch ${i}-${i + batchSize} (${inserted} total)\n`);
    }
  }

  console.log(`\nDone! ${inserted} retreats seeded, ${errors} errors, ${skipped} skipped.`);
}

seed().catch(console.error);
