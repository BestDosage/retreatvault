from __future__ import annotations
"""
Retreat.com Scraper
===================
Scrapes retreat listings from retreat.com via sitemap discovery + page scraping.

Retreat.com hosts wellness retreat listings with structured data including
pricing, location, program types, and reviews.

Phase 1: Discover retreat URLs from sitemap
Phase 2: Scrape each retreat detail page for structured data

Cost: FREE — public sitemap + HTML scraping.
Output: retreat-com-raw.json + retreat-com-retreats.csv
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
from urllib.parse import quote_plus, urlparse, unquote

from bs4 import BeautifulSoup

OUTPUT_DIR = Path(__file__).parent
RAW_OUTPUT = OUTPUT_DIR / "retreat-com-raw.json"
CSV_OUTPUT = OUTPUT_DIR / "retreat-com-retreats.csv"
ERRORS_OUTPUT = OUTPUT_DIR / "retreat-com-errors.json"
CHECKPOINT_PATH = OUTPUT_DIR / ".retreat_com_checkpoint.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

DELAY = 1.5

CURRENCY_TO_USD = {
    "USD": 1.0, "EUR": 1.08, "GBP": 1.26, "CAD": 0.74, "AUD": 0.65,
    "NZD": 0.60, "MXN": 0.058, "BRL": 0.19, "THB": 0.029, "IDR": 0.000063,
    "INR": 0.012, "CRC": 0.0019, "PHP": 0.018, "ZAR": 0.055, "ILS": 0.27,
}


# ---------------------------------------------------------------------------
# Phase 1: URL Discovery
# ---------------------------------------------------------------------------


def discover_from_sitemap() -> list[str]:
    """Fetch retreat URLs from sitemap."""
    sitemap_candidates = [
        "https://www.retreat.com/sitemap.xml",
        "https://retreat.com/sitemap.xml",
        "https://www.retreat.com/sitemap_index.xml",
        "https://www.retreat.com/sitemaps/retreats.xml",
    ]

    all_urls = []

    for sitemap_url in sitemap_candidates:
        try:
            resp = requests.get(sitemap_url, headers=HEADERS, timeout=15)
            if resp.status_code != 200:
                continue

            root = ET.fromstring(resp.content)
            ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}

            # Check for sub-sitemaps
            locs = [loc.text for loc in root.findall(".//sm:loc", ns) if loc.text]

            sub_sitemaps = [u for u in locs if "sitemap" in u.lower()]
            if sub_sitemaps:
                for sub_url in sub_sitemaps:
                    time.sleep(0.5)
                    try:
                        sub_resp = requests.get(sub_url, headers=HEADERS, timeout=15)
                        if sub_resp.status_code == 200:
                            sub_root = ET.fromstring(sub_resp.content)
                            sub_urls = [loc.text for loc in sub_root.findall(".//sm:loc", ns)]
                            all_urls.extend(sub_urls)
                    except Exception:
                        continue
            else:
                all_urls.extend(locs)

            if all_urls:
                break

        except (requests.RequestException, ET.ParseError):
            continue

    # Filter to retreat listing pages
    retreat_urls = []
    for url in all_urls:
        path = urlparse(url).path.lower()
        # Include retreat detail pages, exclude blog/category pages
        if re.search(r'/retreat[s]?/[a-z0-9-]+', path) and "/category" not in path and "/blog" not in path:
            retreat_urls.append(url)

    return list(set(retreat_urls))


def discover_from_browse() -> list[str]:
    """Discover retreats by browsing category pages."""
    categories = [
        "yoga", "meditation", "wellness", "detox", "ayurveda",
        "silent", "spiritual", "fitness", "fasting", "nature",
        "healing", "mindfulness", "women", "couples",
    ]

    all_urls = []

    for cat in categories:
        for page in range(1, 10):
            url = f"https://www.retreat.com/retreats/{cat}?page={page}"
            try:
                resp = requests.get(url, headers=HEADERS, timeout=10)
                if resp.status_code != 200:
                    break

                soup = BeautifulSoup(resp.text, "html.parser")
                found = 0
                for a in soup.find_all("a", href=True):
                    href = a["href"]
                    if re.search(r'/retreat[s]?/[a-z0-9-]+-\d+', href) or re.search(r'/retreat[s]?/[a-z0-9-]{10,}', href):
                        full = href if href.startswith("http") else f"https://www.retreat.com{href}"
                        if full not in all_urls:
                            all_urls.append(full)
                            found += 1

                if found == 0:
                    break

                time.sleep(DELAY)
            except requests.RequestException:
                break

    return all_urls


def discover_via_ddg() -> list[str]:
    """Fallback: DuckDuckGo discovery."""
    queries = [
        "site:retreat.com yoga retreat",
        "site:retreat.com meditation retreat",
        "site:retreat.com wellness retreat",
        "site:retreat.com silent retreat",
        "site:retreat.com detox retreat",
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

            if "retreat.com" in real_url and real_url not in all_urls:
                all_urls.append(real_url)

        time.sleep(2.5)

    return all_urls


# ---------------------------------------------------------------------------
# Phase 2: Page scraping
# ---------------------------------------------------------------------------


def extract_json_ld(soup: BeautifulSoup) -> list:
    results = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string)
            results.append(data)
        except (json.JSONDecodeError, TypeError):
            continue
    return results


def parse_retreat_page(url: str) -> dict | None:
    """Scrape a single retreat page."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        if resp.status_code != 200:
            return None
    except requests.RequestException:
        return None

    soup = BeautifulSoup(resp.text, "html.parser")
    text = soup.get_text(separator=" ", strip=True)
    lower = text.lower()

    retreat = {
        "source_url": url,
        "data_source": "retreat_com",
    }

    # JSON-LD
    for item in extract_json_ld(soup):
        if isinstance(item, list):
            for sub in item:
                if isinstance(sub, dict):
                    _merge_jsonld(retreat, sub)
        elif isinstance(item, dict):
            _merge_jsonld(retreat, item)

    # Name
    if not retreat.get("name"):
        h1 = soup.find("h1")
        if h1:
            retreat["name"] = h1.get_text(strip=True)

    if not retreat.get("name"):
        return None

    # Slug
    retreat["slug"] = _slugify(retreat["name"])

    # Description
    if not retreat.get("description"):
        meta = soup.find("meta", attrs={"name": "description"})
        if meta:
            retreat["description"] = meta.get("content", "")[:500]

    # Image
    if not retreat.get("hero_image_url"):
        og = soup.find("meta", attrs={"property": "og:image"})
        if og:
            retreat["hero_image_url"] = og.get("content", "")

    # Gallery images
    gallery = []
    for img in soup.find_all("img", src=True):
        src = img["src"]
        if any(kw in src.lower() for kw in ["retreat", "gallery", "photo", "image"]):
            if src.startswith("http") and src not in gallery:
                gallery.append(src)
            if len(gallery) >= 10:
                break
    if gallery:
        retreat["gallery_images"] = gallery

    # Location (HTML fallback)
    if not retreat.get("city"):
        loc_match = re.search(
            r'(?:location|where|venue|address)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            text,
        )
        if loc_match:
            retreat["city"] = loc_match.group(1).strip()
            retreat["country"] = loc_match.group(2).strip()

    # Price (HTML fallback)
    if not retreat.get("price_min_per_night"):
        price_match = re.search(r'(?:from|starting|price)[:\s]*\$?([\d,]+)', text, re.IGNORECASE)
        if price_match:
            try:
                retreat["price_raw"] = float(price_match.group(1).replace(",", ""))
            except ValueError:
                pass

    # Duration
    dur_match = re.search(r'(\d+)\s*(?:day|night)s?\s*(?:retreat|program)?', text, re.IGNORECASE)
    if dur_match:
        retreat["duration_days"] = int(dur_match.group(1))

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
        rc_match = re.search(r'(\d+)\s*reviews?', text, re.IGNORECASE)
        if rc_match:
            retreat["review_count"] = int(rc_match.group(1))

    # Tags
    tags = set()
    for kw in ["meditation", "yoga", "silent", "breathwork", "mindfulness", "wellness",
                "detox", "ayurveda", "vipassana", "zen", "sound healing", "spiritual",
                "plant medicine", "fasting", "luxury", "budget"]:
        if kw in lower:
            tags.add(kw)
    if tags:
        retreat["specialty_tags"] = sorted(tags)

    # Amenities
    amenities = []
    for a in ["pool", "sauna", "spa", "massage", "organic meals", "farm-to-table",
              "hot tub", "wifi", "air conditioning", "private room", "shared room",
              "beach", "mountain", "garden", "library"]:
        if a in lower:
            amenities.append(a)
    if amenities:
        retreat["amenities"] = amenities

    # Program types
    programs = []
    for p in ["yoga", "meditation", "breathwork", "hiking", "sound healing",
              "journaling", "cooking", "surfing", "art therapy", "dance",
              "pilates", "tai chi", "qigong"]:
        if p in lower:
            programs.append(p)
    if programs:
        retreat["program_types"] = programs

    # Dietary options
    diets = []
    for d in ["vegan", "vegetarian", "gluten-free", "organic", "raw food",
              "paleo", "keto", "halal", "kosher"]:
        if d in lower:
            diets.append(d)
    if diets:
        retreat["dietary_options"] = diets

    retreat["scraped_at"] = datetime.utcnow().isoformat() + "Z"

    return retreat


