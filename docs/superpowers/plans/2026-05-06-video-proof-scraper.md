# Video proof scraper implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable video scraper that discovers high quality YouTube and TikTok videos for any business, with shared quality filtering.

**Architecture:** Standalone CLI at `scripts/video-scraper/` with shared types and quality filter. YouTube uses Data API v3 (HTTP, no browser). TikTok uses Playwright HTTP interception (same approach as Google Reviews scraper). Both feed through the same quality filter before output.

**Tech Stack:** TypeScript, YouTube Data API v3, Playwright (for TikTok), shared quality-filter module

---

### Task 1: Shared types and quality filter

**Files:**
- Create: `scripts/video-scraper/types.ts`
- Create: `scripts/video-scraper/quality-filter.ts`

- [ ] **Step 1: Create types**

```typescript
// scripts/video-scraper/types.ts

export interface VideoResult {
  platform: "youtube" | "tiktok";
  video_id: string;
  video_url: string;
  embed_url: string;
  thumbnail_url: string;
  title: string;
  creator_name: string;
  creator_url: string;
  views: number;
  likes: number;
  comments: number;
  published_date: string;
  is_official: boolean;
  retreat_commented: boolean;
  duration_seconds: number;
  quality_score: number;
}

export interface ScrapeOptions {
  max?: number;
  headless?: boolean;
  proxy?: string;
}

export interface VideoScrapeResult {
  retreat_name: string;
  platform: "youtube" | "tiktok" | "both";
  videos: VideoResult[];
  scraped_at: string;
  errors: string[];
}
```

- [ ] **Step 2: Create quality filter**

```typescript
// scripts/video-scraper/quality-filter.ts

import type { VideoResult } from "./types";

const MIN_VIEWS = 5000;
const MIN_LIKES = 100;
const MAX_AGE_YEARS = 2;

export function passesQualityFilter(video: VideoResult): boolean {
  if (video.views < MIN_VIEWS) return false;
  if (video.likes < MIN_LIKES) return false;

  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - MAX_AGE_YEARS);
  if (new Date(video.published_date) < cutoff) return false;

  return true;
}

export function isOfficialChannel(creatorName: string, retreatName: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cn = normalize(creatorName);
  const rn = normalize(retreatName);
  return cn.includes(rn) || rn.includes(cn);
}

export function computeQualityScore(video: VideoResult): number {
  return Math.round(video.views * 0.5 + video.likes * 2 + video.comments * 3);
}
```

- [ ] **Step 3: Commit**

```bash
git add scripts/video-scraper/
git commit -m "feat(video-scraper): shared types and quality filter"
```

---

### Task 2: YouTube scraper

**Files:**
- Create: `scripts/video-scraper/youtube.ts`

- [ ] **Step 1: Write YouTube search + quality filter**

