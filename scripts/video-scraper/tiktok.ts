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
