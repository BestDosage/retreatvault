"""
Auto-Score Wellness Retreats
============================
Maps scraped data to the 15-category WRD scoring system.

Each category gets a score 0-10 with notes and data sources.
The base score comes from rating + review count (social proof signal),
then category-specific adjustments are made based on amenities, programs, dietary, etc.

For retreats with rich data, scores will be more accurate.
For sparse data, we default to mid-tier scores with low confidence flags.

Input:  retreats-with-ratings.json
Output: retreats-scored.json (ready to seed to Supabase)
"""

import json
import re
import uuid
from datetime import datetime

# Score weights from src/lib/types.ts SCORE_WEIGHTS
SCORE_WEIGHTS = {
    "nutrition": 0.10,
    "fitness": 0.09,
    "mindfulness": 0.08,
    "spa": 0.08,
    "sleep": 0.07,
    "medical": 0.08,
    "personalization": 0.07,
    "amenities": 0.07,
    "pricing_value": 0.08,
    "activities": 0.06,
    "education": 0.06,
    "travel_access": 0.05,
    "sustainability": 0.05,
    "social_proof": 0.05,
    "addons": 0.01,
}

TODAY = datetime.utcnow().date().isoformat()


def social_proof_score(rating, review_count):
    """Convert rating + review count to a 0-10 social proof score."""
    if not rating:
        return 5.0
    # Base score from rating (4.0-5.0 maps to 6-10)
    base = max(0, min(10, (rating - 3.0) * 5))
    # Review count multiplier — diminishing returns
    if review_count >= 500:
        bonus = 1.5
    elif review_count >= 100:
        bonus = 1.0
    elif review_count >= 50:
        bonus = 0.7
    elif review_count >= 20:
        bonus = 0.4
    elif review_count >= 5:
        bonus = 0.2
    else:
        bonus = 0
    return min(10, round(base + bonus, 1))


def keyword_score(text, keywords, base=5.0, max_boost=4.0, rating_boost=0):
    """Score based on how many target keywords appear in text.
    rating_boost: extra boost for highly-rated retreats (rating >= 4.5).
    """
    if not text:
        return base + rating_boost
    text_lower = text.lower()
    hits = sum(1 for kw in keywords if kw in text_lower)
    # More generous boost: each keyword adds 0.8, max boost increased
    boost = min(max_boost, hits * 0.9)
    return round(base + boost + rating_boost, 1)


