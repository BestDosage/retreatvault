import { supabase } from "@/lib/supabase";
import { WellnessRetreat, RetreatScores, getScoreTier } from "@/lib/types";

// Transform a Supabase row into our WellnessRetreat type
function mapRow(row: any): WellnessRetreat {
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
    hero_image_url: row.hero_image_url || "",
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

export async function getAllRetreats(): Promise<WellnessRetreat[]> {
  const { data, error } = await supabase
    .from("retreats")
    .select("*")
    .neq("slug", "test")
    .gt("wrd_score", 0)
    .order("wrd_score", { ascending: false });

  if (error) {
    console.error("Supabase getAllRetreats error:", error.message);
    return [];
  }
  return (data || []).map(mapRow);
}

export async function getRetreatBySlug(slug: string): Promise<WellnessRetreat | undefined> {
  const { data, error } = await supabase
    .from("retreats")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.error("Supabase getRetreatBySlug error:", error?.message);
    return undefined;
  }
  return mapRow(data);
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
  const { data, error } = await supabase
    .from("retreats")
    .select("region")
    .neq("slug", "test")
    .gt("wrd_score", 0);

  if (error || !data) return [];

  const validRegions = ["USA", "Europe", "Canada", "Mexico", "Asia"];
  const regionMap = new Map<string, number>();
  data.forEach((r: any) => {
    if (validRegions.includes(r.region)) {
      regionMap.set(r.region, (regionMap.get(r.region) || 0) + 1);
    }
  });
  return Array.from(regionMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getRetreatVideos(retreatId: string): Promise<{ video_id: string; title: string; channel_name: string; thumbnail_url: string }[]> {
  const { data, error } = await supabase
    .from("retreat_youtube_videos")
    .select("*")
    .eq("retreat_id", retreatId);

  if (error || !data) return [];
  return data.map((v: any) => ({
    video_id: v.video_id,
    title: v.title || "",
    channel_name: v.channel_name || "",
    thumbnail_url: v.thumbnail_url || `https://img.youtube.com/vi/${v.video_id}/hqdefault.jpg`,
  }));
}

export async function getRetreatAwards(retreatId: string): Promise<{ name: string; year: number; issuing_body: string; url: string }[]> {
  const { data, error } = await supabase
    .from("retreat_awards")
    .select("*")
    .eq("retreat_id", retreatId)
    .order("year", { ascending: false });

  if (error || !data) return [];
  return data.map((a: any) => ({
    name: a.name,
    year: a.year,
    issuing_body: a.issuing_body || "",
    url: a.url || "",
  }));
}
