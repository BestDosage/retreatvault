# Google Reviews Extraction — Options Assessment & Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract full review text for all 218 RetreatVault retreats to power the Guest Intelligence layer.

**Architecture:** Two-stage pipeline — (1) use existing Google Places API to get Place IDs, (2) feed Place IDs into a bulk review extractor to pull full review text, then (3) store in Supabase and synthesize with Claude.

**Tech Stack:** Google Places API (existing), Apify (recommended extractor), Supabase, Claude API

---

## Options Assessment

### Option 1: Google Places API (Official)

| Factor | Detail |
|--------|--------|
| **Review limit** | **5 reviews max per place. No pagination. Hard cap.** |
| **Cost** | $0.017/request. ~$3.70 for 218 retreats. Within $300 free tier. |
| **Fields available** | author, text, rating, time, language, profile photo |
| **TOS** | Fully compliant |
| **Reliability** | 100% — it's Google's own API |
| **Maintenance** | Zero |
| **Verdict** | **Good for Place IDs and basic ratings. Useless for review corpus.** 5 reviews per retreat is not enough to synthesize patterns. Use this as Step 1 only. |

### Option 2: Apify Google Maps Reviews Scraper

| Factor | Detail |
|--------|--------|
| **Review limit** | Unlimited — can pull every review for a location |
| **Cost** | $0.25-0.40 per 1,000 reviews. **~$5-44 total for all 218 retreats** (depends on review count per retreat). Free tier: $5/month of compute included. |
| **How it works** | HTTP-only scraper (no browser), feeds Place IDs or URLs, returns structured JSON |
| **Speed** | ~1,000 reviews per 60 seconds |
| **Fields returned** | author, text, rating, date, response from owner, review URL, photos |
| **TOS** | Gray area — scrapes Google but Apify handles the infrastructure risk, not you |
| **Reliability** | High — Apify maintains the actor, handles Google's anti-bot changes |
| **Maintenance** | Zero — Apify maintains the scraper |
| **Verdict** | **Best option. Cheapest, fastest, zero maintenance.** You pay Apify, they deal with Google's blocks. |

### Option 3: Outscraper

| Factor | Detail |
|--------|--------|
| **Review limit** | Unlimited |
| **Cost** | $4/1,000 reviews (medium tier), $1/1,000 after 50K. **~$85-257 for all 218 retreats.** |
| **How it works** | Cloud API — submit Place IDs, get JSON back |
| **Speed** | Slower than Apify — batch jobs, minutes to hours |
| **TOS** | Same gray area as Apify |
| **Reliability** | Very high — most proven service at enterprise scale |
| **Maintenance** | Zero |
| **Verdict** | **Solid but 5-17x more expensive than Apify for the same data.** Better for enterprise scale (50K+ reviews). Overkill for 218 retreats. |

### Option 4: SerpAPI Google Reviews

| Factor | Detail |
|--------|--------|
| **Review limit** | 10 reviews per API call, paginated via `next_page_token` |
| **Cost** | $75/month for 5,000 searches. Each page of reviews = 1 search. **~$75-150/month.** No rollover. |
| **TOS** | Compliant — they serve SERP results, not scraping |
| **Reliability** | High |
| **Maintenance** | Zero |
| **Verdict** | **Subscription model is wasteful for a one-time extraction.** Good if you needed ongoing monitoring, bad for a batch job. |

### Option 5: Build Our Own Playwright Scraper

| Factor | Detail |
|--------|--------|
| **Review limit** | Technically unlimited if you beat the anti-bot |
| **Cost** | $0 in API costs. $20-50/month for residential proxies (Bright Data, SmartProxy). |
| **How it works** | Open Google Maps in headless browser, scroll reviews panel, extract DOM |
| **Anti-bot measures** | Google flags vanilla Playwright within 10-50 requests. Need: Camoufox/undetected-chromium, residential proxies, random delays, fingerprint rotation |
| **TOS** | **Violates Google TOS.** Legal risk is on you, not a third party. |
| **Reliability** | Low — Google updates anti-bot monthly, scraper breaks constantly |
| **Maintenance** | **High — 2-5 hours/month fixing broken selectors and anti-bot evasion** |
| **Verdict** | **Don't build this.** The maintenance burden alone costs more than Apify's $44 total. You'd be building a scraper maintenance business instead of a retreat review platform. |

### Option 6: Firecrawl

| Factor | Detail |
|--------|--------|
| **Verdict** | **Cannot scrape Google Maps.** Explicitly unsupported. Google blocks Firecrawl's infrastructure. Not an option. |

### Option 7: Lobstr.io

