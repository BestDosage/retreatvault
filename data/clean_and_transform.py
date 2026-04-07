"""
Clean & Transform Scraped Retreat Data
=======================================
Takes raw JSON from both scrapers, cleans/filters/deduplicates,
and outputs retreat records ready for WRD scoring and Supabase seeding.

Usage: python3 clean_and_transform.py

Input:  bookretreats-raw.json, retreatguru-raw.json
Output: retreats-cleaned.json (ready for scoring + seeding)
        retreats-rejected.json (filtered out, with reasons)
"""

import json
import re
import uuid
from datetime import datetime
from difflib import SequenceMatcher

# Existing retreat slugs to skip (loaded from project data files)
EXISTING_SLUGS_FILE = "../src/data/existing-slugs.json"


def slugify(text):
    """Convert text to URL-safe slug."""
    text = text.lower().strip()
    text = re.sub(r"[''`]", "", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def similar(a, b):
    """Check name similarity ratio."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def extract_retreat_name(raw_name):
    """Extract the core retreat/center name from a listing title.
    BookRetreats titles are like '7 Day Yoga Retreat at Villa Serenity in Bali'
    We want 'Villa Serenity' or just clean the name.
    """
    # For retreat.guru, names are already the center name
    # For bookretreats, try to extract the venue name
    # Pattern: "X Day ... at/in [Venue Name] in [Location]"
    # This is hard to do generically, so we keep the full title and use it as-is
    return raw_name.strip()


def map_country_to_region(country):
    """Map country name to our region categories."""
    country_lower = country.lower().strip() if country else ""

    usa_patterns = [
        "united states", "usa", "us", "america",
        "california", "new york", "florida", "texas", "colorado",
        "arizona", "hawaii", "oregon", "washington", "virginia",
        "massachusetts", "connecticut", "vermont", "montana",
        "pennsylvania", "north carolina", "south carolina",
        "georgia", "tennessee", "new mexico", "utah", "maine",
        "wyoming", "idaho", "minnesota", "wisconsin", "michigan",
        "ohio", "illinois", "missouri", "indiana", "iowa",
        "kentucky", "maryland", "new jersey", "new hampshire",
        "rhode island", "delaware", "west virginia", "nebraska",
        "kansas", "oklahoma", "arkansas", "mississippi", "alabama",
        "louisiana", "south dakota", "north dakota", "alaska",
    ]
    if any(p in country_lower for p in usa_patterns):
        return "USA"

    canada_patterns = ["canada", "british columbia", "ontario", "quebec", "alberta"]
    if any(p in country_lower for p in canada_patterns):
        return "Canada"

    mexico_patterns = ["mexico", "méxico", "tulum", "cancun", "oaxaca", "sayulita"]
    if any(p in country_lower for p in mexico_patterns):
        return "Mexico"

    europe_countries = [
        "united kingdom", "uk", "england", "scotland", "wales", "ireland",
        "france", "spain", "italy", "portugal", "germany", "austria",
        "switzerland", "netherlands", "belgium", "greece", "croatia",
        "turkey", "sweden", "norway", "denmark", "finland", "iceland",
        "czech", "poland", "hungary", "romania", "bulgaria", "montenegro",
        "slovenia", "cyprus", "malta",
    ]
    if any(c in country_lower for c in europe_countries):
        return "Europe"

    asia_countries = [
        "thailand", "bali", "indonesia", "india", "sri lanka", "japan",
        "vietnam", "cambodia", "laos", "myanmar", "nepal", "bhutan",
        "china", "korea", "philippines", "malaysia", "singapore",
        "maldives", "oman", "uae", "dubai", "morocco",
    ]
    if any(c in country_lower for c in asia_countries):
        return "Asia"

    # Central/South America, Caribbean, Africa, Oceania → group as "Other" for now
    return "Other"


def estimate_per_night_price(price_min, price_max, duration_days):
    """Convert total retreat price to per-night estimate."""
    if not price_min or not duration_days or duration_days <= 1:
        return None, None
    nights = max(duration_days - 1, 1)
    per_night_min = round(price_min / nights)
    per_night_max = round((price_max or price_min) / nights)
    return per_night_min, per_night_max


def clean_bookretreats(raw_data):
    """Clean and normalize BookRetreats data."""
    cleaned = []
    for r in raw_data:
        name = r.get("name", "").strip()
        if not name:
            continue

        # Get image URL
        hero = r.get("hero_image")
        if isinstance(hero, dict):
            hero = hero.get("url") or hero.get("@id", "")
        if not hero:
            continue  # Must have image

        rating = r.get("rating")
        review_count = r.get("review_count", 0)

        # Extract location from name (pattern: "... in Location, Country")
        location_match = re.search(r" in (.+?)$", name)
        location_text = location_match.group(1) if location_match else r.get("location_text", "")

        # Try to parse country from location text
        country = ""
        city = ""
        if location_text:
            parts = [p.strip() for p in location_text.split(",")]
            if len(parts) >= 2:
                city = parts[0]
                country = parts[-1]
            else:
                country = parts[0]

        region = map_country_to_region(country or location_text)

        # Price per night
        per_night_min, per_night_max = estimate_per_night_price(
            r.get("price_min"), r.get("price_max"), r.get("duration_days")
        )

        slug = slugify(name)

        cleaned.append({
            "source": "bookretreats",
            "source_url": r.get("source_url", ""),
            "slug": slug,
            "name": name,
            "subtitle": "",
            "country": country,
            "region": region,
            "city": city,
            "hero_image_url": hero,
            "gallery_images": [img for img in r.get("gallery_images", []) if isinstance(img, str)][:8],
            "rating": rating,
            "review_count": review_count,
            "price_min_per_night": per_night_min,
            "price_max_per_night": per_night_max,
            "total_price_min": r.get("price_min"),
            "total_price_max": r.get("price_max"),
            "duration_days": r.get("duration_days"),
            "dietary_options": r.get("dietary_options", []),
            "amenities": r.get("amenities", []),
            "program_types": [],
            "specialty_tags": [],
            "host_name": r.get("host_name", ""),
            "website_url": "",
            "description": r.get("description", ""),
            "reviews": r.get("reviews", []),
        })

    return cleaned


def clean_retreatguru(raw_data):
    """Clean and normalize Retreat.guru data."""
    cleaned = []
    for r in raw_data:
        name = r.get("name", "").strip()
        if not name:
            continue

        hero = r.get("hero_image", "")
        if not hero:
            continue  # Must have image

        rating = r.get("rating")
        review_count = r.get("review_count", 0)

        # Location
        country = r.get("country", "")
        city = r.get("city", "")
        region_raw = r.get("region", "")

        # Sometimes country field has "City, State" format
        if "," in country and not city:
            parts = [p.strip() for p in country.split(",")]
            city = parts[0]
            country = parts[-1]

        region = map_country_to_region(country or region_raw or city)

        # Clean website URL
        website = r.get("website", "")
        if website and not website.startswith("http"):
            website = ""  # Remove relative URLs

        slug = slugify(name)

        cleaned.append({
            "source": "retreatguru",
            "source_url": r.get("source_url", ""),
            "slug": slug,
            "name": name,
            "subtitle": "",
            "country": country,
            "region": region,
            "city": city,
            "hero_image_url": hero,
            "gallery_images": [img for img in r.get("gallery_images", []) if isinstance(img, str)][:8],
            "rating": rating,
            "review_count": review_count,
            "price_min_per_night": None,  # retreat.guru doesn't provide per-night
            "price_max_per_night": None,
            "total_price_min": r.get("price_min"),
            "total_price_max": r.get("price_max"),
            "duration_days": None,
            "dietary_options": r.get("dietary_options", []),
            "amenities": r.get("amenities", []),
            "program_types": r.get("program_types", []),
            "specialty_tags": [],
            "host_name": "",
            "website_url": website,
            "description": r.get("description", ""),
            "reviews": r.get("reviews", []),
            "lat": r.get("lat"),
            "lng": r.get("lng"),
        })

    return cleaned


def normalize_for_dedup(text):
    """Strip to alphanumeric lowercase for fast exact-match dedup."""
    return re.sub(r"[^a-z0-9]", "", text.lower())


def deduplicate(retreats, existing_slugs):
    """Remove duplicates by slug + normalized-name exact match.
    O(n) instead of O(n²) — uses set lookups instead of fuzzy matching.
    For the existing 121 retreats we still do fuzzy matching since the set is small.
    """
    seen_slugs = set(existing_slugs)
    seen_normalized = set()  # normalized name keys for fast lookup
    existing_names_lower = [s.replace("-", " ") for s in existing_slugs]  # for fuzzy matching against existing
    unique = []
    dupes = []

    for r in retreats:
        slug = r["slug"]
        name = r["name"]
        normalized = normalize_for_dedup(name)

        # Exact slug match
        if slug in seen_slugs:
            dupes.append({**r, "reject_reason": f"duplicate_slug"})
            continue

        # Normalized name match (catches "Villa Serenity" vs "Villa-Serenity")
        if normalized in seen_normalized:
            dupes.append({**r, "reject_reason": f"duplicate_normalized_name"})
            continue

        # Fuzzy match against existing 121 only (cheap)
        is_dupe = False
        name_lower = name.lower()
        for existing in existing_names_lower:
            if similar(name_lower, existing) > 0.85:
                dupes.append({**r, "reject_reason": f"similar_to_existing: {existing}"})
                is_dupe = True
                break

        if not is_dupe:
            seen_slugs.add(slug)
            seen_normalized.add(normalized)
            unique.append(r)

    return unique, dupes


def apply_quality_filter(retreats):
    """Filter to retreats with enough data to score and display well."""
    passed = []
    rejected = []

    for r in retreats:
        reasons = []

        # Must have a real name (not a person's name or generic)
        if len(r["name"]) < 5:
            reasons.append("name_too_short")

        # Must have an image
        if not r["hero_image_url"]:
            reasons.append("no_image")

        # Must have either rating OR enough descriptive data
        has_rating = bool(r.get("rating")) and (r.get("review_count") or 0) >= 1
        has_description = len(r.get("description", "")) > 50
        has_amenities = len(r.get("amenities", [])) >= 2
        has_programs = len(r.get("program_types", [])) >= 1

        data_signals = sum([has_rating, has_description, has_amenities, has_programs])
        if data_signals < 2:
            reasons.append(f"insufficient_data (signals={data_signals})")

        # Must map to a valid region
        if r.get("region") == "Other":
            # Still allow but flag — we can expand regions later
            pass

        if reasons:
            rejected.append({**r, "reject_reasons": reasons})
        else:
            passed.append(r)

    return passed, rejected


def main():
    # Load existing slugs
    existing_slugs = set()
    try:
        with open(EXISTING_SLUGS_FILE) as f:
            existing_slugs = set(json.load(f))
        print(f"Loaded {len(existing_slugs)} existing retreat slugs")
    except FileNotFoundError:
        print("No existing slugs file found — will generate one first")
        print("Run: python3 extract_existing_slugs.py")

    # Load raw data
    br_raw = []
    rg_raw = []

    try:
        with open("bookretreats-raw.json") as f:
            br_raw = json.load(f)
        print(f"Loaded {len(br_raw)} BookRetreats records")
    except FileNotFoundError:
        print("bookretreats-raw.json not found — skipping")

    try:
        with open("retreatguru-raw.json") as f:
            rg_raw = json.load(f)
        print(f"Loaded {len(rg_raw)} Retreat.guru records")
    except FileNotFoundError:
        print("retreatguru-raw.json not found — skipping")

    if not br_raw and not rg_raw:
        print("No data to process!")
        return

    # Phase 1: Clean and normalize
    print("\n=== Phase 1: Cleaning ===")
    br_clean = clean_bookretreats(br_raw)
    rg_clean = clean_retreatguru(rg_raw)
    print(f"  BookRetreats: {len(br_raw)} → {len(br_clean)} (after requiring name + image)")
    print(f"  Retreat.guru: {len(rg_raw)} → {len(rg_clean)} (after requiring name + image)")

    # Phase 2: Merge — prefer BookRetreats (better pricing data) over Retreat.guru
    print("\n=== Phase 2: Deduplication ===")
    all_retreats = br_clean + rg_clean
    unique, dupes = deduplicate(all_retreats, existing_slugs)
    print(f"  Total: {len(all_retreats)} → {len(unique)} unique ({len(dupes)} duplicates removed)")

    # Phase 3: Quality filter
    print("\n=== Phase 3: Quality Filter ===")
    passed, rejected = apply_quality_filter(unique)
    print(f"  Passed: {len(passed)}")
    print(f"  Rejected: {len(rejected)}")

    # Stats
    print("\n=== Final Stats ===")
    by_region = {}
    by_source = {}
    has_rating = sum(1 for r in passed if r.get("rating"))
    has_price = sum(1 for r in passed if r.get("price_min_per_night"))
    for r in passed:
        region = r.get("region", "Unknown")
        by_region[region] = by_region.get(region, 0) + 1
        source = r.get("source", "unknown")
        by_source[source] = by_source.get(source, 0) + 1

    print(f"  By source: {by_source}")
    print(f"  By region: {dict(sorted(by_region.items(), key=lambda x: -x[1]))}")
    print(f"  With rating: {has_rating}/{len(passed)} ({round(has_rating/max(len(passed),1)*100)}%)")
    print(f"  With price: {has_price}/{len(passed)} ({round(has_price/max(len(passed),1)*100)}%)")

    # Save outputs
    with open("retreats-cleaned.json", "w") as f:
        json.dump(passed, f, indent=2)
    print(f"\nSaved {len(passed)} cleaned retreats to retreats-cleaned.json")

    all_rejected = dupes + rejected
    with open("retreats-rejected.json", "w") as f:
        json.dump(all_rejected, f, indent=2)
    print(f"Saved {len(all_rejected)} rejected records to retreats-rejected.json")


if __name__ == "__main__":
    main()
