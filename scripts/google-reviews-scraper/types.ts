export interface GoogleReview {
  author_name: string;
  rating: number;
  review_text: string;
  review_date: string;
  owner_response: string | null;
  review_id: string;
}

export interface ScrapeResult {
  place_name: string;
  place_url: string;
  total_reviews_found: number;
  reviews: GoogleReview[];
  photo_urls: string[];
  scraped_at: string;
  errors: string[];
}

export interface ScrapeOptions {
  maxReviews?: number;
  scrollDelay?: number;
  proxy?: string;
  headless?: boolean;
  timeout?: number;
}
