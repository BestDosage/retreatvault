// scripts/google-reviews-scraper/index.ts

import { config } from "dotenv";
config({ path: ".env.local" });

import { scrapeReviews, placeIdToUrl } from "./scraper";
import type { ScrapeOptions } from "./types";
import * as fs from "fs";

function printUsage() {
  console.log(`
Google Reviews Scraper — extract full review text from Google Maps

Usage:
  npx tsx scripts/google-reviews-scraper/index.ts <place_id_or_url> [options]
  npx tsx scripts/google-reviews-scraper/index.ts --file <json_file> [options]

Options:
  --max <n>        Max reviews per place (default: 100, 0 = all)
  --delay <ms>     Scroll delay in ms (default: 1500)
  --proxy <url>    Proxy URL (e.g., http://user:pass@host:port)
  --visible        Run browser visibly (not headless)
  --output <path>  Output JSON file (default: stdout)
  --file <path>    JSON file with array of {id, name, place_id} objects

Examples:
  # Single place by Place ID
  npx tsx scripts/google-reviews-scraper/index.ts ChIJN1t_tDeuEmsRUsoyG83frY4

  # Single place by URL
  npx tsx scripts/google-reviews-scraper/index.ts "https://www.google.com/maps/place/..." --max 50

  # Batch from file
  npx tsx scripts/google-reviews-scraper/index.ts --file data/place-ids.json --max 100 --output data/reviews.json

  # With proxy
  npx tsx scripts/google-reviews-scraper/index.ts ChIJ... --proxy http://user:pass@proxy.example.com:8080
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    printUsage();
    process.exit(0);
  }

  // Parse options
  const options: ScrapeOptions = {};
  let target = "";
  let batchFile = "";
  let outputPath = "";

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--max":
        options.maxReviews = parseInt(args[++i]);
        break;
      case "--delay":
        options.scrollDelay = parseInt(args[++i]);
        break;
      case "--proxy":
        options.proxy = args[++i];
        break;
      case "--visible":
        options.headless = false;
        break;
      case "--output":
        outputPath = args[++i];
        break;
      case "--file":
        batchFile = args[++i];
        break;
      default:
        if (!args[i].startsWith("--")) target = args[i];
    }
  }

  // Single place or batch
  if (batchFile) {
    const places = JSON.parse(fs.readFileSync(batchFile, "utf-8"));
    console.log(`Batch mode: ${places.length} places`);

    const results = [];
    for (let i = 0; i < places.length; i++) {
      const place = places[i];
      console.log(`\n[${i + 1}/${places.length}] ${place.name || place.place_id}`);

      try {
        const result = await scrapeReviews(place.place_id, options);
        results.push({ ...result, retreat_id: place.id });

        // Save incrementally
        if (outputPath) {
          fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        }
      } catch (err: any) {
        console.error(`  FAILED: ${err.message}`);
        results.push({
          retreat_id: place.id,
          place_name: place.name,
          error: err.message,
          reviews: [],
        });
      }

      // Wait between places (3-8 seconds with jitter)
      if (i < places.length - 1) {
        const gap = 3000 + Math.random() * 5000;
        console.log(`  Waiting ${Math.round(gap / 1000)}s before next...`);
        await new Promise((r) => setTimeout(r, gap));
      }
    }

    if (outputPath) {
      console.log(`\nDone. ${results.length} results saved to ${outputPath}`);
    } else {
      console.log(JSON.stringify(results, null, 2));
    }
  } else if (target) {
    const result = await scrapeReviews(target, options);

    if (outputPath) {
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      console.log(`Saved ${result.reviews.length} reviews to ${outputPath}`);
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
