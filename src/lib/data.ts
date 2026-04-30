import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";
import { WellnessRetreat, RetreatScores, getScoreTier } from "@/lib/types";

// Fix broken hero images — keyed by slug
const IMAGE_OVERRIDES: Record<string, string> = {
  "grail-springs": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&h=800&fit=crop&q=80",
  "echo-valley-ranch": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1400&h=800&fit=crop&q=80",
};

// Transform a Supabase row into our WellnessRetreat type
function mapRow(row: any): WellnessRetreat {
  const slug = row.slug as string;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle || "",
    website_url: row.website_url || "",
    booking_url: row.booking_url || "",
    country: row.country,
    region: row.region,
    city: row.city || "",
    address: row.address || "",
    coordinates: { lat: row.lat || 0, lng: row.lng || 0 },
    nearest_airport: row.nearest_airport || "",
    airport_distance_km: row.airport_distance_km || 0,
    property_size: row.property_size || "small",
    room_count: row.room_count || 0,
    max_guests: row.max_guests || 0,
    founded_year: row.founded_year || 0,
    property_type: row.property_type || [],
    price_min_per_night: row.price_min_per_night || 0,
    price_max_per_night: row.price_max_per_night || 0,
    pricing_model: row.pricing_model || "bed_and_breakfast",
    minimum_stay_nights: row.minimum_stay_nights || 1,
    hero_image_url: IMAGE_OVERRIDES[slug] || row.hero_image_url || "",
    gallery_images: row.gallery_images || [],
    youtube_videos: [],
    instagram_handle: row.instagram_handle || "",
    scores: row.scores as RetreatScores,
    wrd_score: parseFloat(row.wrd_score) || 0,
    score_tier: row.score_tier || getScoreTier(parseFloat(row.wrd_score) || 0),
    google_rating: parseFloat(row.google_rating) || 0,
    google_review_count: row.google_review_count || 0,
    tripadvisor_rating: row.tripadvisor_rating ? parseFloat(row.tripadvisor_rating) : null,
    tripadvisor_review_count: row.tripadvisor_review_count || null,
    recent_reviews: [],
    awards: [],
    specialty_tags: row.specialty_tags || [],
    dietary_options: row.dietary_options || [],
    program_types: row.program_types || [],
    last_data_refresh: row.last_data_refresh || "",
    is_sponsored: row.is_sponsored || false,
    is_verified: row.is_verified || false,
    created_at: row.created_at || "",
    updated_at: row.updated_at || "",
  };
}

// Module-scope cache: fetch all retreats once per build/cold start.
// This prevents N+1 Supabase queries during static generation of 9,289 pages.
// Uses a promise lock so concurrent callers share a single in-flight fetch.
let _retreatsCache: WellnessRetreat[] | null = null;
let _retreatsBySlugCache: Map<string, WellnessRetreat> = new Map();
let _retreatsPromise: Promise<WellnessRetreat[]> | null = null;