def _merge_jsonld(retreat: dict, item: dict):
    """Merge JSON-LD structured data into retreat."""
    retreat.setdefault("name", item.get("name", ""))
    retreat.setdefault("description", (item.get("description", "") or "")[:500])

    # Location
    loc = item.get("location", {})
    if isinstance(loc, dict):
        addr = loc.get("address", {})
        if isinstance(addr, dict):
            retreat.setdefault("city", addr.get("addressLocality", ""))
            retreat.setdefault("region", addr.get("addressRegion", ""))
            retreat.setdefault("country", addr.get("addressCountry", ""))
        geo = loc.get("geo", {})
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
    offers = item.get("offers", {})
    if isinstance(offers, dict):
        try:
            price = float(offers.get("price", offers.get("lowPrice", 0)))
            curr = offers.get("priceCurrency", "USD")
            rate = CURRENCY_TO_USD.get(curr, 1.0)
            retreat.setdefault("price_raw", round(price * rate, 2))
        except (ValueError, TypeError):
            pass

    # Image
    img = item.get("image", "")
    if isinstance(img, str) and img:
        retreat.setdefault("hero_image_url", img)
    elif isinstance(img, list) and img:
        retreat.setdefault("hero_image_url", img[0] if isinstance(img[0], str) else img[0].get("url", ""))

    # Dates
    retreat.setdefault("start_date", item.get("startDate", ""))
    retreat.setdefault("end_date", item.get("endDate", ""))

    # Website
    retreat.setdefault("website_url", item.get("url", ""))


