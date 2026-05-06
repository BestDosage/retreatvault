# Video proof scraper — design spec

## Goal

Reusable CLI tool that discovers high quality YouTube and TikTok videos for any business. Powers the "See it for yourself" section on RetreatVault retreat profiles. Same architecture as the Google Reviews scraper — works across all projects.

## Platforms

YouTube (upgrade existing script) + TikTok (build new). No Instagram.

## Quality filters (same for both platforms)

| Filter | Threshold |
|--------|-----------|
| Min views | 5,000 |
| Min likes | 100 |
| Creator size | No minimum |
| Must be | Independent (not the retreat's own account) |
| Recency | Last 2 years |
| Exclude | Ads, reposts, slideshows, under 720p |
| Bonus signal | Retreat commented or responded |

## Architecture

### YouTube (upgrade existing)

The `discover-youtube-videos.ts` script already searches YouTube Data API v3 and stores results in Supabase. Upgrade it:

1. Add quality filtering — check view_count, like_count against thresholds before inserting
2. Add independent channel detection — compare channel name to retreat name, flag as `is_official`
3. Add recency filter — only videos published in the last 2 years
4. Add engagement metrics to the Supabase record (views, likes, comment count)

YouTube Data API is free (10,000 units/day, each search = 100 units). Already have `YOUTUBE_API_KEY` in `.env.local`. The daily cron (`daily-youtube-discovery.sh`) already runs this at 8am.

### TikTok (build new)

Same HTTP interception approach as the Google Reviews scraper:

1. Open TikTok in Playwright (headful, same as Google scraper)
2. Search for retreat name
3. Intercept the API response containing video metadata (views, likes, shares, creator info)
4. Apply quality filter
5. Extract: video URL, embed URL, thumbnail, title/description, creator handle, metrics
6. Store in Supabase

TikTok embed URL format: `https://www.tiktok.com/embed/v2/{VIDEO_ID}`

Runs via nightly cron (headful, user is asleep).

### Quality filter module

Shared logic used by both YouTube and TikTok scrapers:

```typescript
interface VideoCandidate {
  views: number;
  likes: number;
  published_date: string;
  creator_name: string;
  retreat_name: string;
  is_ad: boolean;
  is_repost: boolean;
  resolution?: number;
}

function passesQualityFilter(video: VideoCandidate): boolean {
  if (video.views < 5000) return false;
  if (video.likes < 100) return false;
  if (video.is_ad || video.is_repost) return false;
  if (video.resolution && video.resolution < 720) return false;

  // Recency: last 2 years
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  if (new Date(video.published_date) < twoYearsAgo) return false;

  return true;
}

function isOfficialChannel(creatorName: string, retreatName: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalize(creatorName).includes(normalize(retreatName)) ||
         normalize(retreatName).includes(normalize(creatorName));
}
```

## File structure

```
scripts/video-scraper/
├── index.ts          # CLI entry point (--platform youtube|tiktok|both)
├── youtube.ts        # YouTube Data API search + quality filter
├── tiktok.ts         # TikTok search via Playwright interception
├── quality-filter.ts # Shared filter logic
├── types.ts          # Shared interfaces
├── README.md         # Usage docs
```

## CLI interface

```bash
# Single retreat, both platforms
npx tsx scripts/video-scraper/index.ts "Canyon Ranch Tucson" --max 10

# YouTube only
npx tsx scripts/video-scraper/index.ts "Golden Door" --platform youtube --max 5

# TikTok only
npx tsx scripts/video-scraper/index.ts "Kamalaya Koh Samui" --platform tiktok --max 5

# Batch from file
npx tsx scripts/video-scraper/index.ts --file data/retreats-batch.json --platform both --max 10 --output data/videos.json
```

## Output format

```json
{
  "retreat_name": "Canyon Ranch Tucson",
  "videos": [
    {
      "platform": "youtube",
      "video_id": "dQw4w9WgXcQ",
      "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "embed_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "thumbnail_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "title": "My week at Canyon Ranch - honest review",
      "creator_name": "WellnessWithSarah",
      "creator_url": "https://www.youtube.com/@WellnessWithSarah",
      "views": 45000,
      "likes": 1200,
      "comments": 89,
      "published_date": "2025-11-15",
      "is_official": false,
      "retreat_commented": false,
      "duration_seconds": 912
    }
  ]
}
```

## Storage

Use existing Supabase `retreat_videos` table (already exists). Add columns if missing:
- `platform` (youtube, tiktok)
- `views`, `likes`, `comments`
- `is_official` (boolean)
- `retreat_commented` (boolean)
- `embed_url`
- `thumbnail_url`
- `quality_score` (computed: views * 0.5 + likes * 2 + comments * 3, for sorting)

## Cron schedule

Add TikTok discovery to the existing nightly scrape script:

```
0 20 * * * ~/Projects/retreatvault/scripts/run-nightly-scrape.sh  # Google reviews (existing)
0 8 * * *  ~/Projects/retreatvault/scripts/daily-youtube-discovery.sh  # YouTube (existing, upgrade)
```

TikTok runs as part of the nightly scrape (after Google reviews finish, same browser session pattern).

## Skill

Create `~/.claude/skills/video-scraper/SKILL.md` so you can say "find videos for Ananda" from any project.

## What this does NOT include

- Instagram scraping (embeds unreliable, Meta API hostile)
- Video downloading or hosting (we embed, not host)
- Transcript extraction (separate feature, already discussed for Guest Intelligence)
- Automated content moderation (manual curation for now)

## Dependencies

- `playwright` (already installed for Google Reviews scraper)
- YouTube Data API key (already have in `.env.local`)
- No TikTok API key needed (HTTP interception, same as Google approach)
