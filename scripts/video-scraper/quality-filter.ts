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
