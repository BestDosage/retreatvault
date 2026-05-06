// scripts/video-scraper/youtube.ts

import type { VideoResult, ScrapeOptions, VideoScrapeResult } from "./types";
import { passesQualityFilter, isOfficialChannel, computeQualityScore } from "./quality-filter";

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
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
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
