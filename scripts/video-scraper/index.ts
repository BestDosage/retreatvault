// scripts/video-scraper/index.ts

import { config } from "dotenv";
config({ path: ".env.local" });

import { searchYouTube } from "./youtube";
import { searchTikTok } from "./tiktok";
import type { ScrapeOptions, VideoScrapeResult } from "./types";
import * as fs from "fs";

function printUsage() {
  console.log(`
Video proof scraper — find high quality YouTube and TikTok videos

Usage:
  npx tsx scripts/video-scraper/index.ts "retreat name" [options]
  npx tsx scripts/video-scraper/index.ts --file places.json [options]

Options:
  --platform <name>  youtube, tiktok, or both (default: both)
  --max <n>          Max videos per platform per retreat (default: 10)
  --output <path>    Save results to JSON file
  --file <path>      Batch mode — JSON array of {id, name} objects
  --visible          Show browser window (TikTok only)
`);
}

async function scrapeOne(
  name: string,
  platform: string,
  options: ScrapeOptions
): Promise<VideoScrapeResult> {
  const results: VideoScrapeResult = {
    retreat_name: name,
    platform: platform as any,
    videos: [],
    scraped_at: new Date().toISOString(),
    errors: [],
  };

  if (platform === "youtube" || platform === "both") {
    const yt = await searchYouTube(name, options);
    results.videos.push(...yt.videos);
    results.errors.push(...yt.errors);
  }

  if (platform === "tiktok" || platform === "both") {
    const tt = await searchTikTok(name, options);
    results.videos.push(...tt.videos);
    results.errors.push(...tt.errors);
  }

  return results;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    printUsage();
    process.exit(0);
  }

  let target = "";
  let batchFile = "";
  let outputPath = "";
  let platform = "both";
  const options: ScrapeOptions = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--platform": platform = args[++i]; break;
      case "--max": options.max = parseInt(args[++i]); break;
      case "--output": outputPath = args[++i]; break;
      case "--file": batchFile = args[++i]; break;
      case "--visible": options.headless = false; break;
      default:
        if (!args[i].startsWith("--")) target = args[i];
    }
  }

  if (batchFile) {
    const places = JSON.parse(fs.readFileSync(batchFile, "utf-8"));
    console.log(`Batch mode: ${places.length} places, platform: ${platform}`);

    const results: VideoScrapeResult[] = [];
    for (let i = 0; i < places.length; i++) {
      const place = places[i];
      console.log(`\n[${i + 1}/${places.length}] ${place.name}`);

      const result = await scrapeOne(place.name, platform, options);
      results.push({ ...result, retreat_name: place.name });

      if (outputPath) {
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
      }

      // Wait between places
      if (i < places.length - 1) {
        const gap = 2000 + Math.random() * 3000;
        console.log(`  Waiting ${Math.round(gap / 1000)}s...`);
        await new Promise((r) => setTimeout(r, gap));
      }
    }

    if (!outputPath) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log(`\nDone. ${results.length} results saved to ${outputPath}`);
    }
  } else if (target) {
    const result = await scrapeOne(target, platform, options);

    if (outputPath) {
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      console.log(`Saved ${result.videos.length} videos to ${outputPath}`);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } else {
    printUsage();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
