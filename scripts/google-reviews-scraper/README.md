# Google Reviews Scraper

Extracts full review text from Google Maps for any business. Built for RetreatVault, works with any project.

## Setup

```bash
npm install rebrowser-playwright
npx rebrowser-playwright install chromium
```

## Usage

```bash
# Single place by Place ID
npx tsx scripts/google-reviews-scraper/index.ts ChIJN1t_tDeuEmsRUsoyG83frY4

# Single place by URL
npx tsx scripts/google-reviews-scraper/index.ts "https://www.google.com/maps/place/..." --max 50

# Batch from file (JSON array of {id, name, place_id})
npx tsx scripts/google-reviews-scraper/index.ts --file data/place-ids.json --max 100 --output data/reviews.json

# Visible browser (for debugging)
npx tsx scripts/google-reviews-scraper/index.ts ChIJ... --visible

# With residential proxy
npx tsx scripts/google-reviews-scraper/index.ts ChIJ... --proxy http://user:pass@host:port
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--max <n>` | 100 | Max reviews per place. 0 = all. |
| `--delay <ms>` | 1500 | Scroll delay between loads |
| `--proxy <url>` | none | HTTP proxy URL |
| `--visible` | false | Show browser window |
| `--output <path>` | stdout | Save results to JSON file |
| `--file <path>` | none | Batch mode — JSON file with place data |

## When it breaks

Google changes their DOM class names periodically. When the scraper stops extracting data:

1. Open any Google Maps place page in a real browser
2. Right-click a review → Inspect
3. Update the selectors in `selectors.ts`
4. That's it — nothing else needs to change

## Using in other projects

Copy or symlink the `scripts/google-reviews-scraper/` directory into any project. Only dependency is `rebrowser-playwright`.
