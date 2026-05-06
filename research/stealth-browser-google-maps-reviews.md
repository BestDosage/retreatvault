# Stealth Browser Automation for Google Maps Reviews — Research (May 2026)

## 1. rebrowser-playwright

**What:** Drop-in replacement for `playwright`, patched via [rebrowser-patches](https://github.com/rebrowser/rebrowser-patches) to pass modern automation detection tests. Patches at the JavaScript/CDP level — removes bot-like traces left by Playwright's runtime.

**npm:** `rebrowser-playwright`
**Install:** `npm install rebrowser-playwright`
**Version:** 1.52.0 (published ~1 year ago, version tracks Playwright major.minor)
**Usage:** Literally replace `require('playwright')` with `require('rebrowser-playwright')`. Zero code changes.

**Against Google:** Designed to beat Cloudflare and DataDome. Google Maps is lighter detection than those — should work. Not specifically battle-tested against Google's Picasso canvas fingerprinting.

**Verdict:** Best Node.js option for Chromium-based stealth. Active project.

---

## 2. playwright-extra + stealth plugin

**npm packages:**
- `playwright-extra` (v4.3.6, published 3 years ago)
- `puppeteer-extra-plugin-stealth` (companion stealth evasions)

**Install:**
```bash
npm install playwright-extra puppeteer-extra-plugin-stealth
```

**Does stealth work with Playwright?** YES. `playwright-extra` is a drop-in for `playwright` that supports puppeteer-extra plugins including stealth.

**Usage (TypeScript):**
```ts
import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
chromium.use(StealthPlugin())
// then normal Playwright API
```

**Current status: EFFECTIVELY UNMAINTAINED.**
- Core package: no meaningful update since March 2023
- Stealth patches written for Chrome 109-112 era detection
- FAILS against: Cloudflare Turnstile, Cloudflare Bot Fight Mode (2024+), DataDome behavioral analysis, Akamai Bot Manager v4, PerimeterX/HUMAN
- No active lead maintainer
- Python equivalent (`playwright-stealth`) IS maintained (v2.0.2, April 2026)

**Verdict:** Don't build new infrastructure around it. Works only on sites with no active WAF or outdated detection.

---

## 3. Camoufox

**What:** Anti-detect browser built on a Firefox fork. Applies stealth patches at the C++ level (not JavaScript injection). Based on research from Tor project, Arkenfox, and CreepJS. Every fingerprint property (navigator, WebGL, screen, fonts, WebRTC, canvas, AudioContext) intercepted before reaching the page.

**Benchmark:** 0% headless detection rate — no other open-source tool matches this.

**Tradeoffs:**
- Average bypass time: 42.49 seconds (Cloudflare Turnstile)
- Memory: 200MB+ per instance
- Firefox-only (no Chrome emulation)
- Year-long maintenance gap; resumed late 2025/early 2026
- Latest: v146.0.1-beta.25 (Jan 2026) — highly experimental, expect breaking changes

**Node.js/TypeScript usage — THREE options:**

### Option A: Official JS port (Apify) — RECOMMENDED
```bash
npm install camoufox-js
npx camoufox-js fetch  # download the browser binary
```
```ts
import { Camoufox } from 'camoufox-js';
const browser = await Camoufox({});
const page = await browser.newPage(); // standard Playwright Page
```
Or with custom Playwright options:
```ts
import { launchOptions } from 'camoufox-js';
import { firefox } from 'playwright-core';
const browser = await firefox.launch({
  ...await launchOptions({ /* camoufox opts */ }),
  // additional Playwright options
});
```

### Option B: camoufox-connector (Python server + WebSocket)
Python server wraps Camoufox, exposes Playwright-compatible WebSocket endpoints. Node.js connects via `playwright.connect()`. More complex setup. See: https://github.com/pim97/camoufox-connector

### Option C: node-camoufox (proof-of-concept)
Bridges Camoufox's Python automation into Node.js. See: https://github.com/DemonMartin/node-camoufox

**Verdict:** Maximum stealth, but Firefox-only and beta-quality JS bindings. Best for high-security targets.

---

## 4. Patchright (BONUS — discovered during research)

**What:** Drop-in Playwright replacement that patches the Chromium binary at BUILD time. Removes `HeadlessChrome` UA string, WebDriver capability, and the `Runtime.enable` CDP leak that Cloudflare specifically watches for.

**Key advantage over playwright-extra:** Patches happen before browser process starts, not in page context. Survives `Object.defineProperty` guards. TLS fingerprint closer to real Chrome.

**npm:** `patchright`
**Detection rate:** Consistently passes nowsecure.nl. Varies on Akamai/PerimeterX (behavioral analysis still catches it).

**Verdict:** Most practical upgrade path from playwright-extra for Node.js + Chromium.

---

## 5. Google Maps Review Page Structure

### How reviews load
1. **Everything is JS-rendered.** Initial HTML has zero reviews. JavaScript makes API calls to populate.
2. **Initial load:** 10-20 reviews appear
3. **Scroll loading:** Additional reviews load as you scroll within the reviews panel
4. **No traditional pagination** — infinite scroll inside a side panel container

### URL format
- Place page: `https://www.google.com/maps/place/PLACE+NAME/@LAT,LNG,17z/data=...`
- Write review link: `https://search.google.com/local/writereview?placeid=PLACE_ID`
- No dedicated "all reviews" URL — you open the place page and click the Reviews tab

### Key DOM selectors (as of early 2026 — Google changes these periodically)

| Element | Selector |
|---------|----------|
| Reviews tab | `button[aria-label*="reviews"]` or `[data-tab-index="1"]` |
| Sort button | `button[aria-label*="Sort reviews"]` or `[data-value="Sort"]` |
| Sort menu items | `[role="menuitemradio"]` or `[role="option"]` |
| Scrollable reviews container | `[class*="m6QErb"][class*="DxyBCb"]` |
| Individual review | `[data-review-id]` |
| Reviewer name | `[class*="d4r55"]` |
| Rating stars | `[aria-label*="star"]` (parse number from aria-label) |
| Review text | `[class*="wiI7pd"]` |
| Review date | `[class*="rsqaWe"]` |
| Owner response | `[class*="CDe7pd"]` |
| Local Guide badge | `[aria-label*="Local Guide"]` |
| "See more" (expand text) | `button[aria-label*="See more"]` |

### Scroll pagination pattern
```ts
const scrollable = page.locator('[class*="m6QErb"][class*="DxyBCb"]').first;
// Scroll loop
while (collected < maxReviews) {
  await scrollable.evaluate("el => el.scrollTop += 1000");
  await page.waitForTimeout(1500); // wait for new reviews to load
  const elements = await page.locator('[data-review-id]').all();
  // process new elements...
}
```

### Sort options (via menu click, not URL)
| Sort | Menu index |
|------|------------|
| Most relevant | 0 |
| Newest | 1 |
| Highest rating | 2 |
| Lowest rating | 3 |

Click sort button → wait for menu → click `menu_items[index]`.

---

## 6. Google's Detection Methods

### What Google checks
- **`navigator.webdriver`** — automation marker, trivially spoofed by stealth tools
- **Canvas fingerprinting** — Google uses **Picasso**: dynamic canvas challenges with per-execution seeds (not static). Harder to spoof than standard canvas FP.
- **WebGL renderer/vendor** — checks GPU strings for consistency with reported OS/browser
- **TLS fingerprint (JA3/JA4)** — headless browsers have distinct TLS handshakes
- **`Runtime.enable` CDP leak** — Cloudflare/Google can detect if CDP (Chrome DevTools Protocol) is active. rebrowser-playwright and Patchright specifically patch this.
- **Behavioral analysis** — mouse movement patterns, scroll speeds, click timing. Bots move in straight lines, scroll at constant speeds, never misclick.
- **Session/cookie tracking** — cold sessions from datacenter IPs get challenged immediately. Need session "warm-up."
- **IP reputation** — datacenter IPs flagged instantly. Residential proxies required for volume.

### What triggers CAPTCHAs
- Datacenter IP addresses
- High request rates from single IP
- Missing/inconsistent cookies
- Cold sessions hitting Maps directly
- Headless browser detection signals (navigator.webdriver, missing APIs)
- Behavioral anomalies (no mouse movement, instant scrolling)

### Rate limiting patterns
- No hard published limits for web scraping
- Practical observation: aggressive scraping from single IP triggers CAPTCHA within 50-200 requests
- Google's Feb 2026 "limited view" lock — restricts what unauthenticated sessions can see
- Residential proxy rotation + session warm-up extends window significantly

---

## 7. What Actually Works in 2025-2026

### Approach 1: rebrowser-playwright or Patchright + residential proxies (RECOMMENDED for Node.js)
- Drop-in Playwright replacement
- Chromium-based, closest to real Chrome
- Pair with residential proxy rotation
- Add random delays, human-like mouse movements
- Session warm-up (visit google.com first, accept cookies, then navigate to Maps)

### Approach 2: google-reviews-scraper-pro (Python, production-ready)
- https://github.com/georgekhananaev/google-reviews-scraper-pro (201 stars, 37 forks)
- Works in 2026, actively maintained
- Uses SeleniumBase undetected chromedriver
- Bypassed Google's Feb 2026 "limited view" lock same day via search-based navigation (no login needed)
- Features: multi-language reviews, images, MongoDB/SQLite, incremental scraping, REST API mode
- Python-only

### Approach 3: Camoufox (maximum stealth, for hardened targets)
- 0% detection rate
- Overkill for Google Maps (Google Maps detection is moderate, not enterprise-grade)
- Use if other approaches start getting blocked

### Approach 4: SaaS APIs (no maintenance burden)
- **Outscraper** — dedicated Google Maps reviews API
- **Apify** — Google Maps Reviews Scraper actor (94% success rate)
- **SerpAPI** — structured reviews API with sort/filter params
- **ScrapeBadger** — Maps endpoint with place_id lookup
- Cost: $0.001-0.01 per review depending on provider

### What people report working (community consensus)
1. Playwright/Puppeteer with stealth patches + residential proxies is the standard approach
2. Random delays (1-3s between actions) are essential
3. Human-like typing in search box (character by character, random intervals)
4. Session warm-up before hitting Maps
5. Rotate user agents and viewport sizes
6. Google's CSS selectors change periodically — build with fallback selectors
7. The official Places API (5 reviews max, $17/1K requests) is useless for serious work

---

## Tool Comparison Summary

| Tool | Language | Engine | Detection Rate | Maintenance | Best For |
|------|----------|--------|---------------|-------------|----------|
| rebrowser-playwright | Node.js | Chromium | Low | Active | General stealth scraping |
| Patchright | Node.js | Chromium | Low | Active | Cloudflare-protected sites |
| playwright-extra + stealth | Node.js | Chromium | HIGH (detected) | Dead since 2023 | Legacy only |
| Camoufox | Python (JS experimental) | Firefox | 0% | Beta, resumed 2026 | Maximum stealth |
| google-reviews-scraper-pro | Python | Chromium/Selenium | Low | Active | Google reviews specifically |

## Sources

- https://www.npmjs.com/package/rebrowser-playwright
- https://github.com/rebrowser/rebrowser-playwright
- https://www.npmjs.com/package/playwright-extra
- https://github.com/apify/camoufox-js
- https://github.com/pim97/camoufox-connector
- https://camoufox.com/
- https://github.com/Kaliiiiiiiiii-Vinyzu/patchright
- https://scrapewise.ai/blogs/playwright-stealth-2026
- https://scrapebadger.com/blog/how-to-scrape-google-maps-reviews-the-complete-guide-2026
- https://scrap.io/scrape-google-maps-reviews-python
- https://github.com/georgekhananaev/google-reviews-scraper-pro
- https://scrapfly.io/blog/posts/how-to-scrape-google-maps
