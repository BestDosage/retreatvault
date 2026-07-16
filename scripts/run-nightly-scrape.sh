#!/bin/bash
# Nightly Google Reviews scraper — sequential, 1am-5am IST window
# Stops gracefully at 5am to free the machine during the day

export PATH="/Users/waldman/.nvm/versions/node/v24.14.0/bin:$PATH"

DIR="/Users/waldman/Projects/retreatvault"
LOG="$DIR/data/scraper-$(date +%Y%m%d).log"
STOP_HOUR=5  # Stop at 5am

echo "$(date): Starting nightly scrape (sequential, stop at ${STOP_HOUR}:00)" >> "$LOG"

caffeinate -dimsu -t 28800 &
CAFFEINE_PID=$!
trap 'kill $CAFFEINE_PID 2>/dev/null; wait $CAFFEINE_PID 2>/dev/null' EXIT

cd "$DIR"

# Run chunks sequentially — parallel browsers get Killed:9 by macOS
for i in 1 2 3 4; do
  # Check if past stop time (7am)
  CURRENT_HOUR=$(date +%H)
  if [ "$CURRENT_HOUR" -ge "$STOP_HOUR" ] && [ "$CURRENT_HOUR" -lt 24 ]; then
    echo "$(date): Past ${STOP_HOUR}:00, stopping for the day" >> "$LOG"
    break
  fi

  INPUT="$DIR/data/remaining-chunk-${i}.json"
  OUTPUT="$DIR/data/reviews-chunk-${i}.json"

  REMAINING=$(python3 -c "import json; print(len(json.load(open('$INPUT'))))" 2>/dev/null || echo "0")
  if [ "$REMAINING" = "0" ]; then
    echo "$(date): Chunk $i empty, skipping" >> "$LOG"
    continue
  fi

  echo "$(date): Starting chunk $i ($REMAINING retreats)" >> "$LOG"

  # Run scraper in background so we can monitor the clock
  npx tsx scripts/google-reviews-scraper/index.ts \
    --file "$INPUT" \
    --max 30 \
    --output "$OUTPUT" \
    >> "$DIR/data/scraper-chunk-${i}-$(date +%Y%m%d).log" 2>&1 &
  SCRAPER_PID=$!

  # Wait for scraper but check clock every 60s
  while kill -0 $SCRAPER_PID 2>/dev/null; do
    CURRENT_HOUR=$(date +%H)
    if [ "$CURRENT_HOUR" -ge "$STOP_HOUR" ] && [ "$CURRENT_HOUR" -lt 24 ]; then
      echo "$(date): 5am cutoff — killing chunk $i (PID $SCRAPER_PID)" >> "$LOG"
      kill $SCRAPER_PID 2>/dev/null
      sleep 2
      kill -9 $SCRAPER_PID 2>/dev/null
      break
    fi
    sleep 60
  done

  wait $SCRAPER_PID 2>/dev/null
  EXIT_CODE=$?
  echo "$(date): Chunk $i finished (exit=$EXIT_CODE)" >> "$LOG"

  # Break out of chunk loop if we hit the time limit
  CURRENT_HOUR=$(date +%H)
  if [ "$CURRENT_HOUR" -ge "$STOP_HOUR" ] && [ "$CURRENT_HOUR" -lt 24 ]; then
    break
  fi

  sleep 10
done

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

echo "$(date): Nightly scrape complete" >> "$LOG"