async function _fetchAllRetreats(): Promise<WellnessRetreat[]> {
  // Single-query bulk fetch, enabled by the composite index
  // `retreats_wrd_slug_idx ON retreats (wrd_score DESC, slug ASC)
  //  WHERE wrd_score > 0 AND slug <> 'test'` (applied via Supabase
  // migration). Before the index existed, a `SELECT *` with this ORDER BY
  // fell back to a full sort on disk, and paginating with .range() did an
  // index walk from offset 0 on EVERY batch — roughly 1s/batch × 10 batches
  // = 10s+ which hit the Supabase anon statement timeout on cold lambdas.
  //
  // Now a single query returns all ~9,409 rows via the index in ~500ms,
  // and the client pulls them down in one round trip. No pagination loop,
  // no retry-until-timeout, no empty-cache-poisoning.
  //
  // .range(0, 49999) explicitly asks PostgREST for up to 50k rows; without
  // an explicit range header PostgREST caps responses at its configured
  // db-max-rows (1000 on default Supabase). The table has ~9.4k rows today;
  // 50k leaves room to grow ~5x before this needs to become a real
  // keyset-paginated loop.
  const { data, error } = await supabase
    .from("retreats")
    .select("*")
    .neq("slug", "test")
    .gt("wrd_score", 0)
    .order("wrd_score", { ascending: false })
    .order("slug", { ascending: true })
    .range(0, 49999);

  if (error) {
    console.error("Supabase getAllRetreats error:", error.message);
    // Throw — unstable_cache does not cache thrown errors, so a transient
    // failure won't poison the cache for the next hour.
    throw new Error(`Supabase getAllRetreats failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("Supabase getAllRetreats returned 0 rows — refusing to cache empty result");
  }

  const mapped = data.map(mapRow);
  _retreatsCache = mapped;
  _retreatsBySlugCache = new Map(mapped.map((r) => [r.slug, r]));
  return mapped;
}

// Wrap the in-memory loader with Next's persistent unstable_cache so the
// data survives across serverless lambda invocations (the module-scope
// cache only helps within a single warm instance). Thrown errors are NOT
// cached by unstable_cache, so a transient fetch failure won't poison the
// cache for the next hour.
const _cachedFetchAllRetreats = unstable_cache(
  async () => {
    const result = await _fetchAllRetreats();
    // Belt-and-suspenders: also refuse to cache empty here. _fetchAllRetreats
    // already throws on 0 rows, but if a future refactor ever returns [],
    // this guard prevents a stuck empty cache from reappearing.
    if (!result || result.length === 0) {
      throw new Error("all-retreats fetch returned empty — refusing to cache");
    }
    return result;
  },
  ["all-retreats-v4"],
  { revalidate: 3600, tags: ["retreats"] }
);

export async function getAllRetreats(): Promise<WellnessRetreat[]> {
  if (_retreatsCache && _retreatsCache.length > 0) return _retreatsCache;
  if (_retreatsPromise) return _retreatsPromise;

  _retreatsPromise = _cachedFetchAllRetreats()
    .then((data) => {
      // Never populate module caches with an empty result — same reasoning
      // as inside _fetchAllRetreats. If this happens, clear the promise so
      // the next call retries instead of returning stale empty forever.
      if (!data || data.length === 0) {
        _retreatsPromise = null;
        return [];
      }
      _retreatsCache = data;
      _retreatsBySlugCache = new Map(data.map((r) => [r.slug, r]));
      return data;
    })
    .catch((err) => {
      // Make sure a failed fetch doesn't leave the promise stuck — the next
      // request will retry fresh instead of awaiting a rejected promise.
      console.error("getAllRetreats fetch failed:", err);
      _retreatsPromise = null;
      return [];
    });
  return _retreatsPromise;
}

export async function getRetreatBySlug(slug: string): Promise<WellnessRetreat | undefined> {
  if (!_retreatsCache) await getAllRetreats();
  const cached = _retreatsBySlugCache.get(slug);
  if (cached) return cached;

  // Safety net: if the bulk fetch truncated or the cache is stale, fall back
  // to a direct Supabase query by slug so detail pages never 404 on valid data.
  // This is cheap — slug is indexed — and only runs on cache misses.
  try {
    const { data, error } = await supabase
      .from("retreats")
      .select("*")
      .eq("slug", slug)
      .gt("wrd_score", 0)
      .maybeSingle();
    if (error) {
      console.error(`getRetreatBySlug direct-fetch error for "${slug}":`, error.message);
      return undefined;
    }
    if (!data) return undefined;
    const mapped = mapRow(data);
    // Warm the cache so subsequent hits in this lambda don't re-query.
    _retreatsBySlugCache.set(slug, mapped);
    return mapped;
  } catch (e) {
    console.error(`getRetreatBySlug direct-fetch threw for "${slug}":`, e);
    return undefined;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Server-side directory query
// ═══════════════════════════════════════════════════════════════════════
//
// The directory page /retreats used to load all 9,409 retreats into lambda
// memory via getAllRetreats(), filter them in JS, and slice to 60. That
// works for small datasets but at 9k+ rows it's brittle and slow.
//
// This function queries Supabase directly with filters + LIMIT + OFFSET so
// we only ever pull the 60 rows we actually need to render. Fast, cheap,
// and independent of the bulk-fetch code path.

export type BestForTag =
  | "Best for Burnout"
  | "Best for Couples"
  | "Best for Longevity"
  | "Best for Biohackers"
  | "Best First Retreat"
  | "Best for Fitness"
  | "Best for Nutrition"
  | "Best for Spa"
  | "Best for Meditation";

export interface DirectoryQueryArgs {
  region?: string | null;
  tag?: string | null;
  budget?: string | null;
  page: number;
  pageSize: number;
}

export interface DirectoryQueryResult {
  retreats: WellnessRetreat[];
  total: number;
}

/**
 * Translate a "Best For" tag into a Supabase query builder that narrows to
 * rows matching that tag's score threshold. Mirrors deriveAllBestForTags()
 * in src/components/BestForTags.tsx — keep them in sync.
 */
function applyBestForFilter(query: any, tag: string) {
  switch (tag) {
    case "Best for Burnout":
      return query.or("scores->mindfulness->>score.gte.8.5,scores->sleep->>score.gte.8.5");
    case "Best for Couples":
      return query
        .gte("scores->amenities->>score", "8.5")
        .gte("price_max_per_night", 1500);
    case "Best for Longevity":
      return query.or("scores->medical->>score.gte.8.0,scores->sleep->>score.gte.8.5");
    case "Best for Biohackers":
      return query
        .or("scores->medical->>score.gte.9.0,scores->personalization->>score.gte.9.0")
        .gte("scores->fitness->>score", "7.5");
    case "Best First Retreat":
      return query
        .gte("scores->personalization->>score", "7.5")
        .gte("scores->pricing_value->>score", "7.5")
        .gte("scores->travel_access->>score", "7.0");
    case "Best for Fitness":
      return query.gte("scores->fitness->>score", "9.0");
    case "Best for Nutrition":
      return query.gte("scores->nutrition->>score", "9.0");
    case "Best for Spa":
      return query.gte("scores->spa->>score", "9.0");
    case "Best for Meditation":
      return query.gte("scores->mindfulness->>score", "9.0");
    default:
      return query;
  }
}

function applyBudgetFilter(query: any, budget: string) {
  switch (budget) {
    case "accessible":
      return query.gt("price_max_per_night", 0).lt("price_max_per_night", 500);
    case "mid":
      return query.gte("price_max_per_night", 500).lt("price_max_per_night", 1500);
    case "premium":
      return query.gte("price_max_per_night", 1500).lt("price_max_per_night", 3000);
    case "ultra":
      return query.gte("price_max_per_night", 3000);
    default:
      return query;
  }
}

export async function queryRetreatsForDirectory(
  args: DirectoryQueryArgs
): Promise<DirectoryQueryResult> {
  const { region, tag, budget, page, pageSize } = args;
  const offset = Math.max(0, (page - 1) * pageSize);

  // Build filter chain. `count: "planned"` uses the PostgreSQL planner
  // estimate instead of a full COUNT(*) scan — orders of magnitude faster
  // on 9,400+ rows and avoids the statement-timeout failure mode that was
  // silently returning 0 results on prod.
  const buildBase = () => {
    let q: any = supabase
      .from("retreats")
      .select("*", { count: "planned" })
      .neq("slug", "test")
      .gt("wrd_score", 0);
    if (region && region !== "All") q = q.eq("region", region);
    if (tag && tag !== "all") q = applyBestForFilter(q, tag);
    if (budget && budget !== "all") q = applyBudgetFilter(q, budget);
    return q;
  };

  try {
    const { data, error, count } = await buildBase()
      .order("wrd_score", { ascending: false })
      .order("slug", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("[queryRetreatsForDirectory] supabase error:", error.message, error);
      return { retreats: [], total: 0 };
    }

    const rowCount = data?.length || 0;
    console.log(
      `[queryRetreatsForDirectory] ok region=${region} tag=${tag} budget=${budget} page=${page} rows=${rowCount} count=${count}`
    );

    return {
      retreats: (data || []).map(mapRow),
      total: count || rowCount,
    };
  } catch (e: any) {
    console.error("[queryRetreatsForDirectory] threw:", e?.message || e);
    return { retreats: [], total: 0 };
  }
}

export async function getRetreatsByRegion(region: string): Promise<WellnessRetreat[]> {
  const { data, error } = await supabase
    .from("retreats")
    .select("*")
    .ilike("region", region)
    .order("wrd_score", { ascending: false });

  if (error) {
    console.error("Supabase getRetreatsByRegion error:", error.message);
    return [];
  }
  return (data || []).map(mapRow);
}

export async function getRegions(): Promise<{ name: string; count: number }[]> {
  // Derive from cached retreats — no extra Supabase query
  const retreats = await getAllRetreats();
  const validRegions = ["USA", "Europe", "Canada", "Mexico", "Asia"];
  const regionMap = new Map<string, number>();
  retreats.forEach((r) => {
    if (validRegions.includes(r.region)) {
      regionMap.set(r.region, (regionMap.get(r.region) || 0) + 1);
    }
  });
  return Array.from(regionMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Lightweight homepage queries — avoid loading all 9,400 retreats.
 * These run direct Supabase queries with LIMIT to stay under timeout.
 */
export async function getFeaturedRetreats(limit = 10): Promise<WellnessRetreat[]> {
  const { data, error } = await supabase
    .from("retreats")
    .select("*")
    .order("wrd_score", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getFeaturedRetreats error:", error.message);
    return [];
  }
  return (data || []).map(mapRow);
}

export async function getRegionCounts(): Promise<{ name: string; count: number }[]> {
  const validRegions = ["USA", "Europe", "Canada", "Mexico", "Asia"];
  const results: { name: string; count: number }[] = [];
  for (const region of validRegions) {
    const { count, error } = await supabase
      .from("retreats")
      .select("id", { count: "exact", head: true })
      .ilike("region", region);
    if (!error && count) {
      results.push({ name: region, count });
    }
  }
  return results.sort((a, b) => b.count - a.count);
}

// Caches for related data — fetch all once, look up per retreat
let _videosCache: Map<string, { video_id: string; title: string; channel_name: string; thumbnail_url: string }[]> | null = null;
let _awardsCache: Map<string, { name: string; year: number; issuing_body: string; url: string }[]> | null = null;

async function loadVideosCache() {
  if (_videosCache) return _videosCache;
  const { data } = await supabase.from("retreat_youtube_videos").select("*");
  const map = new Map<string, any[]>();
  (data || []).forEach((v: any) => {
    if (!map.has(v.retreat_id)) map.set(v.retreat_id, []);
    map.get(v.retreat_id)!.push({
      video_id: v.video_id,
      title: v.title || "",
      channel_name: v.channel_name || "",
      thumbnail_url: v.thumbnail_url || `https://img.youtube.com/vi/${v.video_id}/hqdefault.jpg`,
    });
  });
  _videosCache = map;
  return map;
}

