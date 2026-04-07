"""
BookRetreats.com Scraper
========================
Phase 1: Discover all wellness retreat URLs from sitemap
Phase 2: Scrape each retreat detail page for structured data via JSON-LD

Output: bookretreats-raw.json + bookretreats-retreats.csv
"""

import requests
import json
import csv
import time
import sys
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from datetime import datetime

SITEMAP_URL = "https://bookretreats.com/r/retreats.xml"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Currency": "USD",
    "Cookie": "currency=USD",
}
DELAY = 1.5  # seconds between requests

# Fallback conversion rates to USD (updated April 2026)
# Only used if the site still returns non-USD despite headers
CURRENCY_TO_USD = {
    "USD": 1.0,
    "EUR": 1.08,
    "GBP": 1.26,
    "ILS": 0.27,
    "CAD": 0.74,
    "AUD": 0.65,
    "NZD": 0.60,
    "MXN": 0.058,
    "BRL": 0.19,
    "THB": 0.029,
    "IDR": 0.000063,
    "INR": 0.012,
    "CRC": 0.0019,
    "PHP": 0.018,
    "ZAR": 0.055,
}


def fetch_sitemap_urls():
    """Fetch all retreat URLs from the sitemap XML."""
    print(f"Fetching sitemap: {SITEMAP_URL}")
    resp = requests.get(SITEMAP_URL, headers=HEADERS, timeout=30)
    resp.raise_for_status()

    # Parse XML, handling namespace
    root = ET.fromstring(resp.content)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [loc.text for loc in root.findall(".//sm:loc", ns) if loc.text]

    print(f"Found {len(urls)} retreat URLs in sitemap")
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


def parse_retreat_page(url):
    """Scrape a single retreat detail page."""
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    json_ld_list = extract_json_ld(soup)

    # Find the Product schema (retreat listing)
    product = None
    for item in json_ld_list:
        if isinstance(item, dict) and item.get("@type") == "Product":
            product = item
            break
        # Sometimes it's in a list
        if isinstance(item, list):
            for sub in item:
                if isinstance(sub, dict) and sub.get("@type") == "Product":
                    product = sub
                    break

    if not product:
        return None

    # Extract aggregate rating
    agg_rating = product.get("aggregateRating", {})
    rating = agg_rating.get("ratingValue")
    review_count = agg_rating.get("reviewCount")

    # Extract offers/pricing
    offers = product.get("offers", {})
    if isinstance(offers, list):
        prices = [float(o.get("price", 0)) for o in offers if o.get("price")]
        price_min = min(prices) if prices else None
        price_max = max(prices) if prices else None
        currency = offers[0].get("priceCurrency", "USD") if offers else "USD"
    elif isinstance(offers, dict):
        price_min = offers.get("price") or offers.get("lowPrice")
        price_max = offers.get("highPrice") or price_min
        currency = offers.get("priceCurrency", "USD")
    else:
        price_min = price_max = currency = None

    # Convert all prices to USD
    if currency and currency != "USD" and currency in CURRENCY_TO_USD:
        rate = CURRENCY_TO_USD[currency]
        if price_min:
            price_min = round(float(price_min) * rate, 2)
        if price_max:
            price_max = round(float(price_max) * rate, 2)
        currency = "USD"

    # Extract description
    description = product.get("description", "")

    # Extract images — can be strings, dicts with "url", or ImageObject dicts
    raw_images = product.get("image", [])
    if isinstance(raw_images, str):
        raw_images = [raw_images]
    images = []
    for img in raw_images:
        if isinstance(img, str):
            images.append(img)
        elif isinstance(img, dict):
            images.append(img.get("url") or img.get("@id", ""))

    # Extract location from page content
    location_text = ""
    location_el = soup.find("a", {"data-testid": "retreat-location"})
    if location_el:
        location_text = location_el.get_text(strip=True)
    else:
        # Try meta tags
        og_locale = soup.find("meta", property="og:locale")
        # Try finding location in breadcrumbs or other elements
        breadcrumbs = soup.find_all("a", href=True)
        for bc in breadcrumbs:
            href = bc.get("href", "")
            if "/s/wellness-retreats/" in href and bc.get_text(strip=True):
                location_text = bc.get_text(strip=True)
                break

    # Extract what's included
    included_items = []
    included_section = soup.find("div", {"data-testid": "whats-included"})
    if included_section:
        items = included_section.find_all("li")
        included_items = [item.get_text(strip=True) for item in items]

    # Extract duration from title or description
    duration_days = None
    title = product.get("name", "")
    import re
    duration_match = re.search(r"(\d+)\s*(?:day|night)", title.lower())
    if duration_match:
        duration_days = int(duration_match.group(1))

    # Extract host/organizer
    brand = product.get("brand", {})
    host_name = brand.get("name", "") if isinstance(brand, dict) else ""

    # Extract individual reviews from JSON-LD
    reviews_data = []
    reviews_raw = product.get("review", [])
    if isinstance(reviews_raw, list):
        for r in reviews_raw[:10]:  # cap at 10
            reviews_data.append({
                "author": r.get("author", {}).get("name", "") if isinstance(r.get("author"), dict) else "",
                "rating": r.get("reviewRating", {}).get("ratingValue") if isinstance(r.get("reviewRating"), dict) else None,
                "text": r.get("reviewBody", "")[:500],
                "date": r.get("datePublished", ""),
            })

    # Extract food/dietary info from page text
    dietary = []
    page_text = soup.get_text().lower()
    for diet in ["vegetarian", "vegan", "gluten-free", "organic", "plant-based", "raw food", "ayurvedic", "macrobiotic"]:
        if diet in page_text:
            dietary.append(diet)

    # Extract facilities/amenities
    amenities = []
    amenity_section = soup.find_all("div", class_=lambda c: c and "amenit" in c.lower()) if soup else []
    for section in amenity_section:
        items = section.find_all("li")
        amenities.extend([item.get_text(strip=True) for item in items])

    slug = url.rstrip("/").split("/")[-1]

    return {
        "source": "bookretreats",
        "source_url": url,
        "slug": slug,
        "name": title,
        "description": description[:1000],
        "location_text": location_text,
        "rating": float(rating) if rating else None,
        "review_count": int(review_count) if review_count else 0,
        "price_min": float(price_min) if price_min else None,
        "price_max": float(price_max) if price_max else None,
        "currency": currency,
        "duration_days": duration_days,
        "host_name": host_name,
        "hero_image": images[0] if images else None,
        "gallery_images": images[:10],
        "dietary_options": dietary,
        "amenities": amenities,
        "included_items": included_items,
        "reviews": reviews_data,
        "scraped_at": datetime.utcnow().isoformat(),
    }


