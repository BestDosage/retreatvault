#!/usr/bin/env python3
"""
enrich_unrated.py

Enriches wellness retreats that are missing rating data by searching the web
(via DuckDuckGo HTML search) and attempting to extract ratings from Google
Maps snippets, TripAdvisor, Facebook, Yelp, and the retreat's own website.

Usage:
    python3 enrich_unrated.py

Inputs:
    retreats-without-ratings.json   (list of retreat dicts)

Outputs:
    retreats-enriched-ratings.json  (final list, with rating fields filled
                                     where possible)
    enrichment-progress.json        (resume checkpoint, written every 10 rows)
"""

from __future__ import annotations

import json
import os
import random
import re
import sys
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any, Optional
from urllib.parse import urlparse, urljoin, quote_plus, unquote

import requests
from bs4 import BeautifulSoup


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DATA_DIR = Path(__file__).resolve().parent
INPUT_FILE = DATA_DIR / "retreats-without-ratings.json"
OUTPUT_FILE = DATA_DIR / "retreats-enriched-ratings.json"
PROGRESS_FILE = DATA_DIR / "enrichment-progress.json"

CHECKPOINT_EVERY = 10
MIN_DELAY = 2.0
MAX_DELAY = 3.5
REQUEST_TIMEOUT = 20

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
]

DDG_HTML_URL = "https://html.duckduckgo.com/html/"


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------


@dataclass
class RatingResult:
    rating: Optional[float] = None        # normalized 1-5
    review_count: Optional[int] = None
    source: Optional[str] = None          # "google", "tripadvisor", ...
    source_url: Optional[str] = None
    raw: Optional[str] = None             # raw matched snippet for debugging


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------


def _headers() -> dict[str, str]:
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }


def polite_sleep() -> None:
    time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))


def http_get(url: str, *, timeout: int = REQUEST_TIMEOUT) -> Optional[requests.Response]:
    try:
        resp = requests.get(url, headers=_headers(), timeout=timeout, allow_redirects=True)
        if resp.status_code == 200:
            return resp
    except requests.RequestException as exc:
        print(f"  ! HTTP error for {url}: {exc}", file=sys.stderr)
    return None


# ---------------------------------------------------------------------------
# DuckDuckGo HTML search
# ---------------------------------------------------------------------------


def ddg_search(query: str, max_results: int = 15) -> list[dict[str, str]]:
    """Returns a list of {title, url, snippet} from DuckDuckGo HTML."""
    try:
        resp = requests.post(
            DDG_HTML_URL,
            data={"q": query, "kl": "us-en"},
            headers=_headers(),
            timeout=REQUEST_TIMEOUT,
        )
    except requests.RequestException as exc:
        print(f"  ! DDG error: {exc}", file=sys.stderr)
        return []

    if resp.status_code != 200:
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    results: list[dict[str, str]] = []

    for r in soup.select("div.result")[:max_results]:
        a = r.select_one("a.result__a")
        snippet_el = r.select_one(".result__snippet")
        if not a:
            continue
        href = a.get("href", "")
        # DDG wraps urls in /l/?uddg=...
        real = href
        m = re.search(r"uddg=([^&]+)", href)
        if m:
            real = unquote(m.group(1))
        results.append(
            {
                "title": a.get_text(" ", strip=True),
                "url": real,
                "snippet": snippet_el.get_text(" ", strip=True) if snippet_el else "",
            }
        )
    return results


# ---------------------------------------------------------------------------
# Rating extraction helpers
# ---------------------------------------------------------------------------


# Matches things like:
#   "Rating: 4.8 · 123 reviews"
#   "4.8 stars - 123 reviews"
#   "4.8 (123)"
#   "4,8 (123)"  (some locales)
RATING_PATTERNS = [
    re.compile(
        r"(?P<rating>\d(?:[.,]\d)?)\s*(?:/\s*5)?\s*(?:stars?|★|out of 5)?\s*[·\-–—(]\s*"
        r"(?P<count>\d[\d,]*)\s*(?:reviews?|ratings?|votes?|\))",
        re.IGNORECASE,
    ),
    re.compile(
        r"Rating:\s*(?P<rating>\d(?:[.,]\d)?)\s*[·\-–—]?\s*(?P<count>\d[\d,]*)?\s*reviews?",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?P<rating>\d(?:[.,]\d)?)\s*\(\s*(?P<count>\d[\d,]*)\s*\)",
    ),
]

# Looser pattern: rating without count
RATING_ONLY = re.compile(
    r"(?:Rating|Rated|Score)[:\s]+(?P<rating>\d(?:[.,]\d)?)\s*(?:/\s*(?P<scale>5|10))?",
    re.IGNORECASE,
)


def _normalize_rating(value: str, scale: float = 5.0) -> Optional[float]:
    try:
        v = float(value.replace(",", "."))
    except (TypeError, ValueError):
        return None
    if v <= 0:
        return None
    if scale == 10 or v > 5.0:
        v = v / 2.0
    if v > 5.0:
        return None
    return round(v, 2)