def score_retreat(r):
    """Generate full RetreatScores object for a retreat."""
    name = r.get("name", "")
    desc = r.get("description", "")
    amenities = r.get("amenities", [])
    programs = r.get("program_types", [])
    dietary = r.get("dietary_options", [])
    rating = r.get("rating") or 0
    review_count = r.get("review_count") or 0
    price_max = r.get("price_max_per_night") or r.get("total_price_max") or 0

    all_text = f"{name} {desc} {' '.join(amenities)} {' '.join(programs)}".lower()

    # Quality lift — well-rated, well-reviewed retreats get a baseline boost across categories
    # This is the equivalent of "if a retreat is 4.8/5 with 200 reviews, it's likely good in most areas"
    if rating >= 4.8 and review_count >= 50:
        quality_lift = 1.5
    elif rating >= 4.7 and review_count >= 25:
        quality_lift = 1.2
    elif rating >= 4.5 and review_count >= 10:
        quality_lift = 0.8
    elif rating >= 4.0:
        quality_lift = 0.4
    else:
        quality_lift = 0

    # Build scores
    scores = {}

    # NUTRITION — based on dietary options and food keywords
    nutrition_kw = ["organic", "farm-to-table", "locally sourced", "chef", "nutritionist",
                    "macrobiotic", "ayurvedic", "raw food", "plant-based", "gluten-free"]
    nutrition_base = 5.5 + len(dietary) * 0.6 + quality_lift
    scores["nutrition"] = round(min(10, keyword_score(all_text, nutrition_kw, base=nutrition_base, max_boost=3.0)), 1)

    # FITNESS
    fitness_kw = ["yoga", "fitness", "gym", "trainer", "hiking", "pilates",
                  "boot camp", "personal training", "movement", "boxing", "swimming"]
    scores["fitness"] = keyword_score(all_text, fitness_kw, base=5.5 + quality_lift, max_boost=4.0)

    # MINDFULNESS
    mind_kw = ["meditation", "mindfulness", "silent", "breathwork", "vipassana",
               "zen", "spiritual", "sound healing", "chanting", "buddhist"]
    scores["mindfulness"] = keyword_score(all_text, mind_kw, base=5.5 + quality_lift, max_boost=4.0)

    # SPA
    spa_kw = ["spa", "massage", "treatment", "thermal", "sauna", "steam",
              "facial", "hammam", "thalasso", "hydrotherapy", "jacuzzi"]
    scores["spa"] = keyword_score(all_text, spa_kw, base=5.0 + quality_lift, max_boost=4.5)

    # SLEEP
    sleep_kw = ["sleep", "rest", "recovery", "circadian", "blackout", "luxury bedding"]
    scores["sleep"] = keyword_score(all_text, sleep_kw, base=6.0 + quality_lift, max_boost=3.0)

    # MEDICAL
    medical_kw = ["doctor", "medical", "clinical", "diagnostic", "iv drip",
                  "naturopath", "functional medicine", "ayurveda", "panchakarma",
                  "blood test", "consultation", "wellness assessment"]
    scores["medical"] = keyword_score(all_text, medical_kw, base=4.5 + quality_lift * 0.5, max_boost=4.5)

    # PERSONALIZATION — small group size proxy
    personal_kw = ["personalized", "custom", "private", "1-on-1", "intimate",
                   "small group", "tailored", "bespoke"]
    scores["personalization"] = keyword_score(all_text, personal_kw, base=5.5 + quality_lift, max_boost=3.5)

    # AMENITIES — based on count of amenities found
    base_amen = 5.5 + min(4.0, len(amenities) * 0.5) + quality_lift
    scores["amenities"] = round(min(10, base_amen), 1)

    # PRICING_VALUE — inverse of price (higher price = lower value score, but quality matters)
    # Assume mid-range $150-400/night is "good value"
    if not price_max or price_max < 100:
        scores["pricing_value"] = 7.5  # Budget = good value
    elif price_max < 250:
        scores["pricing_value"] = 7.0
    elif price_max < 500:
        scores["pricing_value"] = 6.5
    elif price_max < 1000:
        scores["pricing_value"] = 6.0
    else:
        scores["pricing_value"] = 5.5

    # ACTIVITIES
    activity_kw = ["hiking", "kayak", "snorkel", "diving", "horseback", "cooking class",
                   "excursion", "tour", "adventure", "surfing", "climbing", "biking"]
    scores["activities"] = keyword_score(all_text, activity_kw, base=5.5 + quality_lift, max_boost=3.5)

    # EDUCATION
    edu_kw = ["workshop", "training", "course", "certification", "teacher training",
              "lecture", "seminar", "education", "learn"]
    scores["education"] = keyword_score(all_text, edu_kw, base=5.5 + quality_lift, max_boost=4.0)

    # TRAVEL_ACCESS — proxy from country/region popularity
    region = r.get("region", "")
    country = (r.get("country") or "").lower()
    if region == "USA" or region == "Europe":
        scores["travel_access"] = 7.5
    elif region in ("Asia", "Mexico", "Canada"):
        scores["travel_access"] = 6.5
    else:
        scores["travel_access"] = 6.0

    # SUSTAINABILITY
    sus_kw = ["organic", "sustainable", "eco", "renewable", "permaculture",
              "zero waste", "solar", "biodynamic", "carbon"]
    scores["sustainability"] = keyword_score(all_text, sus_kw, base=5.5 + quality_lift, max_boost=3.5)

    # SOCIAL_PROOF — derived from rating + reviews
    scores["social_proof"] = social_proof_score(rating, review_count)

    # ADDONS
    addon_kw = ["add-on", "optional", "private session", "extension", "extra"]
    scores["addons"] = keyword_score(all_text, addon_kw, base=5.5, max_boost=3.0)

    # Cap all at 10
    for k in scores:
        scores[k] = min(10.0, max(0.0, scores[k]))

    return scores


def calc_wrd_score(scores):
    """Compute weighted WRD score."""
    total = 0
    for k, weight in SCORE_WEIGHTS.items():
        total += scores[k] * weight
    return round(total * 10) / 10


def get_score_tier(wrd):
    if wrd >= 9.0: return "elite"
    if wrd >= 8.0: return "exceptional"
    if wrd >= 7.0: return "highly_recommended"
    if wrd >= 6.0: return "good"
    return "listed"


def make_category_score(score, category, retreat):
    """Wrap score in CategoryScore format with notes and sources."""
    sources = []
    if retreat.get("source") == "bookretreats":
        sources.append("bookretreats")
    elif retreat.get("source") == "retreatguru":
        sources.append("retreatguru")
    if retreat.get("rating"):
        sources.append("aggregated_reviews")

    notes_map = {
        "nutrition": f"{len(retreat.get('dietary_options', []))} dietary options" + (f"; {', '.join(retreat.get('dietary_options', [])[:3])}" if retreat.get('dietary_options') else ""),
        "fitness": "Score based on fitness program keywords in retreat description",
        "mindfulness": "Score based on meditation/mindfulness program keywords",
        "spa": "Score based on spa amenities and treatment keywords",
        "sleep": "Score based on sleep/recovery program signals",
        "medical": "Score based on medical/clinical program signals",
        "personalization": "Score based on personalization keywords",
        "amenities": f"{len(retreat.get('amenities', []))} amenities documented",
        "pricing_value": f"Price tier: ${retreat.get('price_max_per_night', 0)}/night max" if retreat.get('price_max_per_night') else "Pricing data limited",
        "activities": "Score based on activity/excursion keywords",
        "education": "Score based on workshop/training keywords",
        "travel_access": f"Region: {retreat.get('region', 'Unknown')}",
        "sustainability": "Score based on sustainability keywords",
        "social_proof": f"{retreat.get('rating', 0)}/5 rating with {retreat.get('review_count', 0)} reviews",
        "addons": "Score based on add-on/extension signals",
    }

    return {
        "score": score,
        "sub_scores": {},
        "notes": notes_map.get(category, ""),
        "data_sources": sources,
        "last_updated": TODAY,
    }


