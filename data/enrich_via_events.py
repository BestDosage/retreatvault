"""
Enrich Unrated Retreats via Retreat.guru Events
=================================================
Many Retreat.guru centers have no rating on the center page itself,
but the individual events at those centers often do have ratings/reviews.

Strategy:
1. Fetch the events sitemap once → build a center_id → [event_urls] index
2. For each unrated center, look up its events
3. Scrape each event for aggregateRating data
4. Take the highest review-count rating found and assign it to the center

Output: retreats-enriched-via-events.json
"""

import json
import re
import time
import sys
import xml.etree.ElementTree as ET
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from collections import defaultdict

EVENTS_SITEMAP = "https://retreat.guru/sitemaps/event"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}
DELAY = 1.0  # 1s between requests


def get_center_id(url):
    """Extract center ID from a center or event URL."""
    m = re.search(r"/(?:centers|events)/(\d+)-", url)
    return int(m.group(1)) if m else None


def build_event_index():
    """Fetch the events sitemap and group event URLs by center_id."""
    print(f"Fetching events sitemap: {EVENTS_SITEMAP}")
    resp = requests.get(EVENTS_SITEMAP, headers=HEADERS, timeout=60)
    resp.raise_for_status()

    root = ET.fromstring(resp.content)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [loc.text for loc in root.findall(".//sm:loc", ns) if loc.text]

    print(f"Found {len(urls)} event URLs")

    # Group by center_id
    index = defaultdict(list)
    for url in urls:
        cid = get_center_id(url)
        if cid:
            index[cid].append(url)

    print(f"Indexed {len(index)} unique centers with events")
    return index


def extract_rating_from_event(url):
    """Visit an event page and extract aggregateRating if present."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
    except Exception:
        return None

    soup = BeautifulSoup(resp.text, "html.parser")

    # Look in JSON-LD scripts
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string)
        except (json.JSONDecodeError, TypeError):
            continue

        items = data if isinstance(data, list) else [data]
        for item in items:
            if not isinstance(item, dict):
                continue
            agg = item.get("aggregateRating")
            if isinstance(agg, dict):
                rating = agg.get("ratingValue")
                count = agg.get("ratingCount") or agg.get("reviewCount") or 0
                if rating:
                    try:
                        return {
                            "rating": float(rating),
                            "review_count": int(count) if count else 0,
                            "source": "retreatguru_event",
                            "source_url": url,
                        }
                    except (ValueError, TypeError):
                        continue

    return None


def enrich_center(retreat, event_index):
    """Try to find a rating for this center via its events."""
    cid = get_center_id(retreat.get("source_url", ""))
    if cid is None or cid not in event_index:
        return None

    events = event_index[cid]
    # Limit: don't spam — try up to 5 events per center
    events_to_check = events[:5]

    best_rating = None
    for event_url in events_to_check:
        result = extract_rating_from_event(event_url)
        if result:
            if best_rating is None or result["review_count"] > best_rating["review_count"]:
                best_rating = result
        time.sleep(DELAY)

    return best_rating


def main():
    # Load unrated retreats
    print("Loading unrated retreats...")
    with open("retreats-without-ratings.json") as f:
        retreats = json.load(f)

    # Filter to retreat.guru only (these are the ones we can enrich)
    rg_retreats = [r for r in retreats if r.get("source") == "retreatguru"]
    print(f"Loaded {len(rg_retreats)} unrated Retreat.guru centers")

    # Optional limit for testing
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else len(rg_retreats)
    rg_retreats = rg_retreats[:limit]
    print(f"Processing {len(rg_retreats)} centers")

    # Build event index
    event_index = build_event_index()

    # Save event index for debugging
    with open("event-index.json", "w") as f:
        json.dump({str(k): v for k, v in event_index.items()}, f)
    print(f"Saved event index ({sum(len(v) for v in event_index.values())} events)")

    # Process each unrated center
    enriched = []
    found_count = 0
    no_events_count = 0

    for i, r in enumerate(rg_retreats):
        cid = get_center_id(r.get("source_url", ""))
        events_for_center = event_index.get(cid, [])

        if not events_for_center:
            no_events_count += 1
            continue

        result = enrich_center(r, event_index)
        if result:
            enriched_record = {
                **r,
                "rating": result["rating"],
                "review_count": result["review_count"],
                "rating_source": result["source"],
                "rating_source_url": result["source_url"],
                "enriched_at": datetime.utcnow().isoformat(),
            }
            enriched.append(enriched_record)
            found_count += 1
            print(f"[{i+1}/{len(rg_retreats)}] ✓ {r['name'][:50]} — {result['rating']}/5 ({result['review_count']} reviews)")
        else:
            print(f"[{i+1}/{len(rg_retreats)}] ✗ {r['name'][:50]} — no rating found in {len(events_for_center)} events")

        # Save progress every 50 records
        if (i + 1) % 50 == 0:
            with open("retreats-enriched-via-events.json", "w") as f:
                json.dump(enriched, f, indent=2)
            print(f"  -- Progress saved ({found_count} ratings found so far) --")

    # Final save
    with open("retreats-enriched-via-events.json", "w") as f:
        json.dump(enriched, f, indent=2)

    print(f"\n=== Done ===")
    print(f"Processed: {len(rg_retreats)}")
    print(f"Centers with no events on Retreat.guru: {no_events_count}")
    print(f"Ratings found: {found_count}")
    print(f"Saved to retreats-enriched-via-events.json")


if __name__ == "__main__":
    main()
