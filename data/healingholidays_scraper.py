from __future__ import annotations
"""
Healing Holidays Scraper
========================
Scrapes wellness retreat listings from healingholidays.com.

138 curated luxury wellness retreats with structured data including
pricing, location, program types, and expert reviews.

Phase 1: Discover retreat URLs from sitemap (/accommodation/ pages)
Phase 2: Scrape each retreat detail page for structured data

Cost: FREE — public sitemap + HTML scraping.
Output: healingholidays-raw.json + healingholidays-retreats.csv
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
from urllib.parse import urlparse

from bs4 import BeautifulSoup

OUTPUT_DIR = Path(__file__).parent
RAW_OUTPUT = OUTPUT_DIR / "healingholidays-raw.json"
CSV_OUTPUT = OUTPUT_DIR / "healingholidays-retreats.csv"
ERRORS_OUTPUT = OUTPUT_DIR / "healingholidays-errors.json"
CHECKPOINT_PATH = OUTPUT_DIR / ".healingholidays_checkpoint.json"

SITEMAP_URL = "https://www.healingholidays.com/sitemap.xml"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

DELAY = 1.5

CURRENCY_TO_USD = {
    "USD": 1.0, "EUR": 1.08, "GBP": 1.26, "CAD": 0.74, "AUD": 0.65,
    "NZD": 0.60, "MXN": 0.058, "THB": 0.029, "IDR": 0.000063,
    "INR": 0.012, "CHF": 1.12, "AED": 0.27, "QAR": 0.27,
}

# Map URL country slugs to full names
COUNTRY_MAP = {
    "thailand": "Thailand", "italy": "Italy", "qatar": "Qatar",
    "greece": "Greece", "portugal": "Portugal", "spain": "Spain",
    "turkey": "Turkey", "uk": "United Kingdom", "france": "France",
    "austria": "Austria", "switzerland": "Switzerland", "germany": "Germany",
    "maldives": "Maldives", "sri-lanka": "Sri Lanka", "india": "India",
    "bali": "Indonesia", "indonesia": "Indonesia", "morocco": "Morocco",
    "oman": "Oman", "uae": "United Arab Emirates", "mexico": "Mexico",
    "costa-rica": "Costa Rica", "caribbean": "Caribbean",
    "cyprus": "Cyprus", "croatia": "Croatia", "montenegro": "Montenegro",
    "czech-republic": "Czech Republic", "hungary": "Hungary",
    "vietnam": "Vietnam", "cambodia": "Cambodia", "malaysia": "Malaysia",
    "japan": "Japan", "bhutan": "Bhutan", "nepal": "Nepal",
    "south-africa": "South Africa", "kenya": "Kenya", "tanzania": "Tanzania",
    "rwanda": "Rwanda", "mauritius": "Mauritius", "seychelles": "Seychelles",
}


# ---------------------------------------------------------------------------
# Phase 1: URL Discovery from sitemap
# ---------------------------------------------------------------------------


def discover_urls() -> list[str]:
    """Fetch accommodation listing URLs from sitemap."""
    print(f"Fetching sitemap: {SITEMAP_URL}")
    try:
        resp = requests.get(SITEMAP_URL, headers=HEADERS, timeout=30)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"Failed to fetch sitemap: {e}")
        return []

    root = ET.fromstring(resp.content)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    all_urls = [loc.text for loc in root.findall(".//sm:loc", ns) if loc.text]

    # Filter to accommodation pages (individual retreat listings)
    retreat_urls = [u for u in all_urls if "/accommodation/" in u]
    print(f"Found {len(retreat_urls)} retreat accommodation URLs")
    return retreat_urls


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
        "data_source": "healingholidays",
    }

    # Extract country from URL: /accommodation/thailand/name
    path_parts = urlparse(url).path.strip("/").split("/")
    if len(path_parts) >= 3:
        country_slug = path_parts[1]
        retreat["country"] = COUNTRY_MAP.get(country_slug, country_slug.replace("-", " ").title())

    # --- JSON-LD ---
    for item in extract_json_ld(soup):
        if isinstance(item, list):
            for sub in item:
                if isinstance(sub, dict):
                    _merge_jsonld(retreat, sub)
        elif isinstance(item, dict):
            _merge_jsonld(retreat, item)

    # --- Name ---
    if not retreat.get("name"):
        h1 = soup.find("h1")
        if h1:
            retreat["name"] = h1.get_text(strip=True)

    if not retreat.get("name"):
        og_title = soup.find("meta", attrs={"property": "og:title"})
        if og_title:
            title = og_title.get("content", "")
            retreat["name"] = re.sub(r'\s*[-|]\s*Healing Holidays.*$', '', title).strip()

    if not retreat.get("name"):
        return None

    retreat["slug"] = _slugify(retreat["name"])

    # --- Description ---
    if not retreat.get("description"):
        meta = soup.find("meta", attrs={"name": "description"})
        if meta:
            retreat["description"] = meta.get("content", "")[:500]

    # --- Image ---
    if not retreat.get("hero_image_url"):
        og = soup.find("meta", attrs={"property": "og:image"})
        if og:
            retreat["hero_image_url"] = og.get("content", "")

    # Gallery images
    gallery = []
    for img in soup.find_all("img", src=True):
        src = img["src"]
        if src.startswith("http") and any(kw in src.lower() for kw in [
            "accommodation", "gallery", "retreat", "spa", "pool", "room",
            "healingholidays", "cloudinary", "imgix",
        ]):
            if src not in gallery:
                gallery.append(src)
        if len(gallery) >= 10:
            break
    if gallery:
        retreat["gallery_images"] = gallery

    # --- Location (from text) ---
    if not retreat.get("city"):
        # Often in format "Located in City, Country" or address blocks
        loc_match = re.search(
            r'(?:located\s+in|set\s+in|situated\s+in|nestled\s+in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            text,
        )
        if loc_match:
            retreat["city"] = loc_match.group(1).strip()

    # --- Pricing ---
    # Healing Holidays often shows "From £X per night" or "From £X,XXX"
    price_patterns = [
        re.compile(r'[Ff]rom\s*[£€$]([\d,]+)\s*(?:per\s+)?(?:night|pn|p/n)', re.IGNORECASE),
        re.compile(r'[Pp]rices?\s*from\s*[£€$]([\d,]+)', re.IGNORECASE),
        re.compile(r'[£€$]([\d,]+)\s*per\s*night', re.IGNORECASE),
    ]
    for pat in price_patterns:
        m = pat.search(text)
        if m:
            try:
                price = float(m.group(1).replace(",", ""))
                # Convert GBP to USD (Healing Holidays is UK-based)
                if "£" in m.group(0):
                    price *= CURRENCY_TO_USD.get("GBP", 1.26)
                elif "€" in m.group(0):
                    price *= CURRENCY_TO_USD.get("EUR", 1.08)
                retreat["price_min_per_night"] = round(price, 2)
                break
            except ValueError:
                pass

    # Total package price
    if not retreat.get("price_min_per_night"):
        total_match = re.search(r'[Ff]rom\s*[£€$]([\d,]+)', text)
        if total_match:
            try:
                total = float(total_match.group(1).replace(",", ""))
                if "£" in total_match.group(0):
                    total *= CURRENCY_TO_USD.get("GBP", 1.26)
                elif "€" in total_match.group(0):
                    total *= CURRENCY_TO_USD.get("EUR", 1.08)
                retreat["price_total_from"] = round(total, 2)
            except ValueError:
                pass

    # --- Rating ---
    if not retreat.get("rating"):
        rating_match = re.search(r'([\d.]+)\s*/?\s*(?:5|10)\s*(?:stars?|rating)?', text)
        if rating_match:
            try:
                val = float(rating_match.group(1))
                if val > 5:
                    val = val / 2
                if 1.0 <= val <= 5.0:
                    retreat["rating"] = val
            except ValueError:
                pass

    # --- Property type ---
    property_types = []
    type_keywords = {
        "spa": "destination spa", "resort": "resort", "hotel": "hotel",
        "retreat": "wellness retreat", "clinic": "medical spa",
        "ashram": "ashram", "villa": "villa", "boutique": "boutique hotel",
    }
    for kw, ptype in type_keywords.items():
        if kw in lower:
            property_types.append(ptype)
    if property_types:
        retreat["property_type"] = property_types

    # --- Specialty tags ---
    tags = set()
    for kw in ["detox", "yoga", "meditation", "ayurveda", "weight loss",
                "fitness", "anti-aging", "anti-ageing", "thalassotherapy",
                "sleep", "stress", "burnout", "digital detox", "spa",
                "luxury", "wellness", "holistic", "mayr", "fasting",
                "mindfulness", "sound healing", "hydrotherapy"]:
        if kw in lower:
            tags.add(kw.replace("anti-ageing", "anti-aging"))
    if tags:
        retreat["specialty_tags"] = sorted(tags)

    # --- Amenities ---
    amenities = []
    for a in ["pool", "sauna", "steam room", "spa", "gym", "fitness center",
              "yoga studio", "meditation room", "tennis", "golf",
              "restaurant", "bar", "wifi", "air conditioning",
              "private beach", "garden", "library", "jacuzzi",
              "thermal bath", "hammam", "cryotherapy", "infrared sauna"]:
        if a in lower:
            amenities.append(a)
    if amenities:
        retreat["amenities"] = amenities

    # --- Programs ---
    programs = []
    for p in ["yoga", "meditation", "pilates", "tai chi", "qigong",
              "personal training", "hiking", "cooking class", "nutrition",
              "physiotherapy", "acupuncture", "massage", "facial",
              "hydrotherapy", "cryotherapy", "IV therapy", "DNA testing"]:
        if p in lower:
            programs.append(p)
    if programs:
        retreat["program_types"] = programs

    # --- Dietary ---
    diets = []
    for d in ["vegan", "vegetarian", "gluten-free", "organic", "raw",
              "macrobiotic", "alkaline", "keto", "halal", "kosher",
              "plant-based", "juice cleanse"]:
        if d in lower:
            diets.append(d)
    if diets:
        retreat["dietary_options"] = diets

    retreat["scraped_at"] = datetime.utcnow().isoformat() + "Z"
    return retreat


def _merge_jsonld(retreat: dict, item: dict):
    """Merge JSON-LD structured data."""
    retreat.setdefault("name", item.get("name", ""))
    retreat.setdefault("description", (item.get("description", "") or "")[:500])

    loc = item.get("location", item.get("address", {}))
    if isinstance(loc, dict):
        addr = loc.get("address", loc)
        if isinstance(addr, dict):
            retreat.setdefault("city", addr.get("addressLocality", ""))
            retreat.setdefault("region", addr.get("addressRegion", ""))
        geo = loc.get("geo", {})
        if isinstance(geo, dict):
            try:
                retreat.setdefault("lat", float(geo.get("latitude", 0)))
                retreat.setdefault("lng", float(geo.get("longitude", 0)))
            except (ValueError, TypeError):
                pass

    agg = item.get("aggregateRating", {})
    if agg:
        try:
            retreat.setdefault("rating", float(agg.get("ratingValue", 0)))
            retreat.setdefault("review_count", int(agg.get("reviewCount", agg.get("ratingCount", 0))))
        except (ValueError, TypeError):
            pass

    img = item.get("image", "")
    if isinstance(img, str) and img:
        retreat.setdefault("hero_image_url", img)
    elif isinstance(img, list) and img:
        retreat.setdefault("hero_image_url", img[0] if isinstance(img[0], str) else img[0].get("url", ""))

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

    print("=" * 60)
    print("Healing Holidays Scraper")
    print("=" * 60)

    urls = discover_urls()
    if not urls:
        print("No URLs found. Exiting.")
        return

    if test_mode:
        urls = urls[:10]
        print(f"TEST MODE: first 10 only")

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
            country = retreat.get("country", "?")
            price = retreat.get("price_min_per_night", "?")
            print(f"  -> {name} | {country} | ${price}/night")
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
