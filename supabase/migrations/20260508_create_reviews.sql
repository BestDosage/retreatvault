CREATE TABLE IF NOT EXISTS scraped_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project TEXT NOT NULL,  -- 'retreatvault', 'bestdosage', 'oktodive'
  entity_id TEXT NOT NULL,  -- retreat slug, practitioner slug, or operator slug
  entity_name TEXT,
  source TEXT NOT NULL DEFAULT 'google',
  author_name TEXT,
  rating INTEGER,
  review_text TEXT NOT NULL,
  review_date TEXT,
  owner_response TEXT,
  review_id TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project, entity_id, review_id)
);

CREATE INDEX idx_scraped_reviews_project_entity ON scraped_reviews(project, entity_id);
CREATE INDEX idx_scraped_reviews_rating ON scraped_reviews(rating);
