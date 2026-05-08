#!/bin/bash
# Nightly Google Reviews scraper — 4 parallel browser instances
# Runs 11pm-6am, 4x throughput

set -e
export PATH="/Users/waldman/.nvm/versions/node/v24.14.0/bin:$PATH"

DIR="/Users/waldman/Projects/retreatvault"
LOG="$DIR/data/scraper-$(date +%Y%m%d).log"

echo "$(date): Starting nightly scrape (4 parallel agents)" >> "$LOG"

caffeinate -dimsu -t 28800 &
CAFFEINE_PID=$!

cd "$DIR"

# Run 4 chunks in parallel
for i in 1 2 3 4; do
  INPUT="$DIR/data/remaining-chunk-${i}.json"
  OUTPUT="$DIR/data/reviews-chunk-${i}.json"

  REMAINING=$(python3 -c "import json; print(len(json.load(open('$INPUT'))))" 2>/dev/null || echo "0")
  if [ "$REMAINING" = "0" ]; then
    echo "$(date): Chunk $i empty, skipping" >> "$LOG"
    continue
  fi

  echo "$(date): Starting chunk $i ($REMAINING retreats)" >> "$LOG"

  npx tsx scripts/google-reviews-scraper/index.ts \
    --file "$INPUT" \
    --max 30 \
    --output "$OUTPUT" \
    >> "$DIR/data/scraper-chunk-${i}-$(date +%Y%m%d).log" 2>&1 &

  echo "$(date): Chunk $i launched (PID $!)" >> "$LOG"
  sleep 5
done

wait

echo "$(date): All chunks complete, merging..." >> "$LOG"

python3 -c "
import json, glob, os

all_results = []
for f in sorted(glob.glob('$DIR/data/reviews-chunk-*.json')):
    try: all_results.extend(json.load(open(f)))
    except: pass

scraped_ids = {r.get('retreat_id', '') for r in all_results if r.get('total_reviews_found', 0) > 0}
print(f'Total scraped with reviews: {len(scraped_ids)}')

for i in range(1, 5):
    cf = f'$DIR/data/remaining-chunk-{i}.json'
    try:
        chunk = json.load(open(cf))
        remaining = [r for r in chunk if r['id'] not in scraped_ids]
        json.dump(remaining, open(cf, 'w'), indent=2)
        print(f'Chunk {i}: {len(chunk) - len(remaining)} done, {len(remaining)} left')
    except: pass

# Append to master reviews file
master = '$DIR/data/remaining-reviews.json'
existing = []
if os.path.exists(master):
    try: existing = json.load(open(master))
    except: pass
existing.extend(all_results)
json.dump(existing, open(master, 'w'), indent=2)
print(f'Master file: {len(existing)} total reviews')
" >> "$LOG" 2>&1

kill $CAFFEINE_PID 2>/dev/null
echo "$(date): Nightly scrape complete" >> "$LOG"
