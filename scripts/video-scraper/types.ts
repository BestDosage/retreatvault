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