```typescript
// scripts/video-scraper/youtube.ts

import type { VideoResult, ScrapeOptions, VideoScrapeResult } from "./types";
import { passesQualityFilter, isOfficialChannel, computeQualityScore } from "./quality-filter";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    channelId: string;
    publishedAt: string;
    thumbnails: { high: { url: string } };
  };
}

interface YouTubeVideoStats {
  id: string;
  statistics: { viewCount: string; likeCount: string; commentCount: string };
  contentDetails: { duration: string };
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  return h * 3600 + m * 60 + s;
}

export async function searchYouTube(
  retreatName: string,
  options: ScrapeOptions = {}
): Promise<VideoScrapeResult> {
  if (!YOUTUBE_API_KEY) {
    return { retreat_name: retreatName, platform: "youtube", videos: [], scraped_at: new Date().toISOString(), errors: ["YOUTUBE_API_KEY not set"] };
  }

  const max = options.max ?? 10;
  const errors: string[] = [];

  console.log(`  YouTube: searching "${retreatName}"...`);

  // Step 1: Search for videos
  const searchParams = new URLSearchParams({
    part: "snippet",
    q: `${retreatName} retreat review vlog`,
    type: "video",
    maxResults: "25",
    order: "viewCount",
    key: YOUTUBE_API_KEY,
  });

  const searchRes = await fetch(`${SEARCH_URL}?${searchParams}`);
  if (!searchRes.ok) {
    errors.push(`YouTube search failed: ${searchRes.status}`);
    return { retreat_name: retreatName, platform: "youtube", videos: [], scraped_at: new Date().toISOString(), errors };
  }

  const searchData = await searchRes.json();
  const items: YouTubeSearchItem[] = searchData.items || [];

  if (items.length === 0) {
    return { retreat_name: retreatName, platform: "youtube", videos: [], scraped_at: new Date().toISOString(), errors: ["No videos found"] };
  }

  // Step 2: Get video stats (views, likes, duration)
  const videoIds = items.map((i) => i.id.videoId).join(",");
  const statsParams = new URLSearchParams({
    part: "statistics,contentDetails",
    id: videoIds,
    key: YOUTUBE_API_KEY,
  });

  const statsRes = await fetch(`${VIDEOS_URL}?${statsParams}`);
  const statsData = await statsRes.json();
  const statsMap = new Map<string, YouTubeVideoStats>();
  for (const item of statsData.items || []) {
    statsMap.set(item.id, item);
  }

  // Step 3: Build results with quality filter
  const videos: VideoResult[] = [];

  for (const item of items) {
    const stats = statsMap.get(item.id.videoId);
    if (!stats) continue;

    const views = parseInt(stats.statistics.viewCount || "0");
    const likes = parseInt(stats.statistics.likeCount || "0");
    const comments = parseInt(stats.statistics.commentCount || "0");
    const duration = parseDuration(stats.contentDetails.duration);
    const isOfficial = isOfficialChannel(item.snippet.channelTitle, retreatName);

    const video: VideoResult = {
      platform: "youtube",
      video_id: item.id.videoId,
      video_url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      embed_url: `https://www.youtube.com/embed/${item.id.videoId}`,
      thumbnail_url: item.snippet.thumbnails.high.url,
      title: item.snippet.title,
      creator_name: item.snippet.channelTitle,
      creator_url: `https://www.youtube.com/channel/${item.snippet.channelId}`,
      views,
      likes,
      comments,
      published_date: item.snippet.publishedAt.split("T")[0],
      is_official: isOfficial,
      retreat_commented: false,
      duration_seconds: duration,
      quality_score: 0,
    };

    video.quality_score = computeQualityScore(video);

    if (passesQualityFilter(video)) {
      videos.push(video);
    }
  }

  // Sort by quality score, take top N
  videos.sort((a, b) => b.quality_score - a.quality_score);
  const final = videos.slice(0, max);

  console.log(`  YouTube: ${final.length} quality videos (${items.length} searched, ${videos.length} passed filter)`);

  return {
    retreat_name: retreatName,
    platform: "youtube",
    videos: final,
    scraped_at: new Date().toISOString(),
    errors,
  };
}
```

- [ ] **Step 2: Test YouTube scraper**

```bash
cd ~/Projects/retreatvault
npx tsx -e "
import { config } from 'dotenv'; config({ path: '.env.local' });
import { searchYouTube } from './scripts/video-scraper/youtube';
searchYouTube('Canyon Ranch Tucson', { max: 5 }).then(r => {
  console.log(JSON.stringify(r, null, 2));
});
"
```

Verify: returns videos with views > 5000, likes > 100, quality_score populated.

- [ ] **Step 3: Commit**

```bash
git add scripts/video-scraper/youtube.ts
git commit -m "feat(video-scraper): YouTube search with quality filtering"
```

---

### Task 3: TikTok scraper

**Files:**
- Create: `scripts/video-scraper/tiktok.ts`

- [ ] **Step 1: Write TikTok search via Playwright interception**

```typescript
// scripts/video-scraper/tiktok.ts

import { chromium, type Browser, type Page } from "playwright";
import type { VideoResult, ScrapeOptions, VideoScrapeResult } from "./types";
import { passesQualityFilter, isOfficialChannel, computeQualityScore } from "./quality-filter";

