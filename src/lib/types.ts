export interface CategoryScore {
  score: number;
  sub_scores: Record<string, number>;
  notes: string;
  data_sources: string[];
  last_updated: string;
}

export interface YouTubeVideo {
  video_id: string;
  title: string;
  view_count: number;
  channel_name: string;
  thumbnail_url: string;
  published_at: string;
}

export interface Review {
  source: "google" | "tripadvisor" | "booking_com" | "instagram";
  rating: number;
  text: string;
  author: string;
  date: string;
  sentiment: "positive" | "neutral" | "negative";
}

export interface Award {
  name: string;
  year: number;
  issuing_body: string;
  url: string;
}

export interface RetreatScores {
  nutrition: CategoryScore;
  fitness: CategoryScore;
  mindfulness: CategoryScore;
  spa: CategoryScore;
  sleep: CategoryScore;
  medical: CategoryScore;
  personalization: CategoryScore;
  amenities: CategoryScore;
  pricing_value: CategoryScore;
  activities: CategoryScore;
  education: CategoryScore;
  travel_access: CategoryScore;
  sustainability: CategoryScore;
  social_proof: CategoryScore;
  addons: CategoryScore;
}

export interface WellnessRetreat {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  website_url: string;
  booking_url: string;

  country: string;
  region: string;
  city: string;
  address: string;
  coordinates: { lat: number; lng: number };
  nearest_airport: string;
  airport_distance_km: number;

  property_size: "micro" | "small" | "medium";
  room_count: number;
  max_guests: number;
  founded_year: number;
  property_type: string[];

  price_min_per_night: number;
  price_max_per_night: number;
  pricing_model: "all_inclusive" | "bed_and_breakfast" | "a_la_carte" | "weekly_rate";
  minimum_stay_nights: number;

  hero_image_url: string;
  gallery_images: string[];
  youtube_videos: YouTubeVideo[];
  instagram_handle: string;

  scores: RetreatScores;
  wrd_score: number;
  score_tier: "elite" | "exceptional" | "highly_recommended" | "good" | "listed";

  google_rating: number;
  google_review_count: number;
  tripadvisor_rating: number | null;
  tripadvisor_review_count: number | null;
  recent_reviews: Review[];
  awards: Award[];

  specialty_tags: string[];
  dietary_options: string[];
  program_types: string[];

  last_data_refresh: string;
  is_sponsored: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export const SCORE_WEIGHTS: Record<keyof RetreatScores, number> = {
  nutrition: 0.10,
  fitness: 0.09,
  mindfulness: 0.08,
  spa: 0.08,
  sleep: 0.07,
  medical: 0.08,
  personalization: 0.07,
  amenities: 0.07,
  pricing_value: 0.08,
  activities: 0.06,
  education: 0.06,
  travel_access: 0.05,
  sustainability: 0.05,
  social_proof: 0.05,
  addons: 0.01,
};

export const CATEGORY_LABELS: Record<keyof RetreatScores, string> = {
  nutrition: "Nutrition & Food Quality",
  fitness: "Fitness & Movement",
  mindfulness: "Mindfulness & Meditation",
  spa: "Spa & Relaxation",
  sleep: "Sleep & Recovery",
  medical: "Medical & Clinical",
  personalization: "Personalization",
  amenities: "Amenities & Facilities",
  pricing_value: "Pricing & Value",
  activities: "Activities & Excursions",
  education: "Education & Workshops",
  travel_access: "Ease of Travel",
  sustainability: "Sustainability & Ethics",
  social_proof: "Social Proof & Reputation",
  addons: "Add-Ons & Options",
};

export function getScoreTier(score: number): WellnessRetreat["score_tier"] {
  if (score >= 9.0) return "elite";
  if (score >= 8.0) return "exceptional";
  if (score >= 7.0) return "highly_recommended";
  if (score >= 6.0) return "good";
  return "listed";
}

export function getTierLabel(tier: WellnessRetreat["score_tier"]): string {
  const labels = {
    elite: "Elite",
    exceptional: "Exceptional",
    highly_recommended: "Highly Recommended",
    good: "Good",
    listed: "Listed",
  };
  return labels[tier];
}

export function getTierColor(tier: WellnessRetreat["score_tier"]): string {
  const colors = {
    elite: "bg-amber-100 text-amber-800 border-amber-300",
    exceptional: "bg-slate-100 text-slate-700 border-slate-300",
    highly_recommended: "bg-orange-50 text-orange-700 border-orange-300",
    good: "bg-gray-100 text-gray-600 border-gray-300",
    listed: "bg-gray-50 text-gray-500 border-gray-200",
  };
  return colors[tier];
}
