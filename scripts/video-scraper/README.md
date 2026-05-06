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
