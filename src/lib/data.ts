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
