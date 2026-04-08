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
  // Supabase defaults to 1000 rows per query — paginate to get all retreats
  const PAGE_SIZE = 1000;
  const all: any[] = [];
  let from = 0;
  let attempts = 0;
  while (true) {
    const { data, error } = await supabase
      .from("retreats")
      .select("*")
      .neq("slug", "test")
      .gt("wrd_score", 0)
      .order("wrd_score", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      // Retry up to 3 times on transient errors (timeouts, network)
      attempts += 1;
      console.error(`Supabase getAllRetreats error (attempt ${attempts}):`, error.message);
      if (attempts >= 3) {
        const partial = all.map(mapRow);
        _retreatsCache = partial;
        _retreatsBySlugCache = new Map(partial.map((r) => [r.slug, r]));
        return partial;
      }
      // brief backoff
      await new Promise((r) => setTimeout(r, 500 * attempts));
      continue;
    }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
    attempts = 0; // reset on success
  }

  const mapped = all.map(mapRow);
  _retreatsCache = mapped;
  _retreatsBySlugCache = new Map(mapped.map((r) => [r.slug, r]));
  return mapped;
}

export async function getAllRetreats(): Promise<WellnessRetreat[]> {
  if (_retreatsCache) return _retreatsCache;
  // Share a single in-flight promise across all concurrent callers
  if (!_retreatsPromise) {
    _retreatsPromise = _fetchAllRetreats();
  }
  return _retreatsPromise;
}

export async function getRetreatBySlug(slug: string): Promise<WellnessRetreat | undefined> {
  if (!_retreatsCache) await getAllRetreats();
  return _retreatsBySlugCache.get(slug);
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
