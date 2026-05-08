import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ScrapedReview {
  id: string;
  project: string;
  entity_id: string;
  entity_name: string | null;
  source: string;
  author_name: string | null;
  rating: number | null;
  review_text: string;
  review_date: string | null;
  owner_response: string | null;
  review_id: string | null;
  scraped_at: string;
}

/**
 * Fetch reviews for a specific entity from the shared scraped_reviews table.
 * Returns up to 10 reviews sorted by rating descending.
 * Uses ISR-compatible caching (revalidates every 24 hours).
 */
export async function getReviewsForEntity(
  project: string,
  entityId: string
): Promise<ScrapedReview[]> {
  const { data, error } = await supabase
    .from("scraped_reviews")
    .select("*")
    .eq("project", project)
    .eq("entity_id", entityId)
    .order("rating", { ascending: false })
    .limit(10);

  if (error) {
    console.error(`Error fetching reviews for ${project}/${entityId}:`, error.message);
    return [];
  }

  return (data as ScrapedReview[]) ?? [];
}

/**
 * Fetch review count and average rating for an entity.
 */
export async function getReviewStats(
  project: string,
  entityId: string
): Promise<{ count: number; avgRating: number | null }> {
  const { data, error } = await supabase
    .from("scraped_reviews")
    .select("rating")
    .eq("project", project)
    .eq("entity_id", entityId);

  if (error || !data?.length) {
    return { count: 0, avgRating: null };
  }

  const ratings = data.filter((r) => r.rating != null).map((r) => r.rating as number);
  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : null;

  return { count: data.length, avgRating };
}
