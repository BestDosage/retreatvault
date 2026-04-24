/**
 * Discover forum/community discussions about wellness retreats.
 *
 * Searches for Reddit, TripAdvisor, and blog discussions
 * about each retreat via Google search, stores links for display.
 *
 * Usage:
 *   npx tsx scripts/discover-forum-intel.ts [limit]
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
 *
 * No additional API keys needed.
 * Rate limited to avoid being blocked.
 *
 * Note: Google may block automated searches. For production scale,
 * use Google Custom Search API ($5/1000 queries) or SerpAPI.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ForumThread {
  retreat_id: string;
  retreat_name: string;
  url: string;
  title: string;
  source: "reddit" | "tripadvisor" | "blog" | "forum";
  discovered_at: string;
}

function classifySource(url: string): ForumThread["source"] {
  if (url.includes("reddit.com")) return "reddit";
  if (url.includes("tripadvisor")) return "tripadvisor";
  if (url.includes("lonelyplanet") || url.includes("fodors")) return "forum";
  return "blog";
}

// Lightweight Google search via HTML parsing
async function searchGoogle(query: string): Promise<{ title: string; url: string }[]> {
  const encoded = encodeURIComponent(query);
  const searchUrl = `https://www.google.com/search?q=${encoded}&num=10&hl=en`;

  try {
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Google rate limited — wait and retry");
      return [];
    }

    const html = await res.text();
    const results: { title: string; url: string }[] = [];

    // Extract URLs from Google's redirect links
    const urlPattern = /\/url\?q=(https?:\/\/[^&"]+)/g;
    let match;
    const seenUrls = new Set<string>();

    while ((match = urlPattern.exec(html)) !== null) {
      const decodedUrl = decodeURIComponent(match[1]);

      // Skip Google's own pages and common non-content sites
      if (
        decodedUrl.includes("google.com") ||
        decodedUrl.includes("youtube.com") ||
        decodedUrl.includes("maps.google") ||
        decodedUrl.includes("accounts.google") ||
        decodedUrl.includes("support.google") ||
        seenUrls.has(decodedUrl)
      ) continue;

      seenUrls.add(decodedUrl);
      // Extract a rough title from the URL path
      const pathTitle = decodedUrl.split("/").pop()?.replace(/[-_]/g, " ").replace(/\.\w+$/, "") || "";
      results.push({ title: pathTitle, url: decodedUrl });
    }

    return results.slice(0, 8);
  } catch (e: any) {
    if (e.message.includes("rate limited")) throw e;
    return [];
  }
}

async function discoverForumThreads(retreat: any): Promise<ForumThread[]> {
  const queries = [
    `"${retreat.name}" site:reddit.com wellness retreat review experience`,
    `"${retreat.name}" retreat review blog experience -site:booking.com -site:youtube.com -site:expedia.com`,
  ];

  const allResults: ForumThread[] = [];
  const seenUrls = new Set<string>();

  for (const query of queries) {
    try {
      const results = await searchGoogle(query);

      for (const r of results) {
        if (seenUrls.has(r.url)) continue;
        seenUrls.add(r.url);

        // Skip the retreat's own website
        try {
          if (retreat.website_url) {
            const retreatHost = new URL(retreat.website_url).hostname.replace("www.", "");
            if (r.url.includes(retreatHost)) continue;
          }
        } catch {}

        // Skip booking/aggregator sites
        const skipDomains = ["booking.com", "expedia.com", "hotels.com", "trivago.com", "agoda.com", "kayak.com"];
        if (skipDomains.some((d) => r.url.includes(d))) continue;

        allResults.push({
          retreat_id: retreat.id,
          retreat_name: retreat.name,
          url: r.url,
          title: r.title,
          source: classifySource(r.url),
          discovered_at: new Date().toISOString(),
        });
      }
    } catch (e: any) {
      if (e.message.includes("rate limited")) throw e;
    }

    // Delay between queries
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  return allResults;
}

async function main() {
  const args = process.argv.slice(2);
  const limit = parseInt(args.find((a) => !a.startsWith("--")) || "20", 10);

  console.log(`Discovering forum/blog discussions for top ${limit} retreats...\n`);

  const { data: retreats, error } = await supabase
    .from("retreats")
    .select("id, slug, name, website_url")
    .gt("wrd_score", 0)
    .neq("slug", "test")
    .order("wrd_score", { ascending: false })
    .limit(limit);

  if (error || !retreats) {
    console.error("Failed to fetch retreats:", error?.message);
    process.exit(1);
  }

  console.log(`Processing ${retreats.length} retreats\n`);

  const allThreads: ForumThread[] = [];

  for (let i = 0; i < retreats.length; i++) {
    const retreat = retreats[i];
    process.stdout.write(`[${i + 1}/${retreats.length}] ${retreat.name}...`);

    try {
      const threads = await discoverForumThreads(retreat);
      allThreads.push(...threads);

      const reddit = threads.filter((t) => t.source === "reddit").length;
      const blogs = threads.filter((t) => t.source === "blog").length;
      const ta = threads.filter((t) => t.source === "tripadvisor").length;
      console.log(` ${threads.length} links (reddit:${reddit} ta:${ta} blog:${blogs})`);
    } catch (e: any) {
      if (e.message.includes("rate limited")) {
        console.log(` RATE LIMITED — stopping. Run again later.`);
        break;
      }
      console.log(` FAILED: ${e.message}`);
    }

    // 3-second delay between retreats
    if (i < retreats.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // Write output
  const outputPath = "data/forum-intel.json";
  if (!fs.existsSync("data")) fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(allThreads, null, 2));

  console.log("\n--- Summary ---");
  console.log(`Retreats processed: ${retreats.length}`);
  console.log(`Total links found: ${allThreads.length}`);

  const bySource: Record<string, number> = {};
  allThreads.forEach((t) => { bySource[t.source] = (bySource[t.source] || 0) + 1; });
  console.log("\nBy source:");
  for (const [source, count] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${source}: ${count}`);
  }

  console.log(`\nOutput: ${outputPath}`);
  console.log("\nNext steps:");
  console.log("1. Create 'retreat_community_links' table in Supabase");
  console.log("2. Insert the JSON data");
  console.log("3. Add CommunityIntel component to retreat pages");
  console.log("\nFor production scale, use Google Custom Search API or SerpAPI.");
}

main().catch(console.error);
