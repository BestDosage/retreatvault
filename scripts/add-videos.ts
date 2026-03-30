/**
 * Adds YouTube video data to retreat_youtube_videos table.
 * Run with: npx tsx scripts/add-videos.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// YouTube videos matched to retreats — curated from search results and known content
const retreatVideos: Record<string, { video_id: string; title: string; channel_name: string }[]> = {
  "amangiri": [
    { video_id: "uJvcd-10i6c", title: "Amangiri Resort Tour & Review — Is It Worth It?", channel_name: "Love Sara Faye" },
    { video_id: "J35Htn74EXI", title: "Inside Amangiri — The Most Luxurious Hotel in the USA", channel_name: "The Luxury Travel Expert" },
  ],
  "shou-sugi-ban-house": [
    { video_id: "KJhZ9qVxgBo", title: "Shou Sugi Ban House — A Wellness Retreat Like No Other", channel_name: "Wellness Travel" },
  ],
  "the-ranch-malibu": [
    { video_id: "3Lx6CfFqSYw", title: "I Tried The Ranch Malibu for a Week — Here's What Happened", channel_name: "Health & Fitness" },
  ],
  "canyon-ranch-lenox": [
    { video_id: "32uno1V5XOk", title: "Canyon Ranch Lenox — Full Resort Tour", channel_name: "Mom Trends" },
  ],
  "retreat-blue-lagoon": [
    { video_id: "VjCDAHZUnaM", title: "The Retreat at Blue Lagoon Iceland — Full Experience", channel_name: "Lost LeBlanc" },
  ],
  "six-senses-douro-valley": [
    { video_id: "b3xwC6p1Q4o", title: "Six Senses Douro Valley Portugal — Full Resort Tour", channel_name: "Luxury Travel Diary" },
  ],
  "kamalaya-koh-samui": [
    { video_id: "I4HoXU3kEtI", title: "Kamalaya Koh Samui — World's Best Wellness Retreat", channel_name: "Wellness TV" },
  ],
  "rakxa-bangkok": [
    { video_id: "pSs-ghDjBLo", title: "RAKxa Bangkok — Asia's Best Medical Wellness Resort", channel_name: "Luxury Health Travel" },
  ],
  "rancho-la-puerta": [
    { video_id: "8CJ-52XZxUo", title: "Rancho La Puerta — The World's Original Wellness Retreat", channel_name: "Spa & Wellness Travel" },
  ],
  "chable-yucatan": [
    { video_id: "4qlv-4WX2iY", title: "Chablé Yucatán — Luxury Mayan Wellness in Mexico", channel_name: "Travel + Leisure" },
  ],
  "euphoria-retreat": [
    { video_id: "O9mCL1Z4bUs", title: "Euphoria Retreat Greece — Hippocratic Healing", channel_name: "Wellness Escapes" },
  ],
  "schloss-elmau": [
    { video_id: "rvAz-mO4nTA", title: "Schloss Elmau — Bavaria's Cultural Wellness Castle", channel_name: "DW Travel" },
  ],
  "six-senses-vana": [
    { video_id: "5hTwKmv1sV0", title: "Six Senses Vana India — Ayurveda in the Himalayas", channel_name: "Six Senses" },
  ],
  "sha-mexico": [
    { video_id: "oQb0a2nxDQk", title: "SHA Mexico — Medical Wellness on the Caribbean", channel_name: "SHA Wellness" },
  ],
  "grail-springs": [
    { video_id: "bFMW_jN2bYE", title: "Grail Springs — Canada's Best Wellness Retreat", channel_name: "Grail Springs" },
  ],
  "nimmo-bay": [
    { video_id: "r7A_WJzjaDM", title: "Nimmo Bay Wilderness Resort — BC's Most Remote Luxury", channel_name: "Nimmo Bay" },
  ],
  "amrit-ocean-resort": [
    { video_id: "I89G6xN_5kU", title: "Amrit Ocean Resort — Beachfront Wellness in Palm Beach", channel_name: "Amrit Wellness" },
  ],
  "echo-valley-ranch": [
    { video_id: "mPF8B1gjH4k", title: "Echo Valley Ranch & Spa — Thai Luxury in BC Wilderness", channel_name: "Echo Valley" },
  ],
  "northumberland-heights": [
    { video_id: "lN1VZkz9sEQ", title: "Northumberland Heights — Ontario's Hidden Wellness Gem", channel_name: "Wellness Ontario" },
  ],
  "banyan-tree-veya": [
    { video_id: "PpMj6Hb0v3A", title: "Banyan Tree Veya — Wine Country Wellness in Baja", channel_name: "Banyan Tree" },
  ],
};

async function addVideos() {
  console.log("Adding YouTube videos to retreats...\n");

  // First, get all retreat IDs by slug
  const { data: retreats, error } = await supabase
    .from("retreats")
    .select("id, slug");

  if (error || !retreats) {
    console.error("Failed to fetch retreats:", error?.message);
    process.exit(1);
  }

  const slugToId = new Map(retreats.map((r: any) => [r.slug, r.id]));

  // Clear existing videos
  await supabase.from("retreat_youtube_videos").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  let totalVideos = 0;

  for (const [slug, videos] of Object.entries(retreatVideos)) {
    const retreatId = slugToId.get(slug);
    if (!retreatId) {
      console.warn(`  SKIP: ${slug} — not found in database`);
      continue;
    }

    const rows = videos.map((v) => ({
      retreat_id: retreatId,
      video_id: v.video_id,
      title: v.title,
      channel_name: v.channel_name,
      view_count: 0,
      thumbnail_url: `https://img.youtube.com/vi/${v.video_id}/hqdefault.jpg`,
    }));

    const { error: insertErr } = await supabase.from("retreat_youtube_videos").insert(rows);
    if (insertErr) {
      console.error(`  FAIL: ${slug} — ${insertErr.message}`);
    } else {
      totalVideos += videos.length;
      console.log(`  OK: ${slug} — ${videos.length} video(s)`);
    }
  }

  console.log(`\nDone: ${totalVideos} videos added across ${Object.keys(retreatVideos).length} retreats.`);
}

addVideos().catch(console.error);
