"""
Google Places API Enrichment
============================
For each unrated retreat, search Google Places for the retreat by name + city,
extract the rating + review count + a few additional fields, and save.

Uses the Places API (New) v1 endpoints:
- searchText: find place by name + location
- get place details: rating, reviews, etc.

Cost: ~$0.017 per retreat (Text Search Pro SKU)
4,893 retreats × $0.017 = ~$83 total

Resume: progress saved every 25 retreats; restart picks up where it stopped.

Output: retreats-google-enriched.json
"""

import json
import os
import sys
import time
from datetime import datetime
import requests

# Load .env.local
ENV_PATH = os.path.join(os.path.dirname(__file__), "..", ".env.local")
env = {}
with open(ENV_PATH) as f:
    for line in f:
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()

API_KEY = env.get("GOOGLE_PLACES_API_KEY", "")
if not API_KEY:
    print("ERROR: GOOGLE_PLACES_API_KEY not in .env.local")
    sys.exit(1)

SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
DELAY = 0.1  # 10 req/sec is well within Google's limits

# Field mask — only request what we need to keep cost down
FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.rating",
    "places.userRatingCount",
    "places.priceLevel",
    "places.websiteUri",
    "places.googleMapsUri",
    "places.editorialSummary",
    "places.internationalPhoneNumber",
    "places.types",
])


def search_place(name, city, country):
    """Search Google Places for a retreat by name + location."""
    query_parts = [name]
    if city:
        query_parts.append(city)
    if country and country.lower() not in (city or "").lower():
        query_parts.append(country)
    text_query = " ".join(query_parts)

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
    }
    body = {
        "textQuery": text_query,
        "maxResultCount": 1,
    }

    try:
        resp = requests.post(SEARCH_URL, headers=headers, json=body, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        places = data.get("places", [])
        if not places:
            return None
        return places[0]
    except requests.HTTPError as e:
        return {"_error": f"HTTP {e.response.status_code}: {e.response.text[:200]}"}
    except Exception as e:
        return {"_error": str(e)}


def main():
    # Load unrated retreats
    print("Loading unrated retreats...")
    with open("retreats-without-ratings.json") as f:
        retreats = json.load(f)
    print(f"Loaded {len(retreats)} unrated retreats")

    # Optional limit
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else len(retreats)
    retreats = retreats[:limit]
    print(f"Processing {len(retreats)} retreats")

    # Resume support
    progress_path = "places-progress.json"
    enriched = []
    already_done = set()
    if os.path.exists(progress_path):
        with open(progress_path) as f:
            enriched = json.load(f)
        already_done = {r.get("source_url", r.get("slug", "")) for r in enriched}
        print(f"Resuming: {len(enriched)} already processed")

    found_count = sum(1 for r in enriched if r.get("rating"))
    error_count = 0

    for i, r in enumerate(retreats):
        key = r.get("source_url", r.get("slug", ""))
        if key in already_done:
            continue

        place = search_place(r["name"], r.get("city", ""), r.get("country", ""))

        if place and not place.get("_error"):
            rating = place.get("rating")
            review_count = place.get("userRatingCount", 0)
            location = place.get("location", {})
            display_name = place.get("displayName", {})
            if isinstance(display_name, dict):
                display_name = display_name.get("text", "")

            enriched_record = {
                **r,
                "rating": rating,
                "review_count": review_count,
                "google_place_id": place.get("id"),
                "google_display_name": display_name,
                "google_formatted_address": place.get("formattedAddress"),
                "google_lat": location.get("latitude"),
                "google_lng": location.get("longitude"),
                "google_website": place.get("websiteUri"),
                "google_maps_uri": place.get("googleMapsUri"),
                "google_phone": place.get("internationalPhoneNumber"),
                "google_types": place.get("types", []),
                "rating_source": "google_places",
                "enriched_at": datetime.utcnow().isoformat(),
            }
            enriched.append(enriched_record)
            if rating:
                found_count += 1
                print(f"[{i+1}/{len(retreats)}] ✓ {r['name'][:50]} — {rating}/5 ({review_count} reviews)")
            else:
                print(f"[{i+1}/{len(retreats)}] ⚬ {r['name'][:50]} — found but no rating")
        else:
            err = place.get("_error", "no_match") if place else "no_match"
            enriched.append({**r, "rating_source": "google_places", "enriched_at": datetime.utcnow().isoformat(), "_error": err})
            if "_error" in (place or {}):
                error_count += 1
                print(f"[{i+1}/{len(retreats)}] ✗ {r['name'][:50]} — {err}")
            else:
                print(f"[{i+1}/{len(retreats)}] - {r['name'][:50]} — no match")

        # Save progress periodically
        if (i + 1) % 25 == 0:
            with open(progress_path, "w") as f:
                json.dump(enriched, f, indent=2)
            print(f"  -- saved ({found_count} found, {error_count} errors) --")

        time.sleep(DELAY)

    # Final save
    with open(progress_path, "w") as f:
        json.dump(enriched, f, indent=2)
    with open("retreats-google-enriched.json", "w") as f:
        json.dump(enriched, f, indent=2)

    print(f"\n=== Done ===")
    print(f"Processed: {len(retreats)}")
    print(f"Ratings found: {found_count}")
    print(f"Errors: {error_count}")
    print(f"Saved to retreats-google-enriched.json")


if __name__ == "__main__":
    main()
