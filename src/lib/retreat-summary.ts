import { WellnessRetreat, CATEGORY_LABELS, RetreatScores } from "@/lib/types";

// ─── helpers ───────────────────────────────────────────────────────────
type ScoredCategory = { key: keyof RetreatScores; label: string; score: number };

function ranked(retreat: WellnessRetreat): ScoredCategory[] {
  return (Object.entries(retreat.scores) as [keyof RetreatScores, { score: number }][])
    .map(([key, v]) => ({ key, label: CATEGORY_LABELS[key], score: v.score }))
    .sort((a, b) => b.score - a.score);
}

function priceTag(retreat: WellnessRetreat): string {
  const avg = (retreat.price_min_per_night + retreat.price_max_per_night) / 2;
  if (avg >= 1500) return "ultra-luxury";
  if (avg >= 800) return "luxury";
  if (avg >= 400) return "premium";
  if (avg >= 200) return "mid-range";
  return "budget-friendly";
}

function propertyDesc(retreat: WellnessRetreat): string {
  if (retreat.property_size === "micro" && retreat.max_guests <= 20)
    return "boutique micro-retreat";
  if (retreat.property_size === "micro") return "intimate boutique property";
  if (retreat.property_size === "small" && retreat.max_guests <= 40)
    return "small-scale wellness retreat";
  if (retreat.property_size === "small") return "boutique retreat";
  if (retreat.max_guests >= 150) return "full-scale wellness resort";
  if (retreat.max_guests >= 80) return "mid-sized wellness destination";
  return "medium-scale wellness retreat";
}

function tierAdj(tier: WellnessRetreat["score_tier"]): string {
  const map: Record<string, string> = {
    elite: "elite-tier",
    exceptional: "exceptional",
    highly_recommended: "highly regarded",
    good: "solid",
    listed: "emerging",
  };
  return map[tier] || "notable";
}

/** deterministic seed from retreat slug so the same retreat always picks the same templates */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset) % arr.length];
}

// ─── openers ───────────────────────────────────────────────────────────
// 12 opener templates keyed by conditions so pages don't all start alike
type OpenerFn = (r: WellnessRetreat, pd: string, top: ScoredCategory) => string;

const OPENERS_ELITE: OpenerFn[] = [
  (r, pd) => `Situated in ${r.city}, ${r.country}, ${r.name} operates as a ${pd} that has earned an elite Vault Score of ${r.wrd_score}/10.`,
  (r, pd) => `Few wellness destinations command a ${r.wrd_score}/10 rating — ${r.name}, a ${pd} in ${r.city}, ${r.country}, is one of them.`,
  (r, pd) => `With a Vault Score of ${r.wrd_score}/10, ${r.name} in ${r.city} stands among the top-rated ${pd.replace("boutique ", "").replace("full-scale ", "")}s globally.`,
  (r, pd) => `${r.name} has established itself as a benchmark in the wellness industry, earning ${r.wrd_score}/10 from our analysts at this ${pd} in ${r.city}, ${r.country}.`,
];

const OPENERS_EXCEPTIONAL: OpenerFn[] = [
  (r, pd) => `${r.name} in ${r.city}, ${r.country} delivers an exceptional wellness experience, reflected in its ${r.wrd_score}/10 Vault Score as a ${pd}.`,
  (r, pd) => `Scoring ${r.wrd_score}/10 on our proprietary rating, ${r.name} is an ${pd} in ${r.city} that consistently outperforms across multiple categories.`,
  (r, pd) => `Our data positions ${r.name} — a ${pd} based in ${r.city}, ${r.country} — firmly in exceptional territory at ${r.wrd_score}/10.`,
  (r, pd, top) => `${r.city}'s ${r.name} earned a ${r.wrd_score}/10 Vault Score, driven in part by a standout ${top.score.toFixed(1)} in ${top.label}.`,
];