async function loadAwardsCache() {
  if (_awardsCache) return _awardsCache;
  const { data } = await supabase.from("retreat_awards").select("*").order("year", { ascending: false });
  const map = new Map<string, any[]>();
  (data || []).forEach((a: any) => {
    if (!map.has(a.retreat_id)) map.set(a.retreat_id, []);
    map.get(a.retreat_id)!.push({
      name: a.name,
      year: a.year,
      issuing_body: a.issuing_body || "",
      url: a.url || "",
    });
  });
  _awardsCache = map;
  return map;
}

export async function getRetreatVideos(retreatId: string) {
  const cache = await loadVideosCache();
  return cache.get(retreatId) || [];
}

export async function getRetreatAwards(retreatId: string) {
  const cache = await loadAwardsCache();
  return cache.get(retreatId) || [];
}

export function slugifyRegion(region: string): string {
  return region.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function slugifyCountry(country: string): string {
  return country.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function getCountriesInRegion(
  retreats: WellnessRetreat[],
  region: string
): { country: string; slug: string; count: number }[] {
  const countMap = new Map<string, number>();
  retreats
    .filter((r) => slugifyRegion(r.region) === slugifyRegion(region))
    .forEach((r) => {
      countMap.set(r.country, (countMap.get(r.country) || 0) + 1);
    });
  return Array.from(countMap.entries())
    .map(([country, count]) => ({ country, slug: slugifyCountry(country), count }))
    .sort((a, b) => b.count - a.count);
}

export function getAllCountries(retreats: WellnessRetreat[]): { country: string; slug: string; region: string; count: number }[] {
  const countMap = new Map<string, { country: string; region: string; count: number }>();
  retreats.forEach((r) => {
    const key = slugifyCountry(r.country);
    const existing = countMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      countMap.set(key, { country: r.country, region: r.region, count: 1 });
    }
  });
  return Array.from(countMap.entries())
    .map(([slug, data]) => ({ slug, ...data }))
    .sort((a, b) => b.count - a.count);
}

export function slugifyCity(city: string): string {
  return city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function getAllCities(retreats: WellnessRetreat[]): { city: string; slug: string; country: string; region: string; count: number }[] {
  const cityMap = new Map<string, { city: string; country: string; region: string; count: number }>();
  retreats.forEach((r) => {
    if (!r.city || r.city.length < 2) return;
    const slug = slugifyCity(r.city);
    const existing = cityMap.get(slug);
    if (existing) {
      existing.count += 1;
    } else {
      cityMap.set(slug, { city: r.city, country: r.country, region: r.region, count: 1 });
    }
  });
  return Array.from(cityMap.entries())
    .map(([slug, data]) => ({ slug, ...data }))
    .filter((c) => c.count >= 3) // Only cities with 3+ retreats
    .sort((a, b) => b.count - a.count);
}

export async function getSimilarRetreats(retreat: WellnessRetreat, count = 6): Promise<WellnessRetreat[]> {
  const all = await getAllRetreats();
  const scored: { r: WellnessRetreat; s: number }[] = [];

  for (const r of all) {
    if (r.slug === retreat.slug) continue;
    let s = 0;
    if (r.region === retreat.region) s += 10;
    if (r.country === retreat.country) s += 6;
    const avgPrice = (retreat.price_min_per_night + retreat.price_max_per_night) / 2;
    const rAvg = (r.price_min_per_night + r.price_max_per_night) / 2;
    if (avgPrice > 0 && rAvg > 0 && Math.abs(rAvg - avgPrice) / avgPrice <= 0.3) s += 4;
    if (Math.abs(r.wrd_score - retreat.wrd_score) <= 1.5) s += 3;
    const overlap = r.specialty_tags.filter((t) => retreat.specialty_tags.includes(t)).length;
    s += Math.min(overlap, 4);
    scored.push({ r, s });
  }

  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, count).map((x) => x.r);
}

// ═══════════════════════════════════════════════════════════════════════
// Editorial reviews
// ═══════════════════════════════════════════════════════════════════════

let _editorialCache: Map<string, any> | null = null;

async function loadEditorialCache() {
  if (_editorialCache) return _editorialCache;
  const { data, error } = await supabase
    .from("retreat_editorial_reviews")
    .select("*")
    .eq("status", "published");
  if (error) console.error("[loadEditorialCache] error:", error.message);
  console.log(`[loadEditorialCache] loaded ${data?.length || 0} editorial reviews`);
  const map = new Map<string, any>();
  (data || []).forEach((r: any) => {
    map.set(r.retreat_id, {
      reviewHtml: r.review_html,
      verdict: r.verdict,
      bestFor: r.best_for || [],
      notIdealFor: r.not_ideal_for || [],
      alternatives: r.alternatives || [],
      lastUpdated: new Date(r.last_updated).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    });
  });
  _editorialCache = map;
  return map;
}

export async function getEditorialReview(retreatId: string) {
  const cache = await loadEditorialCache();
  return cache.get(retreatId) || null;
}

// ═══════════════════════════════════════════════════════════════════════
// Guest reviews with sentiment themes
// ═══════════════════════════════════════════════════════════════════════

export interface ReviewTheme {
  label: string;
  count: number;
  sentiment: "positive" | "negative";
}

let _reviewsCache: Map<string, any[]> | null = null;

async function loadReviewsCache() {
  if (_reviewsCache) return _reviewsCache;
  const { data } = await supabase
    .from("retreat_reviews")
    .select("*")
    .order("review_date", { ascending: false });
  const map = new Map<string, any[]>();
  (data || []).forEach((r: any) => {
    if (!map.has(r.retreat_id)) map.set(r.retreat_id, []);
    map.get(r.retreat_id)!.push({
      source: r.source,
      rating: parseFloat(r.rating) || 0,
      text: r.text || "",
      author: r.author || "Anonymous",
      date: r.review_date ? new Date(r.review_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "",
      sentiment: r.sentiment || "neutral",
    });
  });
  _reviewsCache = map;
  return map;
}

export async function getRetreatReviews(retreatId: string) {
  const cache = await loadReviewsCache();
  return cache.get(retreatId) || [];
}

// ═══════════════════════════════════════════════════════════════════════
// Retreat FAQs (AI-generated, stored in Supabase)
// ═══════════════════════════════════════════════════════════════════════

let _faqsCache: Map<string, { question: string; answer: string }[]> | null = null;

async function loadFaqsCache() {
  if (_faqsCache) return _faqsCache;
  const { data, error } = await supabase
    .from("retreat_faqs")
    .select("*")
    .eq("status", "published");
  if (error) console.error("[loadFaqsCache] error:", error.message);
  const map = new Map<string, { question: string; answer: string }[]>();
  (data || []).forEach((r: any) => {
    try {
      const faqs = typeof r.faqs === "string" ? JSON.parse(r.faqs) : r.faqs;
      if (Array.isArray(faqs) && faqs.length > 0) {
        map.set(r.retreat_id, faqs);
      }
    } catch {}
  });
  _faqsCache = map;
  return map;
}

export async function getRetreatFaqs(retreatId: string): Promise<{ question: string; answer: string }[]> {
  const cache = await loadFaqsCache();
  return cache.get(retreatId) || [];
}

export function deriveReviewThemes(reviews: any[]): ReviewTheme[] {
  if (reviews.length === 0) return [];

  const themeKeywords: Record<string, { terms: string[]; sentiment: "positive" | "negative" }> = {
    "Great food": { terms: ["food", "meal", "cuisine", "chef", "dining", "breakfast", "dinner"], sentiment: "positive" },
    "Beautiful location": { terms: ["beautiful", "stunning", "view", "scenery", "nature", "setting"], sentiment: "positive" },
    "Excellent staff": { terms: ["staff", "friendly", "helpful", "attentive", "service", "team"], sentiment: "positive" },
    "Transformative": { terms: ["transform", "life-changing", "amazing experience", "changed my"], sentiment: "positive" },
    "Peaceful": { terms: ["peaceful", "serene", "quiet", "calm", "relaxing", "tranquil"], sentiment: "positive" },
    "Clean & comfortable": { terms: ["clean", "comfortable", "spacious", "room", "bed"], sentiment: "positive" },
    "Overpriced": { terms: ["expensive", "overpriced", "not worth", "pricey", "costly"], sentiment: "negative" },
    "Needs improvement": { terms: ["disappointing", "expected more", "could be better", "mediocre"], sentiment: "negative" },
    "Poor communication": { terms: ["communication", "disorganized", "confusing", "unclear", "response"], sentiment: "negative" },
  };

  const themeCounts: Record<string, { count: number; sentiment: "positive" | "negative" }> = {};

  for (const review of reviews) {
    const text = (review.text || "").toLowerCase();
    for (const [theme, config] of Object.entries(themeKeywords)) {
      if (config.terms.some((term: string) => text.includes(term))) {
        if (!themeCounts[theme]) themeCounts[theme] = { count: 0, sentiment: config.sentiment };
        themeCounts[theme].count++;
      }
    }
  }

  return Object.entries(themeCounts)
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([label, v]) => ({ label, count: v.count, sentiment: v.sentiment }));
}
