# Rating Enrichment

`enrich_unrated.py` attempts to fill in missing ratings for the 4,893
retreats in `retreats-without-ratings.json` by scraping public web search
results — no API keys required.

## How it works

1. Loads `retreats-without-ratings.json`.
2. For each retreat, queries DuckDuckGo HTML search
   (`https://html.duckduckgo.com/html/`) with
   `"<name> <city> reviews"`.
3. Categorizes the result links by domain and tries them in this order:
   1. Google Maps / Places (snippet pattern `4.8 (123)` or `4.8 · 123 reviews`)
   2. TripAdvisor (snippet first, then page JSON-LD `aggregateRating`)
   3. Facebook page rating
   4. Yelp (only for US-based retreats)
   5. Falls back to scanning *any* result snippet
   6. Finally fetches the retreat's own `website_url` and looks for
      schema.org `aggregateRating` JSON-LD
4. Normalizes ratings to a 1–5 scale (10-point scales are halved).
5. Saves a checkpoint to `enrichment-progress.json` every 10 retreats so
   the run can be resumed safely.
6. Writes the final result to `retreats-enriched-ratings.json`.

## Running it

```bash
cd /Users/waldman/wellness-retreat-directory/data
python3 -m pip install requests beautifulsoup4
python3 enrich_unrated.py
```

The script is **resumable**: if you stop it (Ctrl-C) and re-run, it will
skip retreats already present in `enrichment-progress.json`.

## Politeness / runtime

- Random 2.0–3.5 s delay between every request.
- Multiple requests per retreat (search + occasional page fetches), so
  expect roughly **5–10 seconds per retreat** on average.
- For ~4,900 retreats that's **8–14 hours** of wall time. Run it
  overnight or in `tmux` / `screen`.

## Output schema

Each row in `retreats-enriched-ratings.json` is the original retreat dict
plus:

| field               | type            | meaning                              |
|---------------------|-----------------|--------------------------------------|
| `rating`            | float \| null   | normalized 1–5 rating                |
| `review_count`      | int \| null     | number of reviews if found          |
| `rating_source`     | str \| null     | `google`, `tripadvisor`, `facebook`, `yelp`, `website`, `search-snippet` |
| `rating_source_url` | str \| null     | URL the rating was extracted from   |
| `rating_raw`        | str \| null     | raw matched text (debug)            |

Rows where nothing could be found will have `rating: null`.

## Expectations

DuckDuckGo HTML scraping is best-effort and rate-limited from their side.
Realistically you can expect to enrich somewhere between **30–60%** of
retreats — many small wellness venues simply don't have ratings on the
big aggregators. Re-running later (after the cache file is wiped) may
pick up additional ones.

If DuckDuckGo starts returning empty results for a stretch, the IP is
likely being throttled — pause for an hour and resume.
