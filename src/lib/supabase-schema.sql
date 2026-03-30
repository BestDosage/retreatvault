-- Wellness Retreat Directory — Supabase Schema
-- Run this in the Supabase SQL editor to create tables

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main retreats table
CREATE TABLE retreats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT,
  website_url TEXT,
  booking_url TEXT,

  -- Location
  country TEXT NOT NULL,
  region TEXT NOT NULL, -- 'USA' | 'Europe' | 'Canada' | 'Mexico' | 'Asia'
  city TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  nearest_airport TEXT,
  airport_distance_km INTEGER,

  -- Property
  property_size TEXT CHECK (property_size IN ('micro', 'small', 'medium')),
  room_count INTEGER,
  max_guests INTEGER,
  founded_year INTEGER,
  property_type TEXT[] DEFAULT '{}',

  -- Pricing
  price_min_per_night INTEGER, -- USD
  price_max_per_night INTEGER,
  pricing_model TEXT CHECK (pricing_model IN ('all_inclusive', 'bed_and_breakfast', 'a_la_carte', 'weekly_rate')),
  minimum_stay_nights INTEGER DEFAULT 1,

  -- Media
  hero_image_url TEXT,
  gallery_images TEXT[] DEFAULT '{}',
  instagram_handle TEXT,

  -- WRD Scoring (category scores stored as JSONB)
  scores JSONB NOT NULL DEFAULT '{}',
  wrd_score NUMERIC(3,1) NOT NULL DEFAULT 0,
  score_tier TEXT CHECK (score_tier IN ('elite', 'exceptional', 'highly_recommended', 'good', 'listed')),

  -- Social proof
  google_rating NUMERIC(2,1),
  google_review_count INTEGER DEFAULT 0,
  tripadvisor_rating NUMERIC(2,1),
  tripadvisor_review_count INTEGER DEFAULT 0,

  -- Tags (for filtering)
  specialty_tags TEXT[] DEFAULT '{}',
  dietary_options TEXT[] DEFAULT '{}',
  program_types TEXT[] DEFAULT '{}',

  -- Metadata
  last_data_refresh TIMESTAMPTZ DEFAULT NOW(),
  is_sponsored BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- YouTube videos per retreat
CREATE TABLE retreat_youtube_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retreat_id UUID REFERENCES retreats(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT,
  view_count INTEGER DEFAULT 0,
  channel_name TEXT,
  thumbnail_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews aggregated from multiple sources
CREATE TABLE retreat_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retreat_id UUID REFERENCES retreats(id) ON DELETE CASCADE,
  source TEXT CHECK (source IN ('google', 'tripadvisor', 'booking_com', 'instagram')),
  rating NUMERIC(2,1),
  text TEXT,
  author TEXT,
  review_date TIMESTAMPTZ,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Awards
CREATE TABLE retreat_awards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retreat_id UUID REFERENCES retreats(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  year INTEGER,
  issuing_body TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_retreats_region ON retreats(region);
CREATE INDEX idx_retreats_wrd_score ON retreats(wrd_score DESC);
CREATE INDEX idx_retreats_score_tier ON retreats(score_tier);
CREATE INDEX idx_retreats_slug ON retreats(slug);
CREATE INDEX idx_retreats_specialty_tags ON retreats USING GIN(specialty_tags);

-- Row Level Security (public read for now)
ALTER TABLE retreats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON retreats FOR SELECT USING (true);

ALTER TABLE retreat_youtube_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON retreat_youtube_videos FOR SELECT USING (true);

ALTER TABLE retreat_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON retreat_reviews FOR SELECT USING (true);

ALTER TABLE retreat_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON retreat_awards FOR SELECT USING (true);
