/**
 * Discover YouTube videos about wellness retreats.
 *
 * Searches YouTube for review/vlog/experience videos for each retreat,
 * categorizes them (official vs independent), and inserts into Supabase.
 *
 * Usage:
 *   npx tsx scripts/discover-youtube-videos.ts [limit] [--insert]
 *
 * Requires in .env.local:
 *   YOUTUBE_API_KEY=... (Google Cloud YouTube Data API v3 key)
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
 *
 * Get a YouTube API key:
 *   1. Go to https://console.cloud.google.com/
 *   2. Create a project (or use existing)
 *   3. Enable "YouTube Data API v3"
 *   4. Create an API key under Credentials
 *   5. Add to .env.local: YOUTUBE_API_KEY=AIza...
 *
 * Free tier: 10,000 units/day. Each search = 100 units = 100 searches/day.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

interface YouTubeResult {
  retreat_id: string;
  retreat_name: string;
  video_id: string;
  title: string;
  channel_name: string;
  channel_id: string;
  published_at: string;
  view_count: number;
  thumbnail_url: string;
  video_type: "official" | "independent_review" | "walkthrough" | "vlog" | "listicle";
}

// Classify a video based on title, channel, and retreat name
function classifyVideo(
  title: string,
  channelName: string,
  retreatName: string
): YouTubeResult["video_type"] {
  const t = title.toLowerCase();
  const c = channelName.toLowerCase();
  const r = retreatName.toLowerCase();

  // Official = channel name matches retreat name closely
  const retreatWords = r.split(/\s+/).filter((w) => w.length > 3);
  const channelMatchCount = retreatWords.filter((w) => c.includes(w)).length;
  if (channelMatchCount >= 2 || c.includes(r)) return "official";

  // Review
  if (t.includes("review") || t.includes("honest") || t.includes("worth it") || t.includes("pros and cons"))
    return "independent_review";

  // Walkthrough / Tour
  if (t.includes("tour") || t.includes("walkthrough") || t.includes("room tour") || t.includes("full tour"))
    return "walkthrough";

  // Listicle
  if (t.match(/\btop\s+\d+\b/) || t.match(/\bbest\s+\d+\b/) || t.includes("best retreats"))
    return "listicle";

  // Default to vlog
  return "vlog";
}

// Search YouTube Data API v3
async function searchYouTube(query: string, maxResults = 10): Promise<any[]> {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY not set");
  }

  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(maxResults),
    order: "relevance",
    relevanceLanguage: "en",
    key: YOUTUBE_API_KEY,
  });

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`YouTube API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.items || [];
}

// Get video statistics (view counts)
async function getVideoStats(videoIds: string[]): Promise<Map<string, number>> {
  if (!YOUTUBE_API_KEY || videoIds.length === 0) return new Map();

  const params = new URLSearchParams({
    part: "statistics",
    id: videoIds.join(","),
    key: YOUTUBE_API_KEY,
  });

  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
  if (!res.ok) return new Map();

  const data = await res.json();
  const map = new Map<string, number>();
  for (const item of data.items || []) {
    map.set(item.id, parseInt(item.statistics?.viewCount || "0", 10));
  }
  return map;
}

// Search for videos about a specific retreat
async function discoverVideosForRetreat(
  retreat: any
): Promise<YouTubeResult[]> {
  const queries = [
    `"${retreat.name}" review OR experience OR vlog`,
    `"${retreat.name}" retreat tour OR walkthrough`,
  ];

  const allItems: any[] = [];
  const seenIds = new Set<string>();

  for (const query of queries) {
    try {
      const items = await searchYouTube(query, 5);
      for (const item of items) {
        const videoId = item.id?.videoId;
        if (videoId && !seenIds.has(videoId)) {
          seenIds.add(videoId);
          allItems.push(item);
        }
      }
    } catch (e: any) {
      // If quota exceeded, rethrow
      if (e.message.includes("403") || e.message.includes("quota")) throw e;
    }
  }

  if (allItems.length === 0) return [];

  // Get view counts
  const videoIds = allItems.map((item) => item.id.videoId);
  const viewCounts = await getVideoStats(videoIds);

  // Filter: minimum 500 views to exclude noise
  const results: YouTubeResult[] = [];
  for (const item of allItems) {
    const videoId = item.id.videoId;
    const views = viewCounts.get(videoId) || 0;

    // Skip very low view videos (likely spam/irrelevant)
    if (views < 200) continue;

    const title = item.snippet?.title || "";
    const channelName = item.snippet?.channelTitle || "";

    // Relevance check: title should mention the retreat name or related terms
    const retreatWords = retreat.name.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    const titleLower = title.toLowerCase();
    const isRelevant = retreatWords.some((w: string) => titleLower.includes(w)) ||
      titleLower.includes("retreat") || titleLower.includes("wellness") || titleLower.includes("spa");

    if (!isRelevant) continue;

    results.push({
      retreat_id: retreat.id,
      retreat_name: retreat.name,
      video_id: videoId,
      title,
      channel_name: channelName,
      channel_id: item.snippet?.channelId || "",
      published_at: item.snippet?.publishedAt || "",
      view_count: views,
      thumbnail_url: item.snippet?.thumbnails?.high?.url ||
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      video_type: classifyVideo(title, channelName, retreat.name),
    });
  }

  // Sort by views descending, take top 8
  results.sort((a, b) => b.view_count - a.view_count);
  return results.slice(0, 8);
}

async function main() {
  const args = process.argv.slice(2);
  const shouldInsert = args.includes("--insert");
  const limit = parseInt(args.find((a) => !a.startsWith("--")) || "50", 10);

  if (!YOUTUBE_API_KEY) {
    console.error("Missing YOUTUBE_API_KEY in .env.local");
    console.error("\nTo get one:");
    console.error("1. Go to https://console.cloud.google.com/");
    console.error("2. Create a project");
    console.error('3. Enable "YouTube Data API v3"');
    console.error("4. Create an API key under Credentials");
    console.error("5. Add to .env.local: YOUTUBE_API_KEY=AIza...");
    process.exit(1);
  }

  console.log(`Discovering YouTube videos for top ${limit} retreats...`);
  console.log(`Mode: ${shouldInsert ? "Discover + Insert" : "Discover only (JSON)"}\n`);

  // Fetch retreats sorted by score (prioritize top retreats)
  const { data: retreats, error } = await supabase
    .from("retreats")
    .select("id, slug, name")
    .gt("wrd_score", 0)
    .neq("slug", "test")
    .order("wrd_score", { ascending: false })
    .limit(limit);

  if (error || !retreats) {
    console.error("Failed to fetch retreats:", error?.message);
    process.exit(1);
  }

  // Find retreats that already have videos
  const { data: existingVideos } = await supabase
    .from("retreat_youtube_videos")
    .select("retreat_id");
  const hasVideos = new Set((existingVideos || []).map((v: any) => v.retreat_id));

  const needsDiscovery = retreats.filter((r) => !hasVideos.has(r.id));
  console.log(`${retreats.length} retreats fetched, ${needsDiscovery.length} need video discovery\n`);

  if (needsDiscovery.length === 0) {
    console.log("All retreats already have videos discovered!");
    return;
  }

  // Each retreat uses 2 search queries = 200 quota units
  // Daily limit: 10,000 units = 50 retreats/day
  const maxPerDay = 50;
  const toProcess = needsDiscovery.slice(0, maxPerDay);
  if (needsDiscovery.length > maxPerDay) {
    console.log(`⚠ Rate limit: processing ${maxPerDay} of ${needsDiscovery.length} (YouTube API allows ~50 retreats/day)`);
    console.log(`  Run again tomorrow for the next batch.\n`);
  }

  const allResults: YouTubeResult[] = [];
  let totalFound = 0;
  let quotaUsed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const retreat = toProcess[i];
    process.stdout.write(`[${i + 1}/${toProcess.length}] ${retreat.name}...`);

    try {
      const videos = await discoverVideosForRetreat(retreat);
      allResults.push(...videos);
      totalFound += videos.length;
      quotaUsed += 200; // 2 searches × 100 units + 1 stats call
      console.log(` found ${videos.length} videos`);

      // Batch insert every 10 retreats
      if (shouldInsert && allResults.length >= 20) {
        const batch = allResults.splice(0, allResults.length);
        const rows = batch.map((v) => ({
          retreat_id: v.retreat_id,
          video_id: v.video_id,
          title: v.title,
          channel_name: v.channel_name,
          view_count: v.view_count,
          thumbnail_url: v.thumbnail_url,
          published_at: v.published_at || null,
        }));
        const { error: insertErr } = await supabase
          .from("retreat_youtube_videos")
          .upsert(rows, { onConflict: "id" });
        if (insertErr) console.error(`  DB error: ${insertErr.message}`);
      }
    } catch (e: any) {
      if (e.message.includes("quota") || e.message.includes("403")) {
        console.log(` QUOTA EXCEEDED — stopping.`);
        console.log(`  Processed ${i} retreats today. Run again tomorrow.`);
        break;
      }
      console.log(` FAILED: ${e.message}`);
    }

    // Delay between retreats (respect rate limits)
    if (i < toProcess.length - 1) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // Flush remaining
  if (shouldInsert && allResults.length > 0) {
    const rows = allResults.map((v) => ({
      retreat_id: v.retreat_id,
      video_id: v.video_id,
      title: v.title,
      channel_name: v.channel_name,
      view_count: v.view_count,
      thumbnail_url: v.thumbnail_url,
      published_at: v.published_at || null,
    }));
    const { error: insertErr } = await supabase
      .from("retreat_youtube_videos")
      .upsert(rows, { onConflict: "id" });
    if (insertErr) console.error(`DB error: ${insertErr.message}`);
  }

  // Write JSON output
  const outputPath = "data/youtube-discovery.json";
  if (!fs.existsSync("data")) fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));

  console.log("\n--- Summary ---");
  console.log(`Retreats processed: ${toProcess.length}`);
  console.log(`Videos discovered: ${totalFound}`);
  console.log(`Avg videos per retreat: ${(totalFound / toProcess.length).toFixed(1)}`);
  console.log(`Estimated quota used: ~${quotaUsed} / 10,000`);
  console.log(`Output: ${outputPath}`);

  // Show video type breakdown
  const typeCount: Record<string, number> = {};
  for (const v of allResults) {
    typeCount[v.video_type] = (typeCount[v.video_type] || 0) + 1;
  }
  console.log("\nBy type:");
  for (const [type, count] of Object.entries(typeCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
}

main().catch(console.error);
