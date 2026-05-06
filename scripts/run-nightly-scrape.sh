#!/bin/bash
# Nightly Google Reviews scraper — runs headful Chrome while you sleep.
# Caffeinate keeps the Mac awake. Logs everything.
#
# Install: crontab -e → add this line (11pm Israel = 20:00 UTC):
#   0 20 * * * /Users/waldman/Projects/retreatvault/scripts/run-nightly-scrape.sh
#
# Or run manually:
#   ./scripts/run-nightly-scrape.sh

set -e

DIR="/Users/waldman/Projects/retreatvault"
LOG="$DIR/data/scraper-$(date +%Y%m%d).log"
INPUT="$DIR/data/remaining-retreats.json"
OUTPUT="$DIR/data/remaining-reviews.json"

echo "$(date): Starting nightly scrape" >> "$LOG"

# Check if there are retreats left to scrape
REMAINING=$(python3 -c "import json; print(len(json.load(open('$INPUT'))))" 2>/dev/null || echo "0")
if [ "$REMAINING" = "0" ]; then
  echo "$(date): No remaining retreats to scrape. Done." >> "$LOG"
  exit 0
fi

echo "$(date): $REMAINING retreats remaining" >> "$LOG"

# Caffeinate: keep Mac awake for 8 hours (28800 seconds), kill when scraper finishes
caffeinate -dimsu -t 28800 &
CAFFEINE_PID=$!

cd "$DIR"

# Run the scraper — headful but user is asleep so windows don't matter
npx tsx scripts/google-reviews-scraper/index.ts \
  --file "$INPUT" \
  --max 50 \
  --output "$OUTPUT" \
  >> "$LOG" 2>&1

# After scraping, update remaining list (remove scraped retreats)
python3 -c "
import json
scraped = json.load(open('$OUTPUT'))
scraped_ids = {r.get('retreat_id', '') for r in scraped if r.get('total_reviews_found', 0) > 0}
remaining = json.load(open('$INPUT'))
still_remaining = [r for r in remaining if r['id'] not in scraped_ids]
json.dump(still_remaining, open('$INPUT', 'w'), indent=2)
print(f'Scraped: {len(scraped_ids)}, Still remaining: {len(still_remaining)}')
" >> "$LOG" 2>&1

# Kill caffeinate
kill $CAFFEINE_PID 2>/dev/null

echo "$(date): Nightly scrape complete" >> "$LOG"
