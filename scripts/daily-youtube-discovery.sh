#!/bin/bash
# Daily YouTube video discovery for RetreatvVault
# Runs 50 retreats per day (YouTube API free tier limit)
# Set up via crontab: 0 8 * * * /Users/waldman/Projects/retreatvault/scripts/daily-youtube-discovery.sh

cd /Users/waldman/Projects/retreatvault

# Log file with date
LOG="data/youtube-log-$(date +%Y-%m-%d).txt"

echo "=== YouTube Discovery $(date) ===" >> "$LOG"
/Users/waldman/.nvm/versions/node/v24.14.0/bin/npx tsx scripts/discover-youtube-videos.ts 9500 --insert >> "$LOG" 2>&1
echo "=== Done $(date) ===" >> "$LOG"