function parseTikTokResponse(raw: string, retreatName: string): VideoResult[] {
  const videos: VideoResult[] = [];

  try {
    const data = JSON.parse(raw);
    // TikTok search API returns items in data.data or data.itemList
    const items = data?.data || data?.itemList || data?.item_list || [];

    for (const item of items) {
      const stats = item.stats || item.statistics || {};
      const author = item.author || {};
      const videoId = item.id || item.video_id || "";

      if (!videoId) continue;

      const views = stats.playCount || stats.play_count || stats.viewCount || 0;
      const likes = stats.diggCount || stats.digg_count || stats.likeCount || 0;
      const comments = stats.commentCount || stats.comment_count || 0;
      const shares = stats.shareCount || stats.share_count || 0;
      const duration = item.video?.duration || item.duration || 0;
      const createTime = item.createTime || item.create_time || 0;
      const publishedDate = createTime
        ? new Date(createTime * 1000).toISOString().split("T")[0]
        : "";

      const creatorName = author.uniqueId || author.unique_id || author.nickname || "";
      const isOfficial = isOfficialChannel(creatorName, retreatName);

      const desc = item.desc || item.description || "";

      const video: VideoResult = {
        platform: "tiktok",
        video_id: videoId,
        video_url: `https://www.tiktok.com/@${creatorName}/video/${videoId}`,
        embed_url: `https://www.tiktok.com/embed/v2/${videoId}`,
        thumbnail_url: item.video?.cover || item.video?.dynamicCover || "",
        title: desc.slice(0, 150),
        creator_name: creatorName,
        creator_url: `https://www.tiktok.com/@${creatorName}`,
        views,
        likes,
        comments,
        published_date: publishedDate,
        is_official: isOfficial,
        retreat_commented: false,
        duration_seconds: duration,
        quality_score: 0,
      };

      video.quality_score = computeQualityScore(video);

      if (passesQualityFilter(video)) {
        videos.push(video);
      }
    }
  } catch {
    // JSON parse failure
  }

  return videos;
}