def _parse_count(value: Optional[str]) -> Optional[int]:
    if not value:
        return None
    try:
        return int(value.replace(",", "").replace(".", ""))
    except ValueError:
        return None


def extract_rating_from_text(text: str, *, scale_hint: Optional[float] = None) -> Optional[RatingResult]:
    """Try multiple patterns to extract a rating + review count from arbitrary text."""
    if not text:
        return None

    for pat in RATING_PATTERNS:
        m = pat.search(text)
        if not m:
            continue
        rating = _normalize_rating(m.group("rating"), scale=scale_hint or 5.0)
        if rating is None:
            continue
        count = _parse_count(m.groupdict().get("count"))
        return RatingResult(rating=rating, review_count=count, raw=m.group(0))

    m = RATING_ONLY.search(text)
    if m:
        scale = float(m.group("scale")) if m.group("scale") else (scale_hint or 5.0)
        rating = _normalize_rating(m.group("rating"), scale=scale)
        if rating is not None:
            return RatingResult(rating=rating, raw=m.group(0))

    return None


# ---------------------------------------------------------------------------
# Source-specific parsers
# ---------------------------------------------------------------------------


def parse_google_snippet(snippet: str, url: str) -> Optional[RatingResult]:
    """Google Maps / Places snippets typically contain '4.8 (123)' or '4.8 · 123 reviews'."""
    res = extract_rating_from_text(snippet)
    if res:
        res.source = "google"
        res.source_url = url
    return res


def parse_tripadvisor(snippet: str, url: str) -> Optional[RatingResult]:
    res = extract_rating_from_text(snippet)
    if res:
        res.source = "tripadvisor"
        res.source_url = url
        return res

    # Fall back to fetching the TripAdvisor page itself
    resp = http_get(url)
    if not resp:
        return None
    soup = BeautifulSoup(resp.text, "html.parser")

    # JSON-LD often holds aggregateRating
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "{}")
        except (json.JSONDecodeError, TypeError):
            continue
        candidates = data if isinstance(data, list) else [data]
        for entry in candidates:
            if not isinstance(entry, dict):
                continue
            agg = entry.get("aggregateRating")
            if isinstance(agg, dict) and agg.get("ratingValue"):
                rating = _normalize_rating(str(agg["ratingValue"]),
                                           scale=float(agg.get("bestRating", 5)))
                count = _parse_count(str(agg.get("reviewCount") or agg.get("ratingCount") or ""))
                if rating is not None:
                    return RatingResult(
                        rating=rating,
                        review_count=count,
                        source="tripadvisor",
                        source_url=url,
                        raw="ld+json",
                    )

    return extract_rating_from_text(soup.get_text(" ", strip=True)[:5000])


def parse_facebook(snippet: str, url: str) -> Optional[RatingResult]:
    res = extract_rating_from_text(snippet)
    if res:
        res.source = "facebook"
        res.source_url = url
    return res


def parse_yelp(snippet: str, url: str) -> Optional[RatingResult]:
    res = extract_rating_from_text(snippet)
    if res:
        res.source = "yelp"
        res.source_url = url
    return res


def parse_own_website(url: str) -> Optional[RatingResult]:
    """Look for testimonials/aggregateRating on the retreat's own website."""
    resp = http_get(url)
    if not resp:
        return None
    soup = BeautifulSoup(resp.text, "html.parser")

    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "{}")
        except (json.JSONDecodeError, TypeError):
            continue
        candidates = data if isinstance(data, list) else [data]
        for entry in candidates:
            if not isinstance(entry, dict):
                continue
            agg = entry.get("aggregateRating")
            if isinstance(agg, dict) and agg.get("ratingValue"):
                rating = _normalize_rating(
                    str(agg["ratingValue"]),
                    scale=float(agg.get("bestRating", 5)),
                )
                count = _parse_count(
                    str(agg.get("reviewCount") or agg.get("ratingCount") or "")
                )
                if rating is not None:
                    return RatingResult(
                        rating=rating,
                        review_count=count,
                        source="website",
                        source_url=url,
                        raw="ld+json",
                    )
    return None


# ---------------------------------------------------------------------------
# Top-level enrichment for one retreat
# ---------------------------------------------------------------------------


def _is_us(country: Optional[str]) -> bool:
    if not country:
        return False
    c = country.strip().lower()
    return c in {"us", "usa", "united states", "united states of america"}


