-- Editorial reviews for retreats
-- These are unique, human-edited reviews that add original value
CREATE TABLE retreat_editorial_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retreat_id UUID REFERENCES retreats(id) ON DELETE CASCADE,
  review_html TEXT NOT NULL,
  verdict TEXT NOT NULL,
  best_for TEXT[] DEFAULT '{}',
  not_ideal_for TEXT[] DEFAULT '{}',
  alternatives JSONB DEFAULT '[]', -- [{name, slug, reason}]
  author TEXT DEFAULT 'Vault Editorial',
  status TEXT CHECK (status IN ('draft', 'published', 'needs_review')) DEFAULT 'draft',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(retreat_id)
);

CREATE INDEX idx_editorial_reviews_retreat ON retreat_editorial_reviews(retreat_id);
CREATE INDEX idx_editorial_reviews_status ON retreat_editorial_reviews(status);

ALTER TABLE retreat_editorial_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published" ON retreat_editorial_reviews FOR SELECT USING (status = 'published');