| Factor | Detail |
|--------|--------|
| **Review limit** | Unlimited |
| **Cost** | $0.40/1,000 reviews, drops to $0.10/1K at volume. $20/month minimum subscription. **~$9-44 for all 218 retreats** plus the $20 subscription. |
| **TOS** | Same gray area |
| **Reliability** | Good but less proven than Apify/Outscraper |
| **Verdict** | **Viable alternative to Apify** but the monthly subscription makes it worse for a batch job. |

---

## Recommendation: Apify

**Total cost: $5-44 for all 218 retreats.** Zero maintenance. Full review text with structured metadata.

The pipeline:

```
Places API (free, existing) → get Place IDs
         ↓
Apify Google Reviews actor → full review text
         ↓
Supabase `retreat_reviews` table → structured storage
         ↓
Claude API → synthesize into Guest Intelligence sections
         ↓
RetreatVault profile pages → display
```

---

## Implementation Plan

### Task 1: Get Place IDs for all retreats

**Files:**
- Modify: `scripts/enrich-google-ratings.ts` (already queries Places API)
- The script already pulls `google_rating` and `google_review_count` but may not store `place_id`

- [ ] **Step 1: Check if place_id is already stored**

```bash
cd ~/Projects/retreatvault
grep -n "place_id" scripts/enrich-google-ratings.ts
```

If not stored, add it to the Supabase update call.

- [ ] **Step 2: Run the enrichment script to collect Place IDs**

```bash
npx tsx scripts/enrich-google-ratings.ts --dry-run
```

Verify it finds retreats missing `place_id`. Then run without `--dry-run`.

- [ ] **Step 3: Verify Place IDs in Supabase**

Check that `place_id` is populated for the majority of retreats. Some may not have Google listings.

- [ ] **Step 4: Export Place IDs for Apify**

```bash
npx tsx -e "
import { config } from 'dotenv'; config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const { data } = await sb.from('retreats').select('id, name, place_id').not('place_id', 'is', null);
console.log(JSON.stringify(data, null, 2));
" > data/place-ids.json
```

- [ ] **Step 5: Commit**

```bash
git add scripts/enrich-google-ratings.ts data/place-ids.json
git commit -m "feat: collect Google Place IDs for review extraction"
```

---

### Task 2: Set up Apify and test with 5 retreats

**Files:**
- Create: `scripts/extract-google-reviews.ts`

- [ ] **Step 1: Create Apify account and get API token**

1. Sign up at https://apify.com (free tier includes $5 compute)
2. Go to Settings → Integrations → API token
3. Add to `.env.local`: `APIFY_API_KEY=apify_api_...`

- [ ] **Step 2: Find the Google Maps Reviews actor**

Search Apify Store for "Google Maps Reviews Scraper". The most popular one is `compass/Google-Maps-Reviews-Scraper` or similar. Note the actor ID.

- [ ] **Step 3: Write the extraction script**

```typescript
// scripts/extract-google-reviews.ts
import { config } from "dotenv";
config({ path: ".env.local" });

import { ApifyClient } from "apify-client";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const apify = new ApifyClient({ token: process.env.APIFY_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACTOR_ID = "compass/Google-Maps-Reviews-Scraper"; // verify exact ID

interface GoogleReview {
  author: string;
  text: string;
  rating: number;
  date: string;
  response_text?: string;
  review_url?: string;
}

async function extractReviews(placeIds: { id: string; name: string; place_id: string }[], maxReviews = 100) {
  console.log(`Extracting reviews for ${placeIds.length} retreats (max ${maxReviews} per retreat)...`);

  const input = {
    placeIds: placeIds.map(p => p.place_id),
    maxReviews,
    language: "en",
    personalData: false, // don't collect PII
  };

  const run = await apify.actor(ACTOR_ID).call(input);
  console.log(`Run finished. Status: ${run.status}`);

  const { items } = await apify.dataset(run.defaultDatasetId).listItems();
  console.log(`Got ${items.length} total reviews`);

  return items as GoogleReview[];
}

// --- Main ---
async function main() {
  const limit = parseInt(process.argv[2] || "5");
  const dryRun = process.argv.includes("--dry-run");

  // Load place IDs
  const placeData = JSON.parse(fs.readFileSync("data/place-ids.json", "utf-8"));
  const batch = placeData.slice(0, limit);

  console.log(`Processing ${batch.length} retreats${dryRun ? " (dry run)" : ""}...`);

  if (dryRun) {
    batch.forEach((r: any) => console.log(`  ${r.name}: ${r.place_id}`));
    return;
  }

  const reviews = await extractReviews(batch, 100);

  // Save raw output
  fs.writeFileSync("data/google-reviews-raw.json", JSON.stringify(reviews, null, 2));
  console.log(`Saved ${reviews.length} reviews to data/google-reviews-raw.json`);
}

main().catch(console.error);
```

- [ ] **Step 4: Install Apify client**

```bash
npm install apify-client
```

- [ ] **Step 5: Test with 5 retreats**