const OPENERS_MID: OpenerFn[] = [
  (r, pd) => `${r.name} is a ${pd} in ${r.city}, ${r.country} that earned a ${r.wrd_score}/10 Vault Score across our 15-category analysis.`,
  (r, pd) => `Located in ${r.city}, ${r.country}, ${r.name} is a ${tierAdj(r.score_tier)} ${pd} rated ${r.wrd_score}/10 by our analysts.`,
  (r, pd) => `Our review of ${r.name}, a ${pd} in ${r.city}, yields a ${r.wrd_score}/10 composite score with notable category variation.`,
  (r, pd) => `At ${r.wrd_score}/10, ${r.name} in ${r.city}, ${r.country} shows clear strengths that distinguish this ${pd} from its regional peers.`,
];

// ─── strength sentences ────────────────────────────────────────────────
type StrFn = (top: ScoredCategory[], r: WellnessRetreat) => string;

const STRENGTHS: StrFn[] = [
  (top) => `Its highest-rated dimensions are ${top[0].label} (${top[0].score.toFixed(1)}/10) and ${top[1].label} (${top[1].score.toFixed(1)}/10), with ${top[2].label} close behind at ${top[2].score.toFixed(1)}.`,
  (top) => `The property excels in ${top[0].label} at ${top[0].score.toFixed(1)}/10, complemented by strong marks in ${top[1].label} (${top[1].score.toFixed(1)}) and ${top[2].label} (${top[2].score.toFixed(1)}).`,
  (top, r) => `Analysts scored ${r.name} highest in ${top[0].label} (${top[0].score.toFixed(1)}), followed by ${top[1].label} (${top[1].score.toFixed(1)}) and ${top[2].label} (${top[2].score.toFixed(1)}).`,
  (top) => `Standout categories include ${top[0].label} at ${top[0].score.toFixed(1)}/10 and ${top[1].label} at ${top[1].score.toFixed(1)}/10, both among the strongest we've recorded in their class.`,
  (top) => `Top marks went to ${top[0].label} (${top[0].score.toFixed(1)}), ${top[1].label} (${top[1].score.toFixed(1)}), and ${top[2].label} (${top[2].score.toFixed(1)}).`,
];

// ─── weakness sentences ────────────────────────────────────────────────
type WeakFn = (weak: ScoredCategory) => string;

const WEAKNESSES: WeakFn[] = [
  (w) => `${w.label}, at ${w.score.toFixed(1)}/10, represents the clearest area for growth.`,
  (w) => `The data flags ${w.label} (${w.score.toFixed(1)}/10) as the category with the most room for improvement.`,
  (w) => `Where the property trails is ${w.label}, scoring ${w.score.toFixed(1)}/10 — an area we'll be watching in future reviews.`,
  (w) => `At ${w.score.toFixed(1)}/10, ${w.label} lags behind the retreat's otherwise strong profile.`,
];

// ─── price + property color ────────────────────────────────────────────
type PriceFn = (r: WellnessRetreat, pt: string) => string;

const PRICE_LINES: PriceFn[] = [
  (r, pt) => `Priced from $${r.price_min_per_night}/night, this ${pt} property accommodates up to ${r.max_guests} guests.`,
  (r, pt) => `Nightly rates start at $${r.price_min_per_night} and can reach $${r.price_max_per_night}, placing it firmly in the ${pt} segment.`,
  (r, pt) => `With rates between $${r.price_min_per_night} and $${r.price_max_per_night} per night, ${r.name} sits in the ${pt} bracket${r.max_guests <= 20 ? ", keeping the guest count intentionally low at " + r.max_guests : ""}.`,
  (r, pt) => `Starting at $${r.price_min_per_night}/night${r.pricing_model === "all_inclusive" ? " (all-inclusive)" : ""}, the ${pt} positioning aligns with the caliber of programming offered.`,
];

