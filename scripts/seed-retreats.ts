/**
 * Seed script: Push all retreat data (including 100 new retreats) into Supabase.
 * Usage: npx tsx scripts/seed-retreats.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

// Import all retreat data
import { retreats } from "../src/data/retreats";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log(`Seeding ${retreats.length} retreats into Supabase...`);

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const r of retreats) {
    const row = {
      slug: r.slug,
      name: r.name,
      subtitle: r.subtitle,
      website_url: r.website_url,
      booking_url: r.booking_url,
      country: r.country,
      region: r.region,
      city: r.city,
      address: r.address,
      lat: r.coordinates.lat,
      lng: r.coordinates.lng,
      nearest_airport: r.nearest_airport,
      airport_distance_km: r.airport_distance_km,
      property_size: r.property_size,
      room_count: r.room_count,
      max_guests: r.max_guests,
      founded_year: r.founded_year,
      property_type: r.property_type,
      price_min_per_night: r.price_min_per_night,
      price_max_per_night: r.price_max_per_night,
      pricing_model: r.pricing_model,
      minimum_stay_nights: r.minimum_stay_nights,
      hero_image_url: r.hero_image_url,
      gallery_images: r.gallery_images,
      instagram_handle: r.instagram_handle,
      scores: r.scores,
      wrd_score: r.wrd_score,
      score_tier: r.score_tier,
      google_rating: r.google_rating,
      google_review_count: r.google_review_count,
      tripadvisor_rating: r.tripadvisor_rating,
      tripadvisor_review_count: r.tripadvisor_review_count,
      specialty_tags: r.specialty_tags,
      dietary_options: r.dietary_options,
      program_types: r.program_types,
      is_sponsored: r.is_sponsored,
      is_verified: r.is_verified,
    };

    const { error } = await supabase
      .from("retreats")
      .upsert(row, { onConflict: "slug" });

    if (error) {
      console.error(`  ✗ ${r.name}: ${error.message}`);
      errors++;
    } else {
      inserted++;
      process.stdout.write(`  ✓ ${r.name} (${r.region}, WRD ${r.wrd_score})\n`);
    }
  }

  // Also seed awards into retreat_awards table
  console.log("\nSeeding awards...");
  for (const r of retreats) {
    if (r.awards.length === 0) continue;

    // First get the retreat UUID from Supabase
    const { data: retreatRow } = await supabase
      .from("retreats")
      .select("id")
      .eq("slug", r.slug)
      .single();

    if (!retreatRow) continue;

    for (const award of r.awards) {
      const { error } = await supabase
        .from("retreat_awards")
        .upsert(
          {
            retreat_id: retreatRow.id,
            name: award.name,
            year: award.year,
            issuing_body: award.issuing_body,
            url: award.url || "",
          },
          { onConflict: "retreat_id,name,year", ignoreDuplicates: true }
        );

      if (error && !error.message.includes("duplicate")) {
        console.error(`  Award error for ${r.name}: ${error.message}`);
      }
    }
  }

  console.log(`\nDone! ${inserted} retreats seeded, ${errors} errors.`);
}

seed().catch(console.error);
