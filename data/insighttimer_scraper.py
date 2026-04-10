from __future__ import annotations
"""
Insight Timer Retreats Scraper
==============================
Scrapes retreats from insighttimer.com via their public retreat listings.

Insight Timer is primarily a meditation app but hosts 1,000+ retreat listings
with structured data (dates, location, pricing, teachers, reviews).

Phase 1: Discover retreat URLs from category/listing pages
Phase 2: Scrape each retreat detail page for structured data

Cost: FREE — public pages.
Output: insighttimer-raw.json + insighttimer-retreats.csv
"""

import requests
import json
import csv
import time
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime
from urllib.parse import quote_plus, urljoin, urlparse, unquote

from bs4 import BeautifulSoup

OUTPUT_DIR = Path(__file__).parent
RAW_OUTPUT = OUTPUT_DIR / "insighttimer-raw.json"
CSV_OUTPUT = OUTPUT_DIR / "insighttimer-retreats.csv"
ERRORS_OUTPUT = OUTPUT_DIR / "insighttimer-errors.json"
CHECKPOINT_PATH = OUTPUT_DIR / ".insighttimer_checkpoint.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

DELAY = 1.5

# Currency conversion to USD
CURRENCY_TO_USD = {
    "USD": 1.0, "EUR": 1.08, "GBP": 1.26, "CAD": 0.74, "AUD": 0.65,
    "NZD": 0.60, "MXN": 0.058, "BRL": 0.19, "THB": 0.029, "IDR": 0.000063,
    "INR": 0.012, "CRC": 0.0019, "PHP": 0.018, "ZAR": 0.055, "ILS": 0.27,
}


# ---------------------------------------------------------------------------
# Phase 1: Discover retreat URLs
# ---------------------------------------------------------------------------


def discover_from_sitemap() -> list[str]:
    """Try to find retreat URLs from sitemap."""
    sitemap_urls = [
        "https://insighttimer.com/sitemap.xml",
        "https://insighttimer.com/sitemap_index.xml",
    ]

    all_urls = []
    for sitemap_url in sitemap_urls:
        try:
            resp = requests.get(sitemap_url, headers=HEADERS, timeout=15)
            if resp.status_code != 200:
                continue

            # Try XML parse
            try:
                root = ET.fromstring(resp.content)
                ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}

                # Check for sub-sitemaps
                sub_maps = [loc.text for loc in root.findall(".//sm:loc", ns) if loc.text and "sitemap" in loc.text.lower()]
                if sub_maps:
                    for sub_url in sub_maps:
                        time.sleep(0.5)
                        try:
                            sub_resp = requests.get(sub_url, headers=HEADERS, timeout=15)
                            if sub_resp.status_code == 200:
                                sub_root = ET.fromstring(sub_resp.content)
                                urls = [loc.text for loc in sub_root.findall(".//sm:loc", ns)]
                                all_urls.extend(urls)
                        except Exception:
                            continue
                else:
                    urls = [loc.text for loc in root.findall(".//sm:loc", ns)]
                    all_urls.extend(urls)
            except ET.ParseError:
                continue
        except requests.RequestException:
            continue

    # Filter to actual retreat/event pages — exclude meditation tracks
    retreat_urls = []
    for u in all_urls:
        path = urlparse(u).path.lower()
        # Exclude meditation tracks (guided-meditations, video-guided-meditations)
        if "guided-meditation" in path:
            continue
        if "/retreat" in path or "/event" in path or "/workshop" in path:
            retreat_urls.append(u)
    return retreat_urls


def discover_from_browse_pages() -> list[str]:
    """Discover retreat URLs by browsing listing pages."""
    all_urls = []

    # Insight Timer retreat/event browsing URLs
    browse_bases = [
        "https://insighttimer.com/retreats",
        "https://insighttimer.com/events",
        "https://insighttimer.com/live-events",
    ]

    # Try pagination on each base
    for base in browse_bases:
        for page_num in range(1, 30):
            url = f"{base}?page={page_num}" if "?" not in base else f"{base}&page={page_num}"
            print(f"  Browsing {base} page {page_num}...")

        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            if resp.status_code != 200:
                break

            soup = BeautifulSoup(resp.text, "html.parser")

            # Find retreat links
            found_on_page = 0
            for a in soup.find_all("a", href=True):
                href = a["href"]
                # Retreat/event detail pages — exclude meditation tracks
                if "guided-meditation" in href.lower():
                    continue
                if re.search(r'/(?:retreat|event|live-event|workshop)[s]?/[a-zA-Z0-9-]+', href):
                    full_url = href if href.startswith("http") else f"https://insighttimer.com{href}"
                    if full_url not in all_urls:
                        all_urls.append(full_url)
                        found_on_page += 1

            if found_on_page == 0:
                print(f"  No more retreats found at page {page_num}, stopping.")
                break

            print(f"  Found {found_on_page} retreat URLs")
            time.sleep(DELAY)

        except requests.RequestException as e:
            print(f"  Error on page {page_num}: {e}")
            break

    return all_urls