// ─── main generator ────────────────────────────────────────────────────
export function generateRetreatSummary(retreat: WellnessRetreat): string {
  const seed = hash(retreat.slug);
  const all = ranked(retreat);
  const top3 = all.slice(0, 3);
  const weakest = all[all.length - 1];
  const pd = propertyDesc(retreat);
  const pt = priceTag(retreat);

  // Pick opener based on tier
  let opener: string;
  if (retreat.score_tier === "elite") {
    opener = pick(OPENERS_ELITE, seed)(retreat, pd, top3[0]);
  } else if (retreat.score_tier === "exceptional") {
    opener = pick(OPENERS_EXCEPTIONAL, seed)(retreat, pd, top3[0]);
  } else {
    opener = pick(OPENERS_MID, seed)(retreat, pd, top3[0]);
  }

  const strength = pick(STRENGTHS, seed, 1)(top3, retreat);
  const weakness = pick(WEAKNESSES, seed, 2)(weakest);
  const priceLine = pick(PRICE_LINES, seed, 3)(retreat, pt);

  return `${opener} ${strength} ${weakness} ${priceLine}`;
}

// ─── FAQ generator ─────────────────────────────────────────────────────
export interface FaqItem {
  question: string;
  answer: string;
}

export function generateRetreatFaqs(retreat: WellnessRetreat): FaqItem[] {
  const all = ranked(retreat);
  const top = all[0];
  const topSpecialty = retreat.specialty_tags[0]?.replace(/-/g, " ") || "holistic wellness";
  const pt = priceTag(retreat);
  const tierLabel =
    retreat.score_tier === "elite" ? "Elite" :
    retreat.score_tier === "exceptional" ? "Exceptional" :
    retreat.score_tier === "highly_recommended" ? "Highly Recommended" :
    retreat.score_tier === "good" ? "Good" : "Listed";

  const faqs: FaqItem[] = [
    {
      question: `What is ${retreat.name} best known for?`,
      answer: `${retreat.name} is best known for its ${top.label.toLowerCase()} programming, which scored ${top.score.toFixed(1)}/10 in our analysis. The property in ${retreat.city}, ${retreat.country} specializes in ${topSpecialty} and is classified as a ${propertyDesc(retreat)}.`,
    },
    {
      question: `How much does a stay at ${retreat.name} cost?`,
      answer: `Nightly rates at ${retreat.name} range from $${retreat.price_min_per_night} to $${retreat.price_max_per_night}${retreat.pricing_model === "all_inclusive" ? " on an all-inclusive basis" : ""}. The minimum stay is ${retreat.minimum_stay_nights} night${retreat.minimum_stay_nights > 1 ? "s" : ""}, placing it in the ${pt} tier of wellness retreats.`,
    },
    {
      question: `What is the ${retreat.name} Vault Score?`,
      answer: `${retreat.name} holds a Vault Score of ${retreat.wrd_score}/10, earning a "${tierLabel}" rating. This composite score is derived from 15 weighted categories covering nutrition, fitness, mindfulness, medical care, and more. The retreat's strongest category is ${top.label} at ${top.score.toFixed(1)}/10.`,
    },
  ];

  // 4th FAQ varies based on data
  if (retreat.google_review_count >= 50) {
    faqs.push({
      question: `What do guests say about ${retreat.name}?`,
      answer: `${retreat.name} has a ${retreat.google_rating}/5 Google rating from ${retreat.google_review_count} reviews. Our Vault Score of ${retreat.wrd_score}/10 is based on a deeper 15-category methodology that goes beyond guest sentiment to evaluate clinical programming, sustainability, and value.`,
    });
  } else if (retreat.specialty_tags.length >= 2) {
    const secondSpec = retreat.specialty_tags[1]?.replace(/-/g, " ") || "wellness";
    faqs.push({
      question: `Is ${retreat.name} good for ${topSpecialty}?`,
      answer: `Yes. ${retreat.name} lists ${topSpecialty} as a core specialty alongside ${secondSpec}. With a ${retreat.wrd_score}/10 overall score and ${top.score.toFixed(1)}/10 in ${top.label}, the retreat's programming is well-suited for guests prioritizing ${topSpecialty}.`,
    });
  } else {
    faqs.push({
      question: `How many guests does ${retreat.name} accommodate?`,
      answer: `${retreat.name} is a ${retreat.property_size}-sized property that hosts a maximum of ${retreat.max_guests} guests${retreat.founded_year ? `, and has been operating since ${retreat.founded_year}` : ""}. The ${retreat.room_count}-room retreat offers a ${retreat.max_guests <= 20 ? "highly intimate" : retreat.max_guests <= 50 ? "personalized" : "resort-scale"} experience.`,
    });
  }

  return faqs;
}