def main():
    # Phase 1: Get all URLs
    urls = fetch_sitemap_urls()

    # Optional: limit for testing
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else len(urls)
    urls = urls[:limit]
    print(f"Scraping {len(urls)} retreats...")

    # Phase 2: Scrape each page
    retreats = []
    errors = []

    for i, url in enumerate(urls):
        try:
            print(f"[{i+1}/{len(urls)}] {url}")
            retreat = parse_retreat_page(url)
            if retreat:
                retreats.append(retreat)
                print(f"  ✓ {retreat['name'][:60]} — {retreat['rating']}/5 ({retreat['review_count']} reviews)")
            else:
                print(f"  ✗ No structured data found")
                errors.append({"url": url, "error": "no_json_ld"})
        except Exception as e:
            print(f"  ✗ Error: {e}")
            errors.append({"url": url, "error": str(e)})

        if i < len(urls) - 1:
            time.sleep(DELAY)

    # Save raw JSON
    raw_path = "bookretreats-raw.json"
    with open(raw_path, "w") as f:
        json.dump(retreats, f, indent=2)
    print(f"\nSaved {len(retreats)} retreats to {raw_path}")

    # Save CSV
    csv_path = "bookretreats-retreats.csv"
    if retreats:
        fieldnames = [
            "name", "slug", "location_text", "rating", "review_count",
            "price_min", "price_max", "currency", "duration_days",
            "host_name", "hero_image", "dietary_options", "source_url",
        ]
        with open(csv_path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(retreats)
        print(f"Saved CSV to {csv_path}")

    # Save errors
    if errors:
        with open("bookretreats-errors.json", "w") as f:
            json.dump(errors, f, indent=2)
        print(f"Saved {len(errors)} errors to bookretreats-errors.json")

    print(f"\nDone! {len(retreats)} scraped, {len(errors)} errors")


if __name__ == "__main__":
    main()
