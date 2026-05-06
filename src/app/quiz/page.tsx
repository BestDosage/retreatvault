import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wellness Retreat Quiz — Find Your Perfect Match in 2 Minutes",
  description:
    "Answer 8 questions and our algorithm matches you to the best wellness retreat from 120+ rated properties. Based on clinical data and published research. Free, instant results.",
};

import { getAllRetreats } from "@/lib/data";
import QuizClient from "./QuizClient";

export default async function QuizPage() {
  const retreats = await getAllRetreats();

  // Send minimal retreat data to client for matching
  const retreatData = retreats.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    subtitle: r.subtitle,
    city: r.city,
    country: r.country,
    region: r.region,
    hero_image_url: r.hero_image_url,
    wrd_score: r.wrd_score,
    score_tier: r.score_tier,
    price_min_per_night: r.price_min_per_night,
    price_max_per_night: r.price_max_per_night,
    minimum_stay_nights: r.minimum_stay_nights,
    max_guests: r.max_guests,
    specialty_tags: r.specialty_tags,
    program_types: r.program_types,
    scores: {
      nutrition: r.scores.nutrition?.score || 0,
      fitness: r.scores.fitness?.score || 0,
      mindfulness: r.scores.mindfulness?.score || 0,
      spa: r.scores.spa?.score || 0,
      sleep: r.scores.sleep?.score || 0,
      medical: r.scores.medical?.score || 0,
      personalization: r.scores.personalization?.score || 0,
      amenities: r.scores.amenities?.score || 0,
      pricing_value: r.scores.pricing_value?.score || 0,
      activities: r.scores.activities?.score || 0,
      education: r.scores.education?.score || 0,
      travel_access: r.scores.travel_access?.score || 0,
      sustainability: r.scores.sustainability?.score || 0,
      social_proof: r.scores.social_proof?.score || 0,
      addons: r.scores.addons?.score || 0,
    },
  }));

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.retreatvault.com" },
      { "@type": "ListItem", position: 2, name: "Quiz" },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <QuizClient retreats={retreatData} />
    </>
  );
}
