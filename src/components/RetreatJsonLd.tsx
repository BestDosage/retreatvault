import type { WellnessRetreat } from "@/lib/types";

/**
 * Resort + AggregateRating JSON-LD for retreat detail pages.
 *
 * Distinct from the existing HealthAndBeautyBusiness/Product JSON-LD blocks
 * already rendered in src/app/retreats/[slug]/page.tsx — this adds the
 * Resort type (schema.org LodgingBusiness subtype) which those don't cover.
 *
 * Display-gate note: wrd_score (RetreatVault's own composite score) is
 * intentionally excluded here — that number is gated below 6.5 elsewhere in
 * the app. google_rating is a third-party fact (Google's own aggregate
 * rating of the property), not our score, so it's fine to include regardless
 * of wrd_score/tier.
 */
export function RetreatJsonLd({ retreat }: { retreat: WellnessRetreat }) {
  const hasCoordinates = retreat.coordinates && (retreat.coordinates.lat !== 0 || retreat.coordinates.lng !== 0);
  const hasRating = retreat.google_rating > 0 && retreat.google_review_count >= 5;
  const hasPrice = retreat.price_min_per_night > 0;

  const data = {
    "@context": "https://schema.org",
    "@type": "Resort",
    name: retreat.name,
    url: `https://www.retreatvault.com/retreats/${retreat.slug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: retreat.city || undefined,
      addressCountry: retreat.country || undefined,
    },
    ...(hasCoordinates && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: retreat.coordinates.lat,
        longitude: retreat.coordinates.lng,
      },
    }),
    ...(hasRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: retreat.google_rating,
        reviewCount: retreat.google_review_count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(hasPrice && {
      priceRange: `$${retreat.price_min_per_night}–$${retreat.price_max_per_night} per night`,
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
