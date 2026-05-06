# Google Reviews Extraction Options — Research (May 2026)

**Goal:** Extract full review TEXT (not just ratings) for 218 wellness retreats, ~100-500 reviews each.
**Estimated total reviews:** 21,800 to 109,000

---

## 1. Google Places API (Official)

**Review Limit:** Hard-capped at **5 reviews per place**. No pagination. This has been a known limitation since 2015 (Google Issue Tracker #35825957) and Google has never addressed it.

**Fields available:** Review text, author name, author photo, relative time description, rating, language, original language. But only 5 most "relevant" reviews returned.

**Pricing:** Place Details with reviews requires the **Pro SKU** (reviews field). Cost is ~$17-20 per 1,000 requests. With $200/month free credit (discontinued Feb 2025, replaced by per-SKU free caps: 5,000 free Pro requests/month).

**Cost for 218 retreats:** Nearly free (218 requests = well within free tier). BUT you only get 5 reviews per place = **1,090 reviews total**. Useless for our needs.

**Verdict: DISQUALIFIED.** 5-review cap makes it worthless for review analysis. Only useful for getting Place IDs to feed into other tools.

---

## 2. Outscraper

**URL:** https://outscraper.com/google-maps-reviews-scraper/

**How it works:** Scrapes Google Maps directly. No review count limit — can pull ALL reviews for a business.

**Pricing (pay-as-you-go, no subscription):**
| Tier | Volume | Cost |
|------|--------|------|
| Free | First 500 reviews | $0 |
| Medium | 501–50,000 reviews | $4/1,000 reviews |
| Business | 50,001+ reviews | $1/1,000 reviews |

**Output format:** JSON, CSV, XLSX. Fields: review text, rating, author, date, response from owner, review URL, reviewer details.

**Cost estimate for RetreatVault:**
- Low end (218 × 100 = 21,800 reviews): 500 free + 21,300 × $4/1K = **~$85**
- High end (218 × 500 = 109,000 reviews): 500 free + 49,500 × $4/1K + 59,000 × $1/1K = **~$257**

**API available:** Yes, REST API with async processing for large jobs.

**Legality:** Operates in gray area — scraping Google Maps violates Google TOS. Outscraper assumes the legal risk as the service provider.

**Verdict: STRONG OPTION.** Cheap, unlimited reviews, proven at scale, API available, no maintenance burden.

---

## 3. Apify — Google Maps Reviews Scraper

**URL:** https://apify.com/compass/google-maps-reviews-scraper

**How it works:** HTTP-only scraper (no browser) hitting Google's internal API. Fast — 1,000 reviews in under 60 seconds.

**Pricing:**
- Pay-per-event: ~$0.25–$0.40 per 1,000 reviews (all platform costs included)
- $29/month Starter plan = ~58,000 reviews/month
- First 40 reviews free per query

**Cost estimate for RetreatVault:**
- Low end (21,800 reviews): ~$5–9 on pay-per-event
- High end (109,000 reviews): ~$27–44 on pay-per-event, or 2 months of $29 Starter

**Output format:** JSON. Fields: review text, rating, author, date, response from owner, photos, review URL.

**Reliability notes:**
- Recent Google updates reduced hotel review availability specifically
- Setting "Reviews origin" to Google-only targets native reviews
- Results may fluctuate — test run recommended

**Legality:** Same gray area as Outscraper.

**Verdict: BEST VALUE.** Cheapest option by far. HTTP-only = fast and reliable. Apify platform handles infrastructure.

---

## 4. SerpAPI — Google Maps Reviews

**URL:** https://serpapi.com/google-maps-reviews-api

**How it works:** Structured API that returns Google Maps review data as JSON. Supports pagination via `next_page_token`. Returns 8 reviews on first page, up to 20 per subsequent page.

**Pricing (subscription-based, per-search credits):**
| Plan | Price | Searches/month |
|------|-------|----------------|
| Free | $0 | 250 |
| Starter | $25 | 1,000 |
| Developer | $75 | 5,000 |
| Production | $150 | 15,000 |
| Big Data | $275 | 30,000 |

**Each page of reviews = 1 search credit.** So 500 reviews for one location = ~25-30 searches.

**Cost estimate for RetreatVault:**
- Low end (21,800 reviews, ~10 pages × 218 places = 2,180 searches): Developer plan $75
- High end (109,000 reviews, ~28 pages × 218 places = 6,100 searches): Production $150 or Developer + early renewal ~$150

**Output format:** Structured JSON with review text, rating, date, author, likes, response from owner, photos.

**Legality:** SerpAPI positions itself as legal — they claim compliance with search engine guidelines. US Legal Shield included in all plans.

**Verdict: GOOD OPTION.** Clean API, good pagination support, structured data. More expensive than Apify/Outscraper but includes legal protection positioning. Unused searches expire monthly (no rollover).

---

## 5. Lobstr.io — Google Maps Reviews Scraper

**URL:** https://www.lobstr.io/store/google-maps-reviews-scraper

**How it works:** Cloud-based scraper with pre-built Google Reviews extractor. No code required.

**Pricing:**
- $0.40 per 1,000 reviews (standard)
- $0.10 per 1,000 reviews (at scale/high volume plans)
- Monthly subscription plans from $20–$500
- 1 credit = 1 unique review (no duplicate charges)
- Up to 1.6M reviews/month without enterprise plan

**Cost estimate for RetreatVault:**
- Low end (21,800 reviews): ~$9–20 depending on plan
- High end (109,000 reviews): ~$11–44 depending on plan

**Output format:** JSON, CSV.

**Legality:** Same gray area as other scrapers.

**Verdict: SOLID OPTION.** Competitive pricing, simple UI, good for non-technical use. Credits don't roll over.

---

## 6. Building Our Own with Playwright

**How it would work:** Browser automation to open each retreat's Google Maps page, scroll through reviews panel, extract DOM content.

**Detection risk: HIGH.**
- Vanilla Playwright gets flagged within 10–50 requests on residential IPs
- Almost immediately flagged on datacenter IPs
- Google uses: JA3 TLS fingerprinting, HTTP/2 frame ordering, adaptive CAPTCHAs, behavioral fingerprinting, IP blocking, rate limiting

**Mitigation required:**
- Camoufox (Firefox-based, real network stack) or similar stealth browser
- Residential proxy rotation ($4–15/GB)
- Human-like scroll patterns, random delays
- Session management

**Pagination:** Reviews load via infinite scroll in the reviews panel. Must scroll, wait for lazy load, repeat. ~10 reviews per scroll batch.

**Development time:** 2-4 days for initial build, ongoing maintenance as Google changes DOM/anti-bot.

**Cost estimate:**
- Proxy costs: $50–200 for residential proxies
- Dev time: 16-32 hours
- Maintenance: ongoing, unpredictable breakage

**Legality:** Clearly violates Google TOS. Direct legal risk falls on you (unlike third-party services).

**Verdict: NOT RECOMMENDED.** High dev cost, high maintenance, high detection risk, direct legal exposure. Only makes sense if you need this as a recurring pipeline AND want to avoid third-party dependencies.

---

## 7. Firecrawl

**Can it scrape Google Maps reviews?** **No.** Firecrawl explicitly cannot extract Google Maps data, local pack rankings, or map-embedded content. While it has `/interact` actions (scroll, click, wait), it's not designed for Google Maps' JavaScript-heavy SPA.

**Verdict: DISQUALIFIED.** Not built for this use case.

---

## 8. Other Notable Options

### Bright Data
- SERP API at $1/1,000 requests, Web Scraper at $3/1,000 page loads
- 437+ pre-built scrapers, Google Reviews likely included
- Enterprise-oriented, pricing can be opaque
- Estimated cost: $50–150 for our volume
- Overkill for a one-time job

### Featurable API
- **Free** API that returns more than 5 Google reviews
- Designed for embedding review widgets, not bulk extraction
- Unclear review limits, likely not built for 218-location bulk jobs
- Worth testing for supplementary data

### ScrapingBee
- Google Reviews scraper API with free signup credits
- Pay-per-request model
- Less specialized than Outscraper/Apify for this specific use case

### Open Source (github.com/omkarcloud/google-maps-reviews-scraper)
- Free, Python-based
- Uses browser automation (same detection risks as DIY Playwright)
- Community-maintained, breakage possible
- Good for testing, risky for production

### Open Source (github.com/georgekhananaev/google-reviews-scraper-pro)
- Works in 2026, multi-language, MongoDB integration
- Incremental scraping, image downloading
- Free but requires self-hosting and proxy management

---

## Recommendation Matrix

| Option | Cost (low est.) | Cost (high est.) | Max Reviews | Maintenance | Legal Risk | Reliability |
|--------|----------------|-------------------|-------------|-------------|------------|-------------|
| **Apify** | **$5** | **$44** | Unlimited | None | Low (3rd party) | High |
| **Lobstr.io** | $9 | $44 | 1.6M/mo | None | Low (3rd party) | High |
| **Outscraper** | $85 | $257 | Unlimited | None | Low (3rd party) | High |
| SerpAPI | $75 | $150 | Unlimited | None | Low (legal shield) | High |
| Bright Data | $50 | $150 | Unlimited | None | Low (3rd party) | High |
| DIY Playwright | $50 | $200+ | Unlimited | **High** | **High (direct)** | Low-Medium |
| Google Places API | Free | Free | **5 per place** | None | None | N/A |
| Firecrawl | N/A | N/A | N/A | N/A | N/A | N/A |

## Top Recommendation

**Apify Google Maps Reviews Scraper** — best price-to-value. Run a test with 5 retreats first to validate data quality and review counts. If results are inconsistent (especially for wellness retreats which may have fewer Google-native reviews), fall back to **Outscraper** which has the most proven track record at scale.

**Execution plan:**
1. Use Google Places API to get Place IDs for all 218 retreats (free)
2. Feed Place IDs into Apify actor
3. Export JSON with full review text, ratings, dates, authors
4. Total cost: likely **under $50** for all 218 retreats