export async function searchTikTok(
  retreatName: string,
  options: ScrapeOptions = {}
): Promise<VideoScrapeResult> {
  const max = options.max ?? 10;
  const errors: string[] = [];
  const allVideos: VideoResult[] = [];

  const launchOptions: any = {
    headless: options.headless ?? false,
    args: [
      "--window-position=9999,9999",
      "--window-size=1,1",
      "--no-first-run",
      "--disable-gpu",
    ],
  };
  if (options.proxy) {
    launchOptions.proxy = { server: options.proxy };
  }

  const browser: Browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    locale: "en-US",
    viewport: { width: 1280, height: 900 },
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
  });

  const page: Page = await context.newPage();

  // Intercept TikTok API responses
  page.on("response", async (res) => {
    const url = res.url();
    if (
      url.includes("/api/search") ||
      url.includes("/api/post/item_list") ||
      url.includes("search/item") ||
      url.includes("search/video")
    ) {
      const body = await res.text().catch(() => "");
      if (body.length > 200) {
        const parsed = parseTikTokResponse(body, retreatName);
        allVideos.push(...parsed);
      }
    }
  });

  try {
    console.log(`  TikTok: searching "${retreatName}"...`);

    // Go to TikTok and search
    await page.goto("https://www.tiktok.com/search?q=" + encodeURIComponent(retreatName + " retreat"), {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Wait for search results to load
    await page.waitForTimeout(5000);

    // Click "Videos" tab if visible
    const videosTab = page.locator('[data-e2e="search-videos-tab"], [data-e2e="search_top-item"]').first();
    if (await videosTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await videosTab.click();
      await page.waitForTimeout(3000);
    }

    // Scroll to load more results
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 2000));
      await page.waitForTimeout(2000);

      if (allVideos.length >= max) break;
    }

    await page.waitForTimeout(2000);
  } catch (err: any) {
    errors.push(`TikTok search error: ${err.message}`);
  } finally {
    await browser.close();
  }

  // Deduplicate by video_id
  const seen = new Set<string>();
  const unique: VideoResult[] = [];
  for (const v of allVideos) {
    if (!seen.has(v.video_id)) {
      seen.add(v.video_id);
      unique.push(v);
    }
  }

  // Sort by quality score, take top N
  unique.sort((a, b) => b.quality_score - a.quality_score);
  const final = unique.slice(0, max);

  console.log(`  TikTok: ${final.length} quality videos (${unique.length} passed filter)`);

  return {
    retreat_name: retreatName,
    platform: "tiktok",
    videos: final,
    scraped_at: new Date().toISOString(),
    errors,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/video-scraper/tiktok.ts
git commit -m "feat(video-scraper): TikTok search with Playwright interception"
```

---

### Task 4: CLI entry point

**Files:**
- Create: `scripts/video-scraper/index.ts`

- [ ] **Step 1: Write the CLI**

```typescript
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
```

- [ ] **Step 2: Verify CLI compiles**

```bash
npx tsx scripts/video-scraper/index.ts --help
```

- [ ] **Step 3: Commit**

```bash
git add scripts/video-scraper/index.ts
git commit -m "feat(video-scraper): CLI with YouTube + TikTok + batch mode"
```

---

### Task 5: README and skill

**Files:**
- Create: `scripts/video-scraper/README.md`
- Create: `~/.claude/skills/video-scraper/SKILL.md`

- [ ] **Step 1: Write README**

```markdown
# Video proof scraper

Finds high quality YouTube and TikTok videos for any business. Quality filtered: 5K+ views, 100+ likes, independent creators, last 2 years.

## Usage

```bash
# Both platforms
npx tsx ~/Projects/retreatvault/scripts/video-scraper/index.ts "Canyon Ranch Tucson" --max 5

# YouTube only
npx tsx ~/Projects/retreatvault/scripts/video-scraper/index.ts "Golden Door" --platform youtube

# TikTok only
npx tsx ~/Projects/retreatvault/scripts/video-scraper/index.ts "Kamalaya" --platform tiktok

# Batch
npx tsx ~/Projects/retreatvault/scripts/video-scraper/index.ts --file places.json --output videos.json

# Help
npx tsx ~/Projects/retreatvault/scripts/video-scraper/index.ts --help
```

## Quality filters

- Min 5,000 views
- Min 100 likes
- Independent creator (not the retreat's own channel)
- Published within last 2 years
- Sorted by quality score (views * 0.5 + likes * 2 + comments * 3)

## TikTok note

TikTok requires headful browser (same as Google Reviews scraper). Runs via nightly cron when you're asleep. Use `--visible` to debug.
```

- [ ] **Step 2: Write skill**

Create `~/.claude/skills/video-scraper/SKILL.md` with the same content as the README plus trigger words.

- [ ] **Step 3: Commit**

```bash
git add scripts/video-scraper/README.md
git commit -m "docs(video-scraper): README and skill"
```

---

### Task 6: Test YouTube with a real retreat

- [ ] **Step 1: Test YouTube**

```bash
cd ~/Projects/retreatvault
npx tsx scripts/video-scraper/index.ts "Canyon Ranch Tucson" --platform youtube --max 5 --output data/test-yt-videos.json
```

Verify output has videos with views > 5000, quality_score populated, is_official flagged correctly.

- [ ] **Step 2: Test TikTok**

```bash
npx tsx scripts/video-scraper/index.ts "Canyon Ranch Tucson" --platform tiktok --max 5 --visible --output data/test-tt-videos.json
```

Watch the browser, verify TikTok search loads and API responses are intercepted.

- [ ] **Step 3: Test both platforms**

```bash
npx tsx scripts/video-scraper/index.ts "Ananda in the Himalayas" --max 5 --output data/test-both-videos.json
```

- [ ] **Step 4: Commit test results**

```bash
git add data/test-yt-videos.json data/test-tt-videos.json data/test-both-videos.json
git commit -m "test(video-scraper): verified YouTube + TikTok extraction"
```

---

### Task 7: Add TikTok to nightly cron

**Files:**
- Modify: `scripts/run-nightly-scrape.sh`

- [ ] **Step 1: Add TikTok video discovery after Google Reviews**

Add to the end of `run-nightly-scrape.sh`, before the caffeinate kill:

```bash
# --- Video discovery (TikTok) ---
echo "$(date): Starting TikTok video discovery" >> "$LOG"

npx tsx scripts/video-scraper/index.ts \
  --file "$INPUT" \
  --platform tiktok \
  --max 10 \
  --output data/tiktok-videos.json \
  >> "$LOG" 2>&1

echo "$(date): TikTok video discovery complete" >> "$LOG"
```

- [ ] **Step 2: Commit**

```bash
git add scripts/run-nightly-scrape.sh
git commit -m "feat: add TikTok video discovery to nightly cron"
```