def transform_for_supabase(r):
    """Transform a scraped+scored retreat into the WellnessRetreat schema."""
    raw_scores = score_retreat(r)
    wrapped_scores = {k: make_category_score(v, k, r) for k, v in raw_scores.items()}
    wrd = calc_wrd_score(raw_scores)

    # Determine property size from amenities/description
    amenities_count = len(r.get("amenities", []))
    if amenities_count >= 8:
        prop_size = "medium"
    elif amenities_count >= 4:
        prop_size = "small"
    else:
        prop_size = "micro"

    # Subtitle from description
    desc = r.get("description", "")
    subtitle = desc[:150].rsplit(" ", 1)[0] if len(desc) > 150 else desc[:150]

    # Build property type list
    property_type = []
    name_lower = r.get("name", "").lower()
    if "ashram" in name_lower: property_type.append("ashram")
    if "resort" in name_lower: property_type.append("resort")
    if "spa" in name_lower: property_type.append("destination spa")
    if "yoga" in name_lower: property_type.append("yoga retreat")
    if "wellness" in name_lower: property_type.append("wellness retreat")
    if not property_type:
        property_type = ["wellness retreat"]

    return {
        "id": str(uuid.uuid4()),
        "slug": r["slug"],
        "name": r["name"],
        "subtitle": subtitle,
        "website_url": r.get("website_url", ""),
        "booking_url": r.get("source_url", ""),
        "country": r.get("country", ""),
        "region": r.get("region", "Other"),
        "city": r.get("city", ""),
        "address": "",
        "lat": r.get("lat") or 0,
        "lng": r.get("lng") or 0,
        "nearest_airport": "",
        "airport_distance_km": 0,
        "property_size": prop_size,
        "room_count": 0,
        "max_guests": 0,
        "founded_year": 0,
        "property_type": property_type,
        "price_min_per_night": int(r.get("price_min_per_night") or 0),
        "price_max_per_night": int(r.get("price_max_per_night") or 0),
        "pricing_model": "all_inclusive",
        "minimum_stay_nights": r.get("duration_days") or 1,
        "hero_image_url": r.get("hero_image_url", ""),
        "gallery_images": r.get("gallery_images", []),
        "instagram_handle": "",
        "scores": wrapped_scores,
        "wrd_score": wrd,
        "score_tier": get_score_tier(wrd),
        "google_rating": r.get("rating") or 0,
        "google_review_count": r.get("review_count") or 0,
        "tripadvisor_rating": None,
        "tripadvisor_review_count": None,
        "specialty_tags": r.get("program_types", [])[:5],
        "dietary_options": r.get("dietary_options", []),
        "program_types": r.get("program_types", []),
        "is_sponsored": False,
        "is_verified": False,
        "awards": [],
        "data_source": r.get("source", ""),
    }


def main():
    print("Loading rated retreats...")
    with open("retreats-with-ratings.json") as f:
        retreats = json.load(f)
    print(f"Loaded {len(retreats)} retreats with ratings")

    print("\nScoring retreats...")
    scored = []
    for i, r in enumerate(retreats):
        try:
            transformed = transform_for_supabase(r)
            scored.append(transformed)
            if (i + 1) % 500 == 0:
                print(f"  Scored {i + 1}/{len(retreats)}...")
        except Exception as e:
            print(f"  Error scoring {r.get('name', 'unknown')}: {e}")

    # Tier distribution
    tiers = {}
    for r in scored:
        tier = r["score_tier"]
        tiers[tier] = tiers.get(tier, 0) + 1

    print(f"\nScored {len(scored)} retreats")
    print(f"Tier distribution: {tiers}")
    print(f"Avg WRD: {sum(r['wrd_score'] for r in scored) / len(scored):.2f}")

    with open("retreats-scored.json", "w") as f:
        json.dump(scored, f, indent=2)
    print(f"\nSaved to retreats-scored.json ({len(scored)} retreats)")


if __name__ == "__main__":
    main()