```bash
npx tsx scripts/extract-google-reviews.ts 5
```

Check `data/google-reviews-raw.json` — verify you get full review text, ratings, dates, author names.

- [ ] **Step 6: Commit**

```bash
git add scripts/extract-google-reviews.ts package.json package-lock.json
git commit -m "feat: add Apify Google Reviews extraction script"
```

---

### Task 3: Store reviews in Supabase

**Files:**
- Create: `supabase/migrations/XXXXXX_create_retreat_reviews.sql`
- Modify: `scripts/extract-google-reviews.ts` (add Supabase insert)

- [ ] **Step 1: Create the reviews table migration**

```sql
-- supabase/migrations/20260506_create_retreat_reviews.sql
CREATE TABLE IF NOT EXISTS retreat_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  retreat_id TEXT NOT NULL REFERENCES retreats(id),
  source TEXT NOT NULL DEFAULT 'google', -- google, tripadvisor, youtube, blog
  author_name TEXT,
  rating INTEGER, -- 1-5
  review_text TEXT NOT NULL,
  review_date TIMESTAMPTZ,
  response_text TEXT, -- owner response
  review_url TEXT,
  language TEXT DEFAULT 'en',
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  -- Synthesis fields (filled by Claude later)
  sentiment TEXT, -- positive, negative, mixed
  topics TEXT[], -- ['food', 'spa', 'staff', 'rooms', 'value']
  key_quote TEXT, -- best single sentence from review
  UNIQUE(retreat_id, source, review_url)
);

CREATE INDEX idx_retreat_reviews_retreat ON retreat_reviews(retreat_id);
CREATE INDEX idx_retreat_reviews_source ON retreat_reviews(source);
CREATE INDEX idx_retreat_reviews_rating ON retreat_reviews(rating);
```

- [ ] **Step 2: Run the migration**

```bash
npx supabase db push
```

- [ ] **Step 3: Add Supabase insert to extraction script**

Add after the `extractReviews` call in `scripts/extract-google-reviews.ts`:

```typescript
// Insert reviews into Supabase
for (const review of reviews) {
  const { error } = await supabase.from("retreat_reviews").upsert({
    retreat_id: review.retreat_id, // map from place_id back to retreat
    source: "google",
    author_name: review.author,
    rating: review.rating,
    review_text: review.text,
    review_date: review.date,
    response_text: review.response_text,
    review_url: review.review_url,
    language: "en",
  }, { onConflict: "retreat_id,source,review_url" });

  if (error) console.error(`Insert error: ${error.message}`);
}
console.log(`Inserted ${reviews.length} reviews into Supabase`);
```

- [ ] **Step 4: Test insert with 5-retreat batch**

```bash
npx tsx scripts/extract-google-reviews.ts 5
```

Verify reviews appear in Supabase table.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/ scripts/extract-google-reviews.ts
git commit -m "feat: store Google Reviews in Supabase"
```

---

### Task 4: Run full extraction for all 218 retreats

- [ ] **Step 1: Run full extraction**

```bash
npx tsx scripts/extract-google-reviews.ts 218
```

Monitor Apify dashboard for cost. Expected: $5-44 depending on review volume.

- [ ] **Step 2: Verify coverage**

```sql
SELECT COUNT(DISTINCT retreat_id) as retreats_with_reviews,
       COUNT(*) as total_reviews,
       AVG(rating) as avg_rating
FROM retreat_reviews
WHERE source = 'google';
```

- [ ] **Step 3: Commit data log**

```bash
git commit -m "data: extract Google Reviews for all retreats via Apify"
```

---

### Task 5: Synthesize reviews with Claude into Guest Intelligence

**Files:**
- Create: `scripts/synthesize-reviews.ts`

- [ ] **Step 1: Write the synthesis script**

This pulls all reviews for a retreat from Supabase, sends them to Claude, and gets back structured intelligence:

```typescript
// scripts/synthesize-reviews.ts
import { config } from "dotenv";
config({ path: ".env.local" });

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SYNTHESIS_PROMPT = `You are analyzing guest reviews for a wellness retreat. Given the reviews below, produce a structured analysis in JSON format:

{
  "summary": "2-3 sentence overview of what guests consistently say",
  "strengths": ["specific thing guests praise", "another", "..."],
  "weaknesses": ["specific complaint pattern", "..."],
  "food_verdict": "1-2 sentences on food quality based on reviews",
  "spa_verdict": "1-2 sentences on spa/treatment quality",
  "rooms_verdict": "1-2 sentences on accommodation quality",
  "staff_verdict": "1-2 sentences on staff/service quality",
  "value_verdict": "1-2 sentences on whether guests feel it's worth the price",
  "best_quotes": [
    {"text": "exact quote from a review", "rating": 5, "topic": "food"},
    {"text": "exact quote", "rating": 2, "topic": "value"}
  ],
  "red_flags": ["honest warning a friend would give", "..."],
  "ideal_for": ["type of person this retreat suits", "..."],
  "not_ideal_for": ["type of person who'd be disappointed", "..."],
  "surprise_factor": "one thing guests didn't expect (good or bad)"
}

Be honest. If the food is mediocre, say so. If the spa is world-class, say so. Extract REAL quotes from the reviews — do not fabricate. If there aren't enough reviews to assess a category, say "insufficient reviews" rather than guessing.`;