// ─── varied meta description generator ─────────────────────────────────
export function generateMetaDescription(retreat: WellnessRetreat): string {
  const seed = hash(retreat.slug);
  const all = ranked(retreat);
  const top = all[0];
  const topSpecialty = retreat.specialty_tags[0]?.replace(/-/g, " ") || "wellness";
  const pt = priceTag(retreat);
  const tierLabel =
    retreat.score_tier === "elite" ? "Elite" :
    retreat.score_tier === "exceptional" ? "Exceptional" :
    retreat.score_tier === "highly_recommended" ? "Highly Recommended" :
    retreat.score_tier === "good" ? "Good" : "Listed";

  const templates = [
    () => `Rated ${retreat.wrd_score}/10 (${tierLabel}), ${retreat.name} in ${retreat.city}, ${retreat.country} excels in ${top.label.toLowerCase()} (${top.score.toFixed(1)}). A ${pt} ${topSpecialty} retreat from $${retreat.price_min_per_night}/night.`,
    () => `${retreat.name} earned a ${retreat.wrd_score}/10 Vault Score. This ${pt} retreat in ${retreat.city}, ${retreat.country} is rated ${tierLabel}, with top marks in ${top.label.toLowerCase()}. From $${retreat.price_min_per_night}/night.`,
    () => `Our analysts gave ${retreat.name} in ${retreat.country} a ${retreat.wrd_score}/10. Strongest in ${top.label.toLowerCase()} (${top.score.toFixed(1)}), this ${topSpecialty} retreat starts at $${retreat.price_min_per_night}/night.`,
    () => `Is ${retreat.name} worth it? Our 15-category review rates it ${retreat.wrd_score}/10 (${tierLabel}). Located in ${retreat.city}, ${retreat.country}. ${top.label}: ${top.score.toFixed(1)}/10. From $${retreat.price_min_per_night}/night.`,
    () => `${retreat.city}'s ${retreat.name} scores ${retreat.wrd_score}/10 in our data-driven review. Top category: ${top.label.toLowerCase()} at ${top.score.toFixed(1)}. ${tierLabel}-rated ${topSpecialty} retreat from $${retreat.price_min_per_night}/night.`,
    () => `A ${tierLabel.toLowerCase()}-rated retreat in ${retreat.country}, ${retreat.name} scores ${retreat.wrd_score}/10 with standout ${top.label.toLowerCase()} (${top.score.toFixed(1)}). Nightly rates from $${retreat.price_min_per_night}.`,
    () => `${retreat.wrd_score}/10 Vault Score — ${retreat.name} in ${retreat.city} delivers ${pt} ${topSpecialty} programming. ${top.label} leads at ${top.score.toFixed(1)}/10. Read the full analysis.`,
    () => `Discover ${retreat.name}, a ${tierLabel.toLowerCase()}-rated retreat in ${retreat.city}, ${retreat.country}. Vault Score: ${retreat.wrd_score}/10. Known for ${top.label.toLowerCase()} (${top.score.toFixed(1)}). From $${retreat.price_min_per_night}/night.`,
  ];

  return pick(templates, seed)();
}
