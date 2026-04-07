"""
Retreat.guru Scraper
====================
Phase 1: Discover all center URLs from sitemap
Phase 2: Scrape each center page for structured data via JSON-LD (LodgingBusiness schema)

Centers are the permanent retreat properties — these map to our WellnessRetreat model.
Events are individual programs/dates at those centers.

Output: retreatguru-raw.json + retreatguru-centers.csv
"""

import requests
import json
import csv
import time
import sys
import re
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from datetime import datetime

CENTERS_SITEMAP = "https://retreat.guru/sitemaps/center"
EVENTS_SITEMAP = "https://retreat.guru/sitemaps/event"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}
DELAY = 1.5  # seconds between requests


def fetch_sitemap_urls(sitemap_url):
    """Fetch all URLs from a sitemap XML."""
    print(f"Fetching sitemap: {sitemap_url}")
    resp = requests.get(sitemap_url, headers=HEADERS, timeout=30)
    resp.raise_for_status()

    root = ET.fromstring(resp.content)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [loc.text for loc in root.findall(".//sm:loc", ns) if loc.text]

    print(f"Found {len(urls)} URLs in sitemap")
    return urls


def extract_json_ld(soup):
    """Extract JSON-LD structured data from page."""
    scripts = soup.find_all("script", type="application/ld+json")
    results = []
    for script in scripts:
        try:
            data = json.loads(script.string)
            results.append(data)
        except (json.JSONDecodeError, TypeError):
            continue
    return results


def parse_center_page(url):
    """Scrape a single center detail page."""
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    json_ld_list = extract_json_ld(soup)

    # Find the LodgingBusiness or LocalBusiness schema
    business = None
    for item in json_ld_list:
        if isinstance(item, dict):
            item_type = item.get("@type", "")
            if isinstance(item_type, list):
                if any(t in item_type for t in ["LodgingBusiness", "LocalBusiness", "HealthAndBeautyBusiness"]):
                    business = item
                    break
            elif item_type in ("LodgingBusiness", "LocalBusiness", "HealthAndBeautyBusiness", "TouristAttraction"):
                business = item
                break
        if isinstance(item, list):
            for sub in item:
                if isinstance(sub, dict):
                    sub_type = sub.get("@type", "")
                    if sub_type in ("LodgingBusiness", "LocalBusiness"):
                        business = sub
                        break

    # Also look for Event schemas to get program info
    events = []
    for item in json_ld_list:
        if isinstance(item, dict) and item.get("@type") == "Event":
            events.append(item)
        if isinstance(item, list):
            for sub in item:
                if isinstance(sub, dict) and sub.get("@type") == "Event":
                    events.append(sub)

    # Extract center name — try JSON-LD first, then page title
    name = ""
    if business:
        name = business.get("name", "")
    if not name:
        title_tag = soup.find("title")
        if title_tag:
            name = title_tag.get_text(strip=True).split("|")[0].split("-")[0].strip()
    if not name:
        h1 = soup.find("h1")
        if h1:
            name = h1.get_text(strip=True)

    # Extract location — try JSON-LD first, then page HTML
    address = {}
    if business:
        addr = business.get("address", {})
        if isinstance(addr, dict):
            address = {
                "city": addr.get("addressLocality", ""),
                "region": addr.get("addressRegion", ""),
                "country": addr.get("addressCountry", ""),
            }
            # addressCountry can be a dict with "name"
            if isinstance(address["country"], dict):
                address["country"] = address["country"].get("name", "")

    # Fallback: extract location from page meta or breadcrumbs
    if not address.get("country"):
        # Try og:country_name or similar meta tags
        for meta in soup.find_all("meta"):
            prop = meta.get("property", "") or meta.get("name", "")
            content = meta.get("content", "")
            if "country" in prop.lower() and content:
                address["country"] = content
        # Try finding location in page text near known patterns
        loc_el = soup.find("a", href=re.compile(r"/in/.*-retreats"))
        if loc_el:
            loc_text = loc_el.get_text(strip=True)
            if loc_text and not address.get("country"):
                address["country"] = loc_text

    # Extract coordinates
    lat, lng = None, None
    if business:
        geo = business.get("geo", {})
        if isinstance(geo, dict):
            lat = geo.get("latitude")
            lng = geo.get("longitude")

    # Extract rating
    rating = None
    review_count = 0
    if business:
        agg = business.get("aggregateRating", {})
        if isinstance(agg, dict):
            rating = agg.get("ratingValue")
            review_count = agg.get("ratingCount") or agg.get("reviewCount") or 0

    # Extract description
    description = ""
    if business:
        description = business.get("description", "")
    if not description:
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc:
            description = meta_desc.get("content", "")

    # Extract images
    images = []
    if business:
        img = business.get("image", [])
        if isinstance(img, str):
            images = [img]
        elif isinstance(img, list):
            images = [i if isinstance(i, str) else i.get("url", "") for i in img]

    # Extract website
    website = ""
    if business:
        website = business.get("url", "")
    # Also check for external website link on page
    ext_link = soup.find("a", href=True, string=re.compile(r"website|visit", re.I))
    if ext_link:
        href = ext_link.get("href", "")
        if href.startswith("http") and "retreat.guru" not in href:
            website = href

    # Extract amenities from page
    amenities = []
    page_text = soup.get_text().lower()
    amenity_keywords = [
        "yoga studio", "meditation hall", "pool", "swimming pool", "spa",
        "sauna", "steam room", "hot tub", "jacuzzi", "gym", "fitness center",
        "wifi", "organic garden", "restaurant", "kitchen", "library",
        "hiking trails", "beach access", "air conditioning", "laundry",
    ]
    for kw in amenity_keywords:
        if kw in page_text:
            amenities.append(kw)

    # Extract dietary info
    dietary = []
    for diet in ["vegetarian", "vegan", "gluten-free", "organic", "plant-based", "raw food", "ayurvedic", "macrobiotic"]:
        if diet in page_text:
            dietary.append(diet)

    # Extract program types from events and page content
    program_types = set()
    program_keywords = {
        "yoga": "yoga", "meditation": "meditation", "ayurveda": "ayurveda",
        "detox": "detox", "fasting": "fasting", "silent": "silent-retreat",
        "plant medicine": "plant-medicine", "ayahuasca": "plant-medicine",
        "wellness": "wellness", "spa": "spa", "fitness": "fitness",
        "weight loss": "weight-loss", "stress": "stress-management",
        "mindfulness": "mindfulness", "breathwork": "breathwork",
        "sound healing": "sound-healing", "reiki": "reiki",
    }
    for keyword, program in program_keywords.items():
        if keyword in page_text:
            program_types.add(program)

    # Extract pricing from events
    prices = []
    for event in events:
        offers = event.get("offers", {})
        if isinstance(offers, dict):
            p = offers.get("price")
            if p:
                try:
                    prices.append(float(p))
                except (ValueError, TypeError):
                    pass
        elif isinstance(offers, list):
            for o in offers:
                p = o.get("price")
                if p:
                    try:
                        prices.append(float(p))
                    except (ValueError, TypeError):
                        pass

    # Extract individual reviews
    reviews_data = []
    if business:
        reviews_raw = business.get("review", [])
        if isinstance(reviews_raw, list):
            for r in reviews_raw[:10]:
                reviews_data.append({
                    "author": r.get("author", {}).get("name", "") if isinstance(r.get("author"), dict) else "",
                    "rating": r.get("reviewRating", {}).get("ratingValue") if isinstance(r.get("reviewRating"), dict) else None,
                    "text": r.get("reviewBody", "")[:500],
                    "date": r.get("datePublished", ""),
                })

    slug = url.rstrip("/").split("/")[-1]
    # Clean slug — remove the center ID prefix like "6869-1/"
    parts = url.rstrip("/").split("/")
    slug = parts[-1] if parts else slug

    return {
        "source": "retreatguru",
        "source_url": url,
        "slug": slug,
        "name": name,
        "description": description[:1000],
        "city": address.get("city", ""),
        "region": address.get("region", ""),
        "country": address.get("country", ""),
        "lat": float(lat) if lat else None,
        "lng": float(lng) if lng else None,
        "rating": float(rating) if rating else None,
        "review_count": int(review_count) if review_count else 0,
        "price_min": min(prices) if prices else None,
        "price_max": max(prices) if prices else None,
        "website": website,
        "hero_image": images[0] if images else None,
        "gallery_images": images[:10],
        "amenities": amenities,
        "dietary_options": dietary,
        "program_types": list(program_types),
        "reviews": reviews_data,
        "event_count": len(events),
        "scraped_at": datetime.utcnow().isoformat(),
    }