def _slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'[\s]+', '-', s)
    s = re.sub(r'-+', '-', s)
    return s.strip('-')[:120]


# ---------------------------------------------------------------------------
# Checkpoint
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

    # Phase 1
    print("=" * 60)
    print("PHASE 1: Discovering retreat URLs")
    print("=" * 60)

    urls = discover_from_sitemap()
    print(f"Sitemap: {len(urls)} URLs")

    if len(urls) < 50:
        browse_urls = discover_from_browse()
        urls = list(set(urls + browse_urls))
        print(f"After browse: {len(urls)} URLs")

    if len(urls) < 20:
        ddg_urls = discover_via_ddg()
        urls = list(set(urls + ddg_urls))
        print(f"After DDG: {len(urls)} URLs")

    if not urls:
        print("No URLs found. Exiting.")
        return

    urls = sorted(set(urls))
    print(f"\nTotal URLs: {len(urls)}")

    if test_mode:
        urls = urls[:10]
        print("TEST MODE: first 10 only")

    # Phase 2
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
        print(f"Resuming from {start_index}, {len(retreats)} existing")

    for i in range(start_index, len(urls)):
        url = urls[i]
        print(f"[{i+1}/{len(urls)}] {url}")

        retreat = parse_retreat_page(url)
        if retreat and retreat.get("name"):
            retreats.append(retreat)
            name = retreat.get("name", "?")[:50]
            city = retreat.get("city", "?")
            print(f"  -> {name} | {city}")
        else:
            errors.append({"url": url, "error": "No data"})
            print(f"  -> No data")

        if (i + 1) % 25 == 0:
            with open(RAW_OUTPUT, "w") as f:
                json.dump(retreats, f, indent=2)
            save_checkpoint(i + 1)
            print(f"  [Checkpoint: {len(retreats)} retreats]")

        time.sleep(DELAY)

    # Save
    with open(RAW_OUTPUT, "w") as f:
        json.dump(retreats, f, indent=2)
    with open(ERRORS_OUTPUT, "w") as f:
        json.dump(errors, f, indent=2)

    if retreats:
        fields = sorted(set().union(*(r.keys() for r in retreats)))
        with open(CSV_OUTPUT, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
            writer.writeheader()
            for r in retreats:
                row = {k: json.dumps(v) if isinstance(v, (list, dict)) else v for k, v in r.items()}
                writer.writerow(row)

    print("\n" + "=" * 60)
    print(f"DONE. Retreats: {len(retreats)} | Errors: {len(errors)}")
    print(f"JSON: {RAW_OUTPUT}")
    print(f"CSV: {CSV_OUTPUT}")


if __name__ == "__main__":
    main()