async function synthesize(retreatId: string, retreatName: string) {
  const { data: reviews } = await supabase
    .from("retreat_reviews")
    .select("*")
    .eq("retreat_id", retreatId)
    .order("review_date", { ascending: false })
    .limit(100);

  if (!reviews || reviews.length < 3) {
    console.log(`  Skipping ${retreatName} — only ${reviews?.length || 0} reviews`);
    return null;
  }

  const reviewText = reviews.map((r, i) =>
    `Review ${i + 1} (${r.rating}/5): ${r.review_text}`
  ).join("\n\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `${SYNTHESIS_PROMPT}\n\nRetreat: ${retreatName}\n\n${reviewText}`
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  return JSON.parse(jsonMatch[0]);
}

async function main() {
  const limit = parseInt(process.argv[2] || "5");

  const { data: retreats } = await supabase
    .from("retreats")
    .select("id, name")
    .order("wrd_score", { ascending: false })
    .limit(limit);

  if (!retreats) return;

  const results: Record<string, any> = {};

  for (const retreat of retreats) {
    console.log(`Synthesizing: ${retreat.name}...`);
    const intel = await synthesize(retreat.id, retreat.name);
    if (intel) {
      results[retreat.id] = { name: retreat.name, ...intel };

      // Update Supabase with synthesis
      await supabase.from("retreats").update({
        guest_intelligence: intel
      }).eq("id", retreat.id);
    }
    // Rate limit: 1 per 2 seconds
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`Synthesized ${Object.keys(results).length} retreats`);
}

main().catch(console.error);
```

- [ ] **Step 2: Test with top 5 retreats**

```bash
npx tsx scripts/synthesize-reviews.ts 5
```

Check Supabase — the `guest_intelligence` JSON field should be populated.

- [ ] **Step 3: Run for all retreats with sufficient reviews**

```bash
npx tsx scripts/synthesize-reviews.ts 218
```

Cost: ~$0.02-0.05 per retreat × 218 = ~$5-10 in Claude API.

- [ ] **Step 4: Commit**

```bash
git add scripts/synthesize-reviews.ts
git commit -m "feat: synthesize guest reviews into intelligence via Claude"
```

---

### Task 6: Build Guest Intelligence UI component

**Files:**
- Create: `src/components/GuestIntelligence.tsx`
- Modify: `src/app/retreats/[slug]/page.tsx` (add component to profile)

- [ ] **Step 1: Build the component**

A section on each retreat profile showing synthesized guest intelligence — strengths, weaknesses, verdicts by category, real quotes, and honest warnings.

Component should:
- Accept a `guestIntelligence` prop (the JSON from Claude synthesis)
- Render sections: Summary, What guests love, What guests complain about, Category verdicts (food/spa/rooms/staff/value), Real quotes, Red flags, Best for / Not for
- Handle null/missing gracefully (hide section if no data)
- Match existing site design system

- [ ] **Step 2: Add to retreat profile page**

After the scoring section, before the similar retreats section.

- [ ] **Step 3: Commit**

```bash
git add src/components/GuestIntelligence.tsx src/app/retreats/[slug]/page.tsx
git commit -m "feat: add Guest Intelligence section to retreat profiles"
```

---

## Cost Summary

| Step | Cost | Notes |
|------|------|-------|
| Place IDs (Google API) | $3.70 | Within $300 free tier |
| Apify review extraction | $5-44 | Free tier covers first $5 |
| Claude synthesis | $5-10 | Sonnet, 218 retreats |
| **Total** | **$14-58** | |

Compare: Outscraper alone would be $85-257. Building your own Playwright scraper would cost $0 upfront but 2-5 hours/month in maintenance — at $100/hr consulting rate, that's $200-500/month forever.

---

## Why NOT to build your own scraper

1. **Google updates anti-bot weekly.** Your scraper breaks monthly. Apify has a team maintaining theirs.
2. **Legal risk sits on you** instead of a third-party service.
3. **Residential proxies cost $20-50/month** — more than Apify's total for the entire job.
4. **Time cost:** 8-16 hours to build, 2-5 hours/month to maintain. At any reasonable hourly rate, Apify pays for itself in the first week.
5. **The scraper is not your product.** Guest Intelligence on retreat profiles is your product. Spend your time there.