def get_center_id(url):
    """Extract numeric center ID from URL for sorting."""
    m = re.search(r"/centers/(\d+)-", url)
    return int(m.group(1)) if m else 99999


def main():
    # Phase 1: Get all center URLs from sitemap
    center_urls = fetch_sitemap_urls(CENTERS_SITEMAP)

    # Sort by center ID ascending — oldest/most established centers first
    # These have richer data (ratings, reviews, location info)
    center_urls.sort(key=get_center_id)
    print(f"Sorted by center ID (oldest first). ID range: {get_center_id(center_urls[0])}–{get_center_id(center_urls[-1])}")

    # Optional: limit for testing
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else len(center_urls)
    center_urls = center_urls[:limit]
    print(f"Scraping {len(center_urls)} centers...")

    # Phase 2: Scrape each center page
    centers = []
    errors = []

    for i, url in enumerate(center_urls):
        try:
            print(f"[{i+1}/{len(center_urls)}] {url}")
            center = parse_center_page(url)
            if center and center["name"]:
                centers.append(center)
                rating_str = f"{center['rating']}/5" if center['rating'] else "no rating"
                print(f"  ✓ {center['name'][:60]} — {rating_str} ({center['review_count']} reviews) — {center['country']}")
            else:
                print(f"  ✗ No usable data found")
                errors.append({"url": url, "error": "no_data"})
        except Exception as e:
            print(f"  ✗ Error: {e}")
            errors.append({"url": url, "error": str(e)})

        if i < len(center_urls) - 1:
            time.sleep(DELAY)

    # Save raw JSON
    raw_path = "retreatguru-raw.json"
    with open(raw_path, "w") as f:
        json.dump(centers, f, indent=2)
    print(f"\nSaved {len(centers)} centers to {raw_path}")

    # Save CSV
    csv_path = "retreatguru-centers.csv"
    if centers:
        fieldnames = [
            "name", "slug", "city", "region", "country", "lat", "lng",
            "rating", "review_count", "price_min", "price_max",
            "website", "hero_image", "program_types", "source_url",
        ]
        with open(csv_path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            for c in centers:
                row = {**c, "program_types": "|".join(c.get("program_types", []))}
                writer.writerow(row)
        print(f"Saved CSV to {csv_path}")

    # Save errors
    if errors:
        with open("retreatguru-errors.json", "w") as f:
            json.dump(errors, f, indent=2)
        print(f"Saved {len(errors)} errors to retreatguru-errors.json")

    print(f"\nDone! {len(centers)} scraped, {len(errors)} errors")


if __name__ == "__main__":
    main()