def enrich_one(retreat: dict[str, Any]) -> Optional[RatingResult]:
    name = (retreat.get("name") or "").strip()
    city = (retreat.get("city") or "").strip()
    region = (retreat.get("region") or "").strip()
    country = (retreat.get("country") or "").strip()
    website = (retreat.get("website_url") or "").strip()

    if not name:
        return None

    location_bits = " ".join(p for p in [city, region, country] if p)
    query = f"{name} {city or region or country} reviews".strip()

    print(f"  > search: {query}")
    results = ddg_search(query, max_results=15)
    polite_sleep()

    # Categorize results by domain
    google_hits: list[dict[str, str]] = []
    ta_hits: list[dict[str, str]] = []
    fb_hits: list[dict[str, str]] = []
    yelp_hits: list[dict[str, str]] = []
    own_hits: list[dict[str, str]] = []

    own_host = urlparse(website).netloc.lower().lstrip("www.") if website else ""

    for r in results:
        host = urlparse(r["url"]).netloc.lower()
        if "google." in host and ("/maps" in r["url"] or "maps.google" in host):
            google_hits.append(r)
        elif "tripadvisor." in host:
            ta_hits.append(r)
        elif "facebook.com" in host:
            fb_hits.append(r)
        elif "yelp.com" in host:
            yelp_hits.append(r)
        elif own_host and own_host in host:
            own_hits.append(r)

    # Also try to extract from any snippet (some search engines surface ratings inline)
    # Priority order: Google Maps -> TripAdvisor -> Facebook -> Yelp(US) -> own website
    for hit in google_hits:
        res = parse_google_snippet(hit["snippet"] + " " + hit["title"], hit["url"])
        if res and res.rating is not None:
            return res

    for hit in ta_hits:
        res = parse_tripadvisor(hit["snippet"] + " " + hit["title"], hit["url"])
        if res and res.rating is not None:
            return res
        polite_sleep()

    for hit in fb_hits:
        res = parse_facebook(hit["snippet"] + " " + hit["title"], hit["url"])
        if res and res.rating is not None:
            return res

    if _is_us(country):
        for hit in yelp_hits:
            res = parse_yelp(hit["snippet"] + " " + hit["title"], hit["url"])
            if res and res.rating is not None:
                return res

    # Generic snippet scan as last DDG-side resort
    for hit in results:
        res = extract_rating_from_text(hit["snippet"])
        if res and res.rating is not None:
            res.source = res.source or "search-snippet"
            res.source_url = hit["url"]
            return res

    # Finally try the retreat's own website (testimonials / JSON-LD)
    if website:
        res = parse_own_website(website)
        if res and res.rating is not None:
            return res
        polite_sleep()

    return None


# ---------------------------------------------------------------------------
# Driver / resume logic
# ---------------------------------------------------------------------------


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def save_json(path: Path, data: Any) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
    tmp.replace(path)


def _retreat_key(retreat: dict[str, Any]) -> str:
    return (
        retreat.get("source_url")
        or f"{retreat.get('name','')}|{retreat.get('city','')}|{retreat.get('country','')}"
    )


def main() -> int:
    if not INPUT_FILE.exists():
        print(f"Input file not found: {INPUT_FILE}", file=sys.stderr)
        return 1

    retreats: list[dict[str, Any]] = load_json(INPUT_FILE)
    print(f"Loaded {len(retreats)} retreats from {INPUT_FILE.name}")

    # Resume from progress, if any
    processed: dict[str, dict[str, Any]] = {}
    if PROGRESS_FILE.exists():
        try:
            progress = load_json(PROGRESS_FILE)
            processed = {row["_key"]: row for row in progress.get("rows", [])}
            print(f"Resuming - {len(processed)} already processed.")
        except Exception as exc:
            print(f"Could not read progress file ({exc}); starting fresh.")

    enriched: list[dict[str, Any]] = []
    found_count = 0
    started = time.time()

    for i, retreat in enumerate(retreats, start=1):
        key = _retreat_key(retreat)
        if key in processed:
            row = processed[key]
            enriched.append(row)
            if row.get("rating") is not None:
                found_count += 1
            continue

        print(f"[{i}/{len(retreats)}] {retreat.get('name','?')} - "
              f"{retreat.get('city') or retreat.get('country','?')}")
        try:
            result = enrich_one(retreat)
        except Exception as exc:
            print(f"  ! enrich error: {exc}", file=sys.stderr)
            result = None

        row = dict(retreat)
        row["_key"] = key
        if result and result.rating is not None:
            row["rating"] = result.rating
            row["review_count"] = result.review_count
            row["rating_source"] = result.source
            row["rating_source_url"] = result.source_url
            row["rating_raw"] = result.raw
            found_count += 1
            print(f"  ✓ {result.rating} ({result.review_count or '?'} reviews) "
                  f"via {result.source}")
        else:
            row["rating"] = None
            row["review_count"] = None
            row["rating_source"] = None
            print("  · no rating found")

        processed[key] = row
        enriched.append(row)

        if i % CHECKPOINT_EVERY == 0:
            save_json(
                PROGRESS_FILE,
                {
                    "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "total": len(retreats),
                    "completed": i,
                    "found": found_count,
                    "rows": list(processed.values()),
                },
            )
            elapsed = time.time() - started
            rate = i / elapsed if elapsed else 0
            eta = (len(retreats) - i) / rate if rate else 0
            print(
                f"  -- checkpoint: {i}/{len(retreats)} done, "
                f"{found_count} found, ETA {eta/60:.1f} min"
            )

        polite_sleep()

    save_json(OUTPUT_FILE, enriched)
    save_json(
        PROGRESS_FILE,
        {
            "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "total": len(retreats),
            "completed": len(retreats),
            "found": found_count,
            "rows": list(processed.values()),
        },
    )
    print(f"\nDone. Wrote {OUTPUT_FILE.name} ({found_count}/{len(retreats)} enriched).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