def discover_via_ddg() -> list[str]:
    """Fallback: use DuckDuckGo to find retreat listing pages."""
    queries = [
        "site:insighttimer.com retreat",
        "site:insighttimer.com meditation retreat",
        "site:insighttimer.com yoga retreat",
        "site:insighttimer.com wellness retreat",
        "site:insighttimer.com silent retreat",
    ]

    all_urls = []

    for query in queries:
        url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
        try:
            resp = requests.get(url, headers={
                **HEADERS,
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                              "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            }, timeout=10)
            resp.raise_for_status()
        except requests.RequestException:
            continue

        soup = BeautifulSoup(resp.text, "html.parser")
        for link in soup.select("a.result__a"):
            href = link.get("href", "")
            if "uddg=" in href:
                real_url = unquote(href.split("uddg=")[1].split("&")[0])
            elif href.startswith("http"):
                real_url = href
            else:
                continue

            if "insighttimer.com" in real_url and real_url not in all_urls:
                all_urls.append(real_url)

        time.sleep(2.5)

    return all_urls


# ---------------------------------------------------------------------------
# Phase 2: Scrape individual retreat pages
# ---------------------------------------------------------------------------


def extract_json_ld(soup: BeautifulSoup) -> list:
    """Extract JSON-LD structured data from page."""
    results = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string)
            results.append(data)
        except (json.JSONDecodeError, TypeError):
            continue
    return results


def parse_retreat_page(url: str) -> dict | None:
    """Scrape a single retreat detail page."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        if resp.status_code != 200:
            return None
    except requests.RequestException:
        return None

    soup = BeautifulSoup(resp.text, "html.parser")
    text = soup.get_text(separator=" ", strip=True)

    retreat = {
        "source_url": url,
        "data_source": "insighttimer",
    }

    # --- JSON-LD extraction ---
    json_ld_items = extract_json_ld(soup)
    for item in json_ld_items:
        if isinstance(item, list):
            for sub in item:
                _merge_jsonld(retreat, sub)
        elif isinstance(item, dict):
            _merge_jsonld(retreat, item)

    # --- HTML fallback ---
    # Name
    if not retreat.get("name"):
        h1 = soup.find("h1")
        if h1:
            retreat["name"] = h1.get_text(strip=True)

    if not retreat.get("name"):
        return None

    # Description
    if not retreat.get("description"):
        meta = soup.find("meta", attrs={"name": "description"})
        if meta:
            retreat["description"] = meta.get("content", "")[:500]

    # Image
    if not retreat.get("hero_image_url"):
        og_img = soup.find("meta", attrs={"property": "og:image"})
        if og_img:
            retreat["hero_image_url"] = og_img.get("content", "")

    # Location
    if not retreat.get("city"):
        location_patterns = [
            re.compile(r'(?:location|venue|where)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', re.MULTILINE),
        ]
        for pat in location_patterns:
            m = pat.search(text)
            if m:
                retreat["city"] = m.group(1).strip()
                retreat["country"] = m.group(2).strip()
                break

    # Price
    if not retreat.get("price_min_per_night"):
        price_match = re.search(r'(?:from|starting|price)[:\s]*\$?([\d,]+)', text, re.IGNORECASE)
        if price_match:
            try:
                retreat["price_raw"] = float(price_match.group(1).replace(",", ""))
            except ValueError:
                pass

    # Duration
    duration_match = re.search(r'(\d+)\s*(?:day|night)s?\s*(?:retreat|program)?', text, re.IGNORECASE)
    if duration_match:
        retreat["duration_days"] = int(duration_match.group(1))

    # Compute per-night price
    if retreat.get("price_raw") and retreat.get("duration_days") and retreat["duration_days"] > 0:
        retreat["price_min_per_night"] = round(retreat["price_raw"] / retreat["duration_days"], 2)

    # Rating
    if not retreat.get("rating"):
        rating_match = re.search(r'([\d.]+)\s*/?\s*5\s*(?:stars?)?', text)
        if rating_match:
            try:
                val = float(rating_match.group(1))
                if 1.0 <= val <= 5.0:
                    retreat["rating"] = val
            except ValueError:
                pass

    # Review count
    if not retreat.get("review_count"):
        review_match = re.search(r'(\d+)\s*reviews?', text, re.IGNORECASE)
        if review_match:
            retreat["review_count"] = int(review_match.group(1))

    # Tags / categories
    tags = set()
    tag_keywords = [
        "meditation", "yoga", "silent", "breathwork", "mindfulness",
        "wellness", "detox", "ayurveda", "vipassana", "zen",
        "sound healing", "spiritual", "plant medicine", "fasting",
        "women's", "men's", "couples", "luxury",
    ]
    lower = text.lower()
    for kw in tag_keywords:
        if kw in lower:
            tags.add(kw)
    if tags:
        retreat["specialty_tags"] = sorted(tags)

    # Amenities
    amenity_keywords = [
        "pool", "sauna", "spa", "massage", "organic meals",
        "farm-to-table", "hot tub", "wifi", "ac", "air conditioning",
        "private room", "shared room", "beach", "mountain",
    ]
    amenities = [a for a in amenity_keywords if a in lower]
    if amenities:
        retreat["amenities"] = amenities

    # Teacher / facilitator
    teacher_match = re.search(r'(?:led by|teacher|facilitator|guide)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)', text)
    if teacher_match:
        retreat["host_name"] = teacher_match.group(1).strip()

    retreat["scraped_at"] = datetime.utcnow().isoformat() + "Z"

    return retreat


def _merge_jsonld(retreat: dict, item: dict):
    """Merge JSON-LD data into retreat dict."""
    item_type = item.get("@type", "")
    if isinstance(item_type, list):
        item_type = item_type[0] if item_type else ""

    retreat.setdefault("name", item.get("name", ""))
    retreat.setdefault("description", (item.get("description", "") or "")[:500])

    # Location
    location = item.get("location", {})
    if isinstance(location, dict):
        address = location.get("address", {})
        if isinstance(address, dict):
            retreat.setdefault("city", address.get("addressLocality", ""))
            retreat.setdefault("region", address.get("addressRegion", ""))
            retreat.setdefault("country", address.get("addressCountry", ""))
        elif isinstance(address, str):
            retreat.setdefault("address", address)

        geo = location.get("geo", {})
        if isinstance(geo, dict):
            try:
                retreat.setdefault("lat", float(geo.get("latitude", 0)))
                retreat.setdefault("lng", float(geo.get("longitude", 0)))
            except (ValueError, TypeError):
                pass

    # Rating
    agg = item.get("aggregateRating", {})
    if agg:
        try:
            retreat.setdefault("rating", float(agg.get("ratingValue", 0)))
            retreat.setdefault("review_count", int(agg.get("reviewCount", agg.get("ratingCount", 0))))
        except (ValueError, TypeError):
            pass

    # Price
    offers = item.get("offers", item.get("priceSpecification", {}))
    if isinstance(offers, dict):
        try:
            price = float(offers.get("price", offers.get("lowPrice", 0)))
            currency = offers.get("priceCurrency", "USD")
            rate = CURRENCY_TO_USD.get(currency, 1.0)
            retreat.setdefault("price_raw", round(price * rate, 2))
            retreat.setdefault("currency_original", currency)
        except (ValueError, TypeError):
            pass
    elif isinstance(offers, list) and offers:
        try:
            price = float(offers[0].get("price", offers[0].get("lowPrice", 0)))
            currency = offers[0].get("priceCurrency", "USD")
            rate = CURRENCY_TO_USD.get(currency, 1.0)
            retreat.setdefault("price_raw", round(price * rate, 2))
        except (ValueError, TypeError):
            pass

    # Image
    image = item.get("image", "")
    if isinstance(image, str) and image:
        retreat.setdefault("hero_image_url", image)
    elif isinstance(image, list) and image:
        retreat.setdefault("hero_image_url", image[0] if isinstance(image[0], str) else image[0].get("url", ""))
    elif isinstance(image, dict):
        retreat.setdefault("hero_image_url", image.get("url", ""))

    # Start/end dates
    retreat.setdefault("start_date", item.get("startDate", ""))
    retreat.setdefault("end_date", item.get("endDate", ""))

    # Organizer
    org = item.get("organizer", item.get("performer", {}))
    if isinstance(org, dict):
        retreat.setdefault("host_name", org.get("name", ""))


# ---------------------------------------------------------------------------
# Checkpoint / save
# ---------------------------------------------------------------------------


def load_checkpoint() -> int:
    try:
        with open(CHECKPOINT_PATH) as f:
            return json.load(f).get("last_index", 0)
    except (FileNotFoundError, json.JSONDecodeError):
        return 0


def save_checkpoint(index: int):
    with open(CHECKPOINT_PATH, "w") as f:
        json.dump({"last_index": index}, f)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    test_mode = "--test" in sys.argv
    resume_mode = "--resume" in sys.argv

    # Phase 1: Discover URLs
    print("=" * 60)
    print("PHASE 1: Discovering retreat URLs")
    print("=" * 60)

    urls = discover_from_sitemap()
    print(f"Sitemap: {len(urls)} URLs")

    if len(urls) < 50:
        print("Trying browse pages...")
        browse_urls = discover_from_browse_pages()
        urls = list(set(urls + browse_urls))
        print(f"After browse: {len(urls)} URLs")

    if len(urls) < 20:
        print("Trying DuckDuckGo fallback...")
        ddg_urls = discover_via_ddg()
        urls = list(set(urls + ddg_urls))
        print(f"After DDG: {len(urls)} URLs")

    if not urls:
        print("No retreat URLs found. Exiting.")
        return

    urls = sorted(set(urls))
    print(f"\nTotal unique URLs to scrape: {len(urls)}")

    if test_mode:
        urls = urls[:10]
        print("TEST MODE: limiting to first 10")

    # Phase 2: Scrape each page
    print("\n" + "=" * 60)
    print("PHASE 2: Scraping retreat pages")
    print("=" * 60)

    retreats = []
    errors = []

    start_index = load_checkpoint() if resume_mode else 0
    if resume_mode:
        try:
            with open(RAW_OUTPUT) as f:
                retreats = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            pass
        print(f"Resuming from index {start_index}, {len(retreats)} existing")

    for i in range(start_index, len(urls)):
        url = urls[i]
        print(f"[{i+1}/{len(urls)}] {url}")

        retreat = parse_retreat_page(url)

        if retreat and retreat.get("name"):
            retreats.append(retreat)
            name = retreat.get("name", "?")[:50]
            city = retreat.get("city", "?")
            rating = retreat.get("rating", "?")
            print(f"  -> {name} | {city} | rating={rating}")
        else:
            errors.append({"url": url, "error": "No data extracted"})
            print(f"  -> No data")

        # Checkpoint every 25
        if (i + 1) % 25 == 0:
            with open(RAW_OUTPUT, "w") as f:
                json.dump(retreats, f, indent=2)
            save_checkpoint(i + 1)
            print(f"  [Checkpoint: {len(retreats)} retreats saved]")

        time.sleep(DELAY)

    # Final save
    with open(RAW_OUTPUT, "w") as f:
        json.dump(retreats, f, indent=2)

    with open(ERRORS_OUTPUT, "w") as f:
        json.dump(errors, f, indent=2)

    # CSV export
    if retreats:
        fields = sorted(set().union(*(r.keys() for r in retreats)))
        with open(CSV_OUTPUT, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
            writer.writeheader()
            for r in retreats:
                # Convert lists to strings for CSV
                row = {}
                for k, v in r.items():
                    row[k] = json.dumps(v) if isinstance(v, (list, dict)) else v
                writer.writerow(row)

    print("\n" + "=" * 60)
    print(f"DONE. Retreats scraped: {len(retreats)}")
    print(f"Errors: {len(errors)}")
    print(f"Raw JSON: {RAW_OUTPUT}")
    print(f"CSV: {CSV_OUTPUT}")


if __name__ == "__main__":
    main()
