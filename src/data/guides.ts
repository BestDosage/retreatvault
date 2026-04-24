/**
 * Retreat Matchmaker Guides — data-driven content pages
 * targeting high-intent search queries.
 *
 * Each guide defines filters to pull matching retreats from the DB,
 * plus editorial framing written in Chad's voice.
 */

import { WellnessRetreat, RetreatScores } from "@/lib/types";

export interface GuideConfig {
  slug: string;
  title: string;
  subtitle: string;
  metaDescription: string;
  intro: string; // Chad-voice editorial intro (HTML)
  filters: (retreat: WellnessRetreat) => boolean;
  sortBy?: (a: WellnessRetreat, b: WellnessRetreat) => number;
  maxRetreats?: number;
  category: "persona" | "budget" | "goal" | "style";
  relatedGuides: string[]; // slugs
}

export const GUIDES: GuideConfig[] = [
  {
    slug: "best-retreats-for-burnout-recovery",
    title: "Best Retreats for Burnout Recovery",
    subtitle: "Data-scored retreats that actually help you reset — not just relax",
    metaDescription: "The best wellness retreats for burnout recovery, scored across sleep, mindfulness, and personalization. Honest rankings from RetreatvVault's data-driven methodology.",
    intro: `<p>Burnout isn't fixed by a nice hotel with a spa menu. It requires deep sleep repair, nervous system regulation, and enough time away from screens to remember what quiet feels like. We filtered 9,400+ retreats down to the ones that actually score high in the categories that matter for burnout: mindfulness (8.5+), sleep (8+), and personalization (7.5+).</p>
<p>These aren't the most expensive retreats. They're the ones with the right programming — guided meditation, structured digital detox, sleep protocols, and staff who understand that "rest" means more than a late checkout.</p>`,
    filters: (r) => {
      const mind = r.scores?.mindfulness?.score || 0;
      const sleep = r.scores?.sleep?.score || 0;
      const pers = r.scores?.personalization?.score || 0;
      return mind >= 8.5 && sleep >= 8 && pers >= 7.5;
    },
    sortBy: (a, b) => {
      const scoreA = (a.scores?.mindfulness?.score || 0) + (a.scores?.sleep?.score || 0);
      const scoreB = (b.scores?.mindfulness?.score || 0) + (b.scores?.sleep?.score || 0);
      return scoreB - scoreA;
    },
    maxRetreats: 20,
    category: "goal",
    relatedGuides: ["best-retreats-for-solo-travelers", "best-budget-wellness-retreats", "best-retreats-for-digital-detox"],
  },
  {
    slug: "best-budget-wellness-retreats",
    title: "Best Wellness Retreats Under $500/Night",
    subtitle: "High-scoring retreats that won't destroy your savings",
    metaDescription: "The best affordable wellness retreats under $500/night, ranked by our proprietary scoring system. Quality wellness doesn't require a five-figure budget.",
    intro: `<p>The wellness retreat industry wants you to believe transformation costs $3,000/night. It doesn't. Some of the highest-scoring retreats in our database charge under $500/night — and a few under $200. The difference isn't quality. It's location, scale, and whether they spend their budget on marble lobbies or actual programming.</p>
<p>We filtered for retreats scoring 7.0+ overall with max nightly rates under $500. Then sorted by value score — how much wellness you actually get per dollar spent.</p>`,
    filters: (r) => r.price_max_per_night > 0 && r.price_max_per_night <= 500 && r.wrd_score >= 7.0,
    sortBy: (a, b) => (b.scores?.pricing_value?.score || 0) - (a.scores?.pricing_value?.score || 0),
    maxRetreats: 25,
    category: "budget",
    relatedGuides: ["best-retreats-for-first-timers", "best-retreats-for-burnout-recovery"],
  },
  {
    slug: "best-medical-wellness-retreats",
    title: "Best Medical Wellness & Longevity Retreats",
    subtitle: "Retreats with real doctors, real diagnostics, real results",
    metaDescription: "Top-rated medical wellness and longevity retreats with clinical diagnostics, physician oversight, and evidence-based programming. Data-scored by RetreatvVault.",
    intro: `<p>Medical wellness retreats are the fastest-growing segment in the industry, and also the most overpromised. Every spa with a blood pressure cuff now calls itself "medical." We filtered for the real thing: retreats scoring 8.5+ in our Medical & Clinical category, which requires on-site physicians, diagnostic capabilities, and personalized treatment protocols — not just a wellness questionnaire.</p>
<p>These retreats offer IV therapy, genetic testing, blood panels, functional medicine consultations, and follow-up care. If you're spending $1,000+/night, you should be getting more than essential oils.</p>`,
    filters: (r) => (r.scores?.medical?.score || 0) >= 8.5,
    sortBy: (a, b) => (b.scores?.medical?.score || 0) - (a.scores?.medical?.score || 0),
    maxRetreats: 20,
    category: "goal",
    relatedGuides: ["best-retreats-for-burnout-recovery", "best-luxury-wellness-retreats"],
  },
  {
    slug: "best-retreats-for-solo-travelers",
    title: "Best Retreats for Solo Travelers",
    subtitle: "Small properties, personalized programs, no awkward couples energy",
    metaDescription: "The best wellness retreats for solo travelers — intimate properties with personalized programs, high safety scores, and welcoming solo-friendly culture.",
    intro: `<p>Going to a wellness retreat alone is the move. No compromising on schedule, no performing relaxation for someone else's benefit. But not every retreat is built for it. Large resorts can feel isolating when you're solo. Properties that cater to couples make you the odd one out.</p>
<p>We filtered for small properties (under 30 guests), high personalization scores (8+), and strong mindfulness programming. These are the retreats where being alone is the feature, not the bug.</p>`,
    filters: (r) => {
      const pers = r.scores?.personalization?.score || 0;
      return r.max_guests > 0 && r.max_guests <= 30 && pers >= 8;
    },
    sortBy: (a, b) => b.wrd_score - a.wrd_score,
    maxRetreats: 20,
    category: "persona",
    relatedGuides: ["best-retreats-for-first-timers", "best-budget-wellness-retreats", "best-retreats-for-burnout-recovery"],
  },
  {
    slug: "best-retreats-for-first-timers",
    title: "Best Retreats for First-Timers",
    subtitle: "Approachable, well-structured, and won't throw you into a 5am meditation on day one",
    metaDescription: "New to wellness retreats? These beginner-friendly retreats score highest for personalization, value, and ease of travel. No experience required.",
    intro: `<p>Your first retreat shouldn't require a connecting flight through three countries, a 7-night minimum, or a pre-existing meditation practice. It should be easy to get to, flexible on duration, clearly priced, and staffed by people who know how to onboard someone who's never done this before.</p>
<p>We filtered for high scores in personalization (7.5+), value (7.5+), and travel access (7+). These retreats make the barrier to entry as low as possible while still delivering a genuinely transformative experience.</p>`,
    filters: (r) => {
      const pers = r.scores?.personalization?.score || 0;
      const val = r.scores?.pricing_value?.score || 0;
      const travel = r.scores?.travel_access?.score || 0;
      return pers >= 7.5 && val >= 7.5 && travel >= 7;
    },
    sortBy: (a, b) => {
      const scoreA = (a.scores?.personalization?.score || 0) + (a.scores?.pricing_value?.score || 0) + (a.scores?.travel_access?.score || 0);
      const scoreB = (b.scores?.personalization?.score || 0) + (b.scores?.pricing_value?.score || 0) + (b.scores?.travel_access?.score || 0);
      return scoreB - scoreA;
    },
    maxRetreats: 20,
    category: "persona",
    relatedGuides: ["best-budget-wellness-retreats", "best-retreats-for-solo-travelers"],
  },
  {
    slug: "best-luxury-wellness-retreats",
    title: "Best Luxury Wellness Retreats",
    subtitle: "The $1,500+/night retreats that actually justify the price tag",
    metaDescription: "The world's best luxury wellness retreats rated 8.5+ by RetreatvVault. Ultra-premium properties with elite programming, not just expensive rooms.",
    intro: `<p>Luxury in wellness means nothing unless the programming matches the price tag. A $2,000/night room with a $50 massage menu is just an expensive hotel. We filtered for retreats charging $1,500+ per night that score 8.5+ overall — meaning they deliver elite-level programming across nutrition, spa, medical, and personalization. Not just marble bathrooms.</p>
<p>These retreats earned their price through depth of expertise, staff ratios, clinical infrastructure, and the kind of attention that makes you feel like the only guest. If you're spending this much, you should get measurably more than a mid-range retreat offers.</p>`,
    filters: (r) => r.price_min_per_night >= 1500 && r.wrd_score >= 8.5,
    sortBy: (a, b) => b.wrd_score - a.wrd_score,
    maxRetreats: 20,
    category: "budget",
    relatedGuides: ["best-medical-wellness-retreats", "best-retreats-for-couples"],
  },
  {
    slug: "best-retreats-for-couples",
    title: "Best Wellness Retreats for Couples",
    subtitle: "High amenity scores, premium settings, programs built for two",
    metaDescription: "The best wellness retreats for couples — luxury properties with premium amenities, couples treatments, and programs designed for shared experiences.",
    intro: `<p>A couples retreat should be more than two massage tables pushed together. The best ones offer programming that works whether you're doing it side by side or taking turns — one person in yoga while the other hikes, then meeting for dinner over food that's actually worth talking about.</p>
<p>We filtered for high amenity scores (8.5+), premium pricing (indicating couples-oriented luxury), and properties with enough programming variety that both people find their thing. These aren't just pretty hotels. They're retreats where the relationship benefits from the shared experience.</p>`,
    filters: (r) => {
      const amenities = r.scores?.amenities?.score || 0;
      return amenities >= 8.5 && r.price_max_per_night >= 1000;
    },
    sortBy: (a, b) => (b.scores?.amenities?.score || 0) - (a.scores?.amenities?.score || 0),
    maxRetreats: 20,
    category: "persona",
    relatedGuides: ["best-luxury-wellness-retreats", "best-retreats-for-burnout-recovery"],
  },
  {
    slug: "best-retreats-for-fitness",
    title: "Best Fitness-Focused Wellness Retreats",
    subtitle: "Retreats where the gym isn't an afterthought",
    metaDescription: "Top-rated fitness wellness retreats with structured training programs, certified coaches, and movement-focused programming. Scored by RetreatvVault.",
    intro: `<p>Most wellness retreats treat fitness like a box to check — a yoga class here, a nature walk there. These retreats treat it like the main event. We filtered for retreats scoring 9.0+ in Fitness & Movement, meaning structured daily programming, certified trainers, real equipment, and progression-based training that actually challenges you.</p>
<p>If you want to come home stronger, faster, or more mobile — not just "refreshed" — these are your retreats.</p>`,
    filters: (r) => (r.scores?.fitness?.score || 0) >= 9.0,
    sortBy: (a, b) => (b.scores?.fitness?.score || 0) - (a.scores?.fitness?.score || 0),
    maxRetreats: 20,
    category: "goal",
    relatedGuides: ["best-retreats-for-burnout-recovery", "best-budget-wellness-retreats"],
  },
  {
    slug: "best-retreats-for-digital-detox",
    title: "Best Digital Detox Retreats",
    subtitle: "Places where putting your phone away is the point, not a suggestion",
    metaDescription: "The best digital detox retreats ranked by mindfulness, sleep, and remote location scores. Disconnect to reconnect — data-backed picks from RetreatvVault.",
    intro: `<p>A real digital detox retreat doesn't just suggest you put your phone down. It makes it easy — or in some cases, mandatory. Remote locations with limited connectivity, structured mindfulness programming, and evening protocols designed to replace scrolling with actual rest.</p>
<p>We filtered for retreats scoring 9+ in mindfulness with remote locations (travel access under 6, meaning they're intentionally hard to reach). The inconvenience is the feature.</p>`,
    filters: (r) => {
      const mind = r.scores?.mindfulness?.score || 0;
      const travel = r.scores?.travel_access?.score || 0;
      return mind >= 9 && travel <= 6;
    },
    sortBy: (a, b) => (b.scores?.mindfulness?.score || 0) - (a.scores?.mindfulness?.score || 0),
    maxRetreats: 20,
    category: "goal",
    relatedGuides: ["best-retreats-for-burnout-recovery", "best-retreats-for-solo-travelers"],
  },
  {
    slug: "best-retreats-for-nutrition",
    title: "Best Retreats for Nutrition & Clean Eating",
    subtitle: "Where the kitchen is as important as the spa",
    metaDescription: "Top-rated wellness retreats for nutrition, clean eating, and food quality. Organic kitchens, therapeutic diets, and nutritionist-led programming.",
    intro: `<p>The food at most wellness retreats is either forgettable health food or overpriced restaurant cuisine with a "wellness" label. These retreats get it right — nutrition scores of 9+ mean dedicated nutritionists, organic sourcing, therapeutic meal planning, and food that actually tastes like someone who loves cooking made it.</p>
<p>Whether you're doing a structured detox, managing a condition through diet, or just want to eat clean for a week and learn something, these kitchens deliver.</p>`,
    filters: (r) => (r.scores?.nutrition?.score || 0) >= 9.0,
    sortBy: (a, b) => (b.scores?.nutrition?.score || 0) - (a.scores?.nutrition?.score || 0),
    maxRetreats: 20,
    category: "goal",
    relatedGuides: ["best-medical-wellness-retreats", "best-budget-wellness-retreats"],
  },
  // ═══ BATCH 2: Additional guides ═══
  {
    slug: "best-ayurveda-retreats",
    title: "Best Ayurveda Retreats",
    subtitle: "Authentic Ayurvedic programming with real practitioners, not spa theater",
    metaDescription: "Top-rated Ayurveda retreats with authentic Panchakarma, dosha analysis, and Ayurvedic physicians. Data-scored by RetreatvVault.",
    intro: `<p>Ayurveda is one of the most co-opted words in wellness. Half the retreats claiming "Ayurvedic programming" are doing oil massages and calling it Panchakarma. We filtered for retreats where Ayurveda is the actual foundation — on-site vaidyas, dosha-based meal plans, real Panchakarma protocols, and scores that back it up.</p>`,
    filters: (r) => {
      const tags = [...(r.specialty_tags || []), ...(r.program_types || [])].join(" ").toLowerCase();
      return tags.includes("ayurved") && (r.scores?.medical?.score || 0) >= 7.5;
    },
    sortBy: (a, b) => b.wrd_score - a.wrd_score,
    maxRetreats: 20,
    category: "goal",
    relatedGuides: ["best-medical-wellness-retreats", "best-retreats-for-nutrition"],
  },
  {
    slug: "best-yoga-retreats",
    title: "Best Yoga Retreats",
    subtitle: "For practitioners who want depth, not just a class on the beach",
    metaDescription: "The best yoga retreats worldwide, scored for mindfulness, personalization, and teaching quality. From beginner-friendly to advanced teacher training.",
    intro: `<p>Every resort with a yoga mat calls itself a yoga retreat. These aren't those. We filtered for retreats scoring 8.5+ in mindfulness with yoga as a core specialty — meaning structured daily practice, qualified teachers (not fitness instructors who did a weekend cert), and programming that goes beyond flow-and-go.</p>`,
    filters: (r) => {
      const tags = [...(r.specialty_tags || []), ...(r.program_types || [])].join(" ").toLowerCase();
      return (tags.includes("yoga") || tags.includes("meditation")) && (r.scores?.mindfulness?.score || 0) >= 8.5;
    },
    sortBy: (a, b) => (b.scores?.mindfulness?.score || 0) - (a.scores?.mindfulness?.score || 0),
    maxRetreats: 25,
    category: "goal",
    relatedGuides: ["best-retreats-for-digital-detox", "best-retreats-for-solo-travelers"],
  },
  {
    slug: "best-weight-loss-retreats",
    title: "Best Weight Loss & Body Transformation Retreats",
    subtitle: "Clinically supervised programs with nutrition science, not crash diets",
    metaDescription: "Top weight loss retreats with medical supervision, nutrition science, and fitness programming. Data-scored results, not marketing promises.",
    intro: `<p>Weight loss retreats range from dangerous crash-diet camps to genuinely transformative clinical programs. We filtered for retreats scoring 8.5+ in both nutrition AND fitness, with medical oversight (7+). These places use metabolic testing, physician-supervised protocols, and sustainable nutrition education — not juice cleanses and shame.</p>`,
    filters: (r) => {
      const nutr = r.scores?.nutrition?.score || 0;
      const fit = r.scores?.fitness?.score || 0;
      const med = r.scores?.medical?.score || 0;
      return nutr >= 8.5 && fit >= 8.5 && med >= 7;
    },
    sortBy: (a, b) => {
      const scoreA = (a.scores?.nutrition?.score || 0) + (a.scores?.fitness?.score || 0);
      const scoreB = (b.scores?.nutrition?.score || 0) + (b.scores?.fitness?.score || 0);
      return scoreB - scoreA;
    },
    maxRetreats: 20,
    category: "goal",
    relatedGuides: ["best-retreats-for-fitness", "best-medical-wellness-retreats"],
  },
  {
    slug: "best-retreats-no-minimum-stay",
    title: "Best Retreats with No Minimum Stay",
    subtitle: "Quality wellness without committing to a full week",
    metaDescription: "Top-rated wellness retreats with 1-2 night minimum stays. Perfect for weekend getaways or testing the retreat experience without a week-long commitment.",
    intro: `<p>Most serious retreats require 3-7 nights minimum. That makes sense for deep programs, but it's a barrier for first-timers and busy people who can't disappear for a week. These retreats score 7+ overall with minimum stays of 1-2 nights — meaning you can get a real taste without the calendar commitment.</p>`,
    filters: (r) => r.minimum_stay_nights <= 2 && r.wrd_score >= 7,
    sortBy: (a, b) => b.wrd_score - a.wrd_score,
    maxRetreats: 25,
    category: "style",
    relatedGuides: ["best-retreats-for-first-timers", "best-budget-wellness-retreats"],
  },
  {
    slug: "best-retreats-in-asia",
    title: "Best Wellness Retreats in Asia",
    subtitle: "The spiritual heartland of global wellness, scored and ranked",
    metaDescription: "The highest-rated wellness retreats across Asia — India, Thailand, Bali, Sri Lanka, and beyond. Data-driven rankings from RetreatvVault.",
    intro: `<p>Asia invented most of what the Western wellness industry now sells. Ayurveda, yoga, Thai massage, Balinese healing, Traditional Chinese Medicine — this is where those traditions live and breathe. We filtered for retreats in Asia scoring 8+ overall. The pricing advantage is real: you'll find elite-level programming at half the cost of equivalent European or American retreats.</p>`,
    filters: (r) => r.region === "Asia" && r.wrd_score >= 8,
    sortBy: (a, b) => b.wrd_score - a.wrd_score,
    maxRetreats: 25,
    category: "style",
    relatedGuides: ["best-ayurveda-retreats", "best-yoga-retreats", "best-budget-wellness-retreats"],
  },
  {
    slug: "best-retreats-in-europe",
    title: "Best Wellness Retreats in Europe",
    subtitle: "Centuries of thermal tradition meets modern clinical precision",
    metaDescription: "Top-rated European wellness retreats — from Alpine medical clinics to Mediterranean spas. Scored across 15 categories by RetreatvVault.",
    intro: `<p>European wellness has a thousand-year head start. The continent's thermal bath tradition, fasting clinics (Buchinger, Mayr), and integrative medical spas are the real thing — not imported wellness trends repackaged for tourists. We filtered for retreats in Europe scoring 8+ overall. Expect higher prices than Asia but also higher medical rigor and infrastructure.</p>`,
    filters: (r) => r.region === "Europe" && r.wrd_score >= 8,
    sortBy: (a, b) => b.wrd_score - a.wrd_score,
    maxRetreats: 25,
    category: "style",
    relatedGuides: ["best-medical-wellness-retreats", "best-luxury-wellness-retreats"],
  },
  {
    slug: "best-retreats-in-usa",
    title: "Best Wellness Retreats in the USA",
    subtitle: "No passport required — top-scoring retreats across America",
    metaDescription: "The best wellness retreats in the United States, scored across 15 categories. From Arizona desert to California coast. No passport needed.",
    intro: `<p>You don't need to fly to Bali. The US has some of the highest-scoring retreats in our database — Canyon Ranch, Golden Door, Miraval, and dozens of lesser-known properties that deliver serious results. We filtered for USA retreats scoring 7.5+ overall. The advantage: direct flights, no visa, no jet lag eating into your recovery time.</p>`,
    filters: (r) => r.region === "USA" && r.wrd_score >= 7.5,
    sortBy: (a, b) => b.wrd_score - a.wrd_score,
    maxRetreats: 30,
    category: "style",
    relatedGuides: ["best-retreats-for-first-timers", "best-retreats-for-burnout-recovery"],
  },
  {
    slug: "best-spa-retreats",
    title: "Best Spa-Focused Wellness Retreats",
    subtitle: "When the spa IS the reason you're going",
    metaDescription: "The world's best spa retreats, scored 9+ for spa quality, treatment variety, and relaxation. Premium bodywork, thermal facilities, and recovery protocols.",
    intro: `<p>Some people want medical diagnostics. Some want spiritual awakening. Some people just want an exceptional spa — world-class bodywork, thermal circuits, treatment menus that go deep, and therapists who've been doing this for decades. No judgment. We filtered for retreats scoring 9+ in Spa & Relaxation. These aren't hotels with a spa attached. The spa IS the retreat.</p>`,
    filters: (r) => (r.scores?.spa?.score || 0) >= 9.0,
    sortBy: (a, b) => (b.scores?.spa?.score || 0) - (a.scores?.spa?.score || 0),
    maxRetreats: 20,
    category: "goal",
    relatedGuides: ["best-luxury-wellness-retreats", "best-retreats-for-couples"],
  },
  {
    slug: "best-sustainable-wellness-retreats",
    title: "Best Eco-Friendly & Sustainable Retreats",
    subtitle: "Wellness that doesn't cost the planet",
    metaDescription: "Top-rated eco-friendly wellness retreats with strong sustainability practices. Solar power, organic farming, zero waste, and genuine environmental commitment.",
    intro: `<p>The irony of flying 8,000 miles to "connect with nature" at a resort that trucks in bottled water isn't lost on everyone. These retreats score 8+ in sustainability — meaning real practices like solar power, organic gardens, water reclamation, local sourcing, and carbon offset programs. Not just a recycling bin in the lobby.</p>`,
    filters: (r) => (r.scores?.sustainability?.score || 0) >= 8.0 && r.wrd_score >= 7,
    sortBy: (a, b) => (b.scores?.sustainability?.score || 0) - (a.scores?.sustainability?.score || 0),
    maxRetreats: 20,
    category: "style",
    relatedGuides: ["best-retreats-for-digital-detox", "best-budget-wellness-retreats"],
  },
  {
    slug: "best-retreats-for-sleep",
    title: "Best Retreats for Sleep & Recovery",
    subtitle: "Fix your sleep architecture, not just your stress",
    metaDescription: "Top wellness retreats for sleep improvement — optimized environments, sleep tracking, circadian protocols, and recovery-focused programming.",
    intro: `<p>Bad sleep ruins everything else. Exercise, nutrition, meditation — none of it works if you're running on 5 hours of fragmented rest. These retreats score 8.5+ in Sleep & Recovery, meaning they've invested in sleep-optimized rooms, circadian lighting, evening protocols, and in some cases wearable sleep tracking. This isn't "early bedtime and herbal tea." It's structured sleep rehabilitation.</p>`,
    filters: (r) => (r.scores?.sleep?.score || 0) >= 8.5,
    sortBy: (a, b) => (b.scores?.sleep?.score || 0) - (a.scores?.sleep?.score || 0),
    maxRetreats: 20,
    category: "goal",
    relatedGuides: ["best-retreats-for-burnout-recovery", "best-retreats-for-digital-detox"],
  },
];

export function getGuideBySlug(slug: string): GuideConfig | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function getRelatedGuides(slugs: string[]): GuideConfig[] {
  return slugs.map((s) => GUIDES.find((g) => g.slug === s)).filter(Boolean) as GuideConfig[];
}
