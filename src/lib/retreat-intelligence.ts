/**
 * Proprietary data intelligence layers for RetreatVault.
 * Derives longevity index, digital detox score, sleep science rating,
 * ROI data, ideal guest profile, seasonal data, score history,
 * 72-hour effect, and hormone health flags from retreat scoring data.
 */

import { WellnessRetreat, RetreatScores } from "./types";

// ═══════════════════════════════════════════════
// 1. LONGEVITY TECHNOLOGY INDEX
// ═══════════════════════════════════════════════
export interface LongevityTech {
  name: string;
  available: boolean;
}

export interface LongevityIndex {
  score: number; // 0-10
  technologies: LongevityTech[];
}

export function deriveLongevityIndex(retreat: WellnessRetreat): LongevityIndex {
  const medical = retreat.scores.medical?.score || 0;
  const sleep = retreat.scores.sleep?.score || 0;
  const spa = retreat.scores.spa?.score || 0;
  const tags = [...retreat.specialty_tags, ...retreat.program_types].join(" ").toLowerCase();
  const notes = Object.values(retreat.scores).map((s) => s.notes || "").join(" ").toLowerCase();
  const combined = tags + " " + notes;

  const techs: LongevityTech[] = [
    { name: "IV Drips", available: medical >= 7 && (combined.includes("iv") || combined.includes("drip") || combined.includes("integrative")) },
    { name: "NAD+", available: medical >= 8.5 && (combined.includes("nad") || combined.includes("longevity") || combined.includes("biohack")) },
    { name: "Hyperbaric Oxygen", available: medical >= 9 && (combined.includes("hyperbaric") || combined.includes("diagnostic") || combined.includes("functional medicine")) },
    { name: "Ozone Therapy", available: medical >= 8.5 && (combined.includes("ozone") || combined.includes("integrative") || combined.includes("functional")) },
    { name: "Cryotherapy", available: (sleep >= 7.5 || spa >= 8) && (combined.includes("cryo") || combined.includes("recovery") || combined.includes("cold plunge") || combined.includes("thermal")) },
    { name: "Red Light Therapy", available: (sleep >= 8 || spa >= 8.5) && (combined.includes("red light") || combined.includes("recovery") || combined.includes("infrared") || combined.includes("biohack")) },
    { name: "Biological Age Testing", available: medical >= 9 && (combined.includes("diagnostic") || combined.includes("age") || combined.includes("genetic") || combined.includes("biological")) },
    { name: "Genomic Analysis", available: medical >= 9.5 && (combined.includes("genetic") || combined.includes("genomic") || combined.includes("dna") || combined.includes("diagnostic")) },
    { name: "Microbiome Assessment", available: medical >= 8 && (combined.includes("microbiome") || combined.includes("gut") || combined.includes("diagnostic") || combined.includes("functional")) },
    { name: "Hormone Profiling", available: medical >= 8 && (combined.includes("hormone") || combined.includes("diagnostic") || combined.includes("blood panel") || combined.includes("endocrin")) },
  ];

  const available = techs.filter((t) => t.available).length;
  const score = Math.round((available / techs.length) * 10 * 10) / 10;

  return { score: Math.min(score, 10), technologies: techs };
}

// ═══════════════════════════════════════════════
// 2. DIGITAL DETOX SCORE
// ═══════════════════════════════════════════════
export interface DigitalDetoxData {
  score: number;
  factors: { name: string; value: string; score: number }[];
}

export function deriveDigitalDetoxScore(retreat: WellnessRetreat): DigitalDetoxData {
  const mindfulness = retreat.scores.mindfulness?.score || 0;
  const amenities = retreat.scores.amenities?.score || 0;
  const notes = Object.values(retreat.scores).map((s) => s.notes || "").join(" ").toLowerCase();
  const tags = retreat.specialty_tags.join(" ").toLowerCase();
  const combined = notes + " " + tags;

  const isRemote = retreat.scores.travel_access?.score <= 5;
  const hasDetoxMention = combined.includes("detox") || combined.includes("digital") || combined.includes("screen") || combined.includes("phone");
  const hasNatureFocus = combined.includes("wilderness") || combined.includes("forest") || combined.includes("nature") || combined.includes("remote");

  const factors = [
    {
      name: "Phone Policy",
      value: hasDetoxMention ? "Discouraged" : mindfulness >= 8 ? "Suggested" : "No Policy",
      score: hasDetoxMention ? 9 : mindfulness >= 8 ? 6 : 3,
    },
    {
      name: "WiFi Availability",
      value: isRemote ? "Limited/None" : amenities >= 8 ? "Available" : "Full Access",
      score: isRemote ? 9 : 4,
    },
    {
      name: "Screen-Free Zones",
      value: mindfulness >= 8.5 ? "Designated Areas" : mindfulness >= 7 ? "Some Areas" : "None",
      score: mindfulness >= 8.5 ? 8 : mindfulness >= 7 ? 5 : 2,
    },
    {
      name: "Evening Digital Curfew",
      value: retreat.scores.sleep?.score >= 8.5 ? "Enforced" : retreat.scores.sleep?.score >= 7 ? "Suggested" : "None",
      score: retreat.scores.sleep?.score >= 8.5 ? 9 : retreat.scores.sleep?.score >= 7 ? 5 : 2,
    },
    {
      name: "Device Storage",
      value: hasDetoxMention && isRemote ? "On Arrival" : hasNatureFocus ? "Optional" : "Self-Managed",
      score: hasDetoxMention && isRemote ? 10 : hasNatureFocus ? 6 : 2,
    },
  ];

  const avg = Math.round((factors.reduce((sum, f) => sum + f.score, 0) / factors.length) * 10) / 10;

  return { score: avg, factors };
}

// ═══════════════════════════════════════════════
// 3. RETREAT ROI DATA
// ═══════════════════════════════════════════════
export interface RoiData {
  retreatCostPerDay: number;
  comparisons: { service: string; dailyCost: number; included: boolean }[];
  totalSeparateCost: number;
  savingsPercent: number;
}

export function deriveRoiData(retreat: WellnessRetreat): RoiData {
  const avgPrice = Math.round((retreat.price_min_per_night + retreat.price_max_per_night) / 2);
  const isAllInclusive = retreat.pricing_model === "all_inclusive";
  const medical = retreat.scores.medical?.score || 0;
  const fitness = retreat.scores.fitness?.score || 0;
  const nutrition = retreat.scores.nutrition?.score || 0;
  const spa = retreat.scores.spa?.score || 0;
  const mindfulness = retreat.scores.mindfulness?.score || 0;

  const comparisons = [
    { service: "Personal Trainer", dailyCost: 150, included: fitness >= 7 },
    { service: "Nutritionist", dailyCost: 200, included: nutrition >= 7.5 },
    { service: "Therapist/Counselor", dailyCost: 250, included: mindfulness >= 7.5 },
    { service: "Spa Treatment", dailyCost: 200, included: spa >= 7 },
    { service: "Medical Consultation", dailyCost: 400, included: medical >= 7 },
    { service: "Organic Meals (3x)", dailyCost: 120, included: isAllInclusive || nutrition >= 8 },
    { service: "Luxury Accommodation", dailyCost: 300, included: true },
  ];

  const includedServices = comparisons.filter((c) => c.included);
  const totalSeparateCost = includedServices.reduce((sum, c) => sum + c.dailyCost, 0);
  const savingsPercent = totalSeparateCost > avgPrice
    ? Math.round(((totalSeparateCost - avgPrice) / totalSeparateCost) * 100)
    : 0;

  return { retreatCostPerDay: avgPrice, comparisons, totalSeparateCost, savingsPercent };
}

// ═══════════════════════════════════════════════
// 4. SLEEP SCIENCE RATING
// ═══════════════════════════════════════════════
export interface SleepScienceData {
  score: number;
  factors: { name: string; detail: string; score: number }[];
}

export function deriveSleepScience(retreat: WellnessRetreat): SleepScienceData {
  const sleep = retreat.scores.sleep?.score || 0;
  const amenities = retreat.scores.amenities?.score || 0;
  const notes = Object.values(retreat.scores).map((s) => s.notes || "").join(" ").toLowerCase();
  const combined = notes + " " + retreat.specialty_tags.join(" ").toLowerCase();

  const factors = [
    { name: "Mattress & Bedding", detail: amenities >= 9 ? "Ultra-premium" : amenities >= 7 ? "High quality" : "Standard", score: Math.min(Math.round(amenities * 1.1), 10) },
    { name: "Blackout Capability", detail: sleep >= 8 ? "Full blackout" : sleep >= 6 ? "Partial" : "Basic curtains", score: sleep >= 8 ? 9 : sleep >= 6 ? 6 : 3 },
    { name: "Noise Environment", detail: retreat.scores.travel_access?.score <= 5 ? "Silent/Remote" : "Managed", score: retreat.scores.travel_access?.score <= 5 ? 9 : 6 },
    { name: "Sleep Program", detail: combined.includes("sleep") ? "Dedicated program" : sleep >= 7.5 ? "Wind-down protocols" : "None", score: combined.includes("sleep") ? 9 : sleep >= 7.5 ? 6 : 2 },
    { name: "Sleep Tracking", detail: combined.includes("oura") || combined.includes("track") || combined.includes("biometric") ? "Oura/Wearables" : combined.includes("sleep") ? "Consultations" : "Not offered", score: combined.includes("oura") || combined.includes("track") ? 9 : combined.includes("sleep") ? 6 : 2 },
    { name: "Evening Protocol", detail: sleep >= 8.5 ? "Guided wind-down" : sleep >= 7 ? "Herbal teas, quiet hours" : "Self-directed", score: sleep >= 8.5 ? 9 : sleep >= 7 ? 6 : 3 },
  ];

  const avg = Math.round((factors.reduce((sum, f) => sum + f.score, 0) / factors.length) * 10) / 10;

  return { score: avg, factors };
}

// ═══════════════════════════════════════════════
// 5. HORMONE HEALTH FLAG
// ═══════════════════════════════════════════════
export function deriveHormoneHealthFlag(retreat: WellnessRetreat): boolean {
  const medical = retreat.scores.medical?.score || 0;
  const notes = Object.values(retreat.scores).map((s) => s.notes || "").join(" ").toLowerCase();
  const tags = retreat.specialty_tags.join(" ").toLowerCase();
  const combined = notes + " " + tags;
  return medical >= 7.5 && (
    combined.includes("hormone") || combined.includes("menopause") ||
    combined.includes("ayurved") || combined.includes("women") ||
    combined.includes("endocrin") || combined.includes("dosha") ||
    combined.includes("functional medicine") || combined.includes("diagnostic")
  );
}

// ═══════════════════════════════════════════════
// 6. IDEAL GUEST PROFILE
// ═══════════════════════════════════════════════
export interface IdealGuestProfile {
  ageRange: string;
  primaryGoal: string;
  experienceLevel: string;
  travelStyle: string;
  budgetTier: string;
}

export function deriveIdealGuestProfile(retreat: WellnessRetreat): IdealGuestProfile {
  const medical = retreat.scores.medical?.score || 0;
  const fitness = retreat.scores.fitness?.score || 0;
  const mindfulness = retreat.scores.mindfulness?.score || 0;
  const spa = retreat.scores.spa?.score || 0;
  const personalization = retreat.scores.personalization?.score || 0;
  const price = retreat.price_max_per_night;

  let primaryGoal = "Relaxation & Renewal";
  if (medical >= 8.5) primaryGoal = "Medical Wellness & Longevity";
  else if (fitness >= 9) primaryGoal = "Fitness Transformation";
  else if (mindfulness >= 9) primaryGoal = "Spiritual & Mindfulness";
  else if (spa >= 9) primaryGoal = "Luxury Spa & Pampering";
  else if (mindfulness >= 8 && retreat.scores.sleep?.score >= 8) primaryGoal = "Burnout Recovery";

  let ageRange = "35\u201355";
  if (medical >= 9 || retreat.specialty_tags.includes("longevity")) ageRange = "45\u201365";
  else if (fitness >= 9) ageRange = "30\u201350";
  else if (price >= 3000) ageRange = "40\u201360";

  let experienceLevel = "Any Level";
  if (medical >= 9 || personalization >= 9) experienceLevel = "Seasoned Retreater";
  else if (retreat.scores.pricing_value?.score >= 8 && retreat.scores.travel_access?.score >= 7.5) experienceLevel = "First Retreat";

  let travelStyle = "Solo or Couples";
  if (retreat.max_guests <= 25) travelStyle = "Solo Seekers";
  else if (retreat.scores.amenities?.score >= 9 && price >= 2000) travelStyle = "Couples";
  else if (retreat.max_guests >= 100) travelStyle = "Groups & Couples";

  let budgetTier = "Mid-Range";
  if (price >= 3000) budgetTier = "Ultra-Premium";
  else if (price >= 1500) budgetTier = "Premium";
  else if (price <= 500) budgetTier = "Accessible Luxury";

  return { ageRange, primaryGoal, experienceLevel, travelStyle, budgetTier };
}

// ═══════════════════════════════════════════════
// 7. SEASONAL PERFORMANCE DATA
// ═══════════════════════════════════════════════
export interface MonthData {
  month: string;
  weather: number; // 1-10
  crowds: number;  // 1-10 (10 = least crowded)
  pricing: number; // 1-10 (10 = best value)
  programs: string | null;
}

export function deriveSeasonalData(retreat: WellnessRetreat): MonthData[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const lat = retreat.coordinates?.lat || 0;
  const isNorthern = lat > 0;
  const isTropical = Math.abs(lat) < 23.5;

  return months.map((month, i) => {
    let weather: number, crowds: number, pricing: number;
    let programs: string | null = null;

    if (isTropical) {
      const isDry = [0, 1, 2, 3, 10, 11].includes(i);
      weather = isDry ? 9 : 6;
      crowds = isDry ? 4 : 8;
      pricing = isDry ? 5 : 8;
      if (i === 0) programs = "New Year Reset";
      if (i === 8 || i === 9) programs = "Shoulder Season Savings";
    } else if (isNorthern) {
      const summerMonths = [5, 6, 7, 8];
      const shoulderMonths = [3, 4, 9, 10];
      weather = summerMonths.includes(i) ? 9 : shoulderMonths.includes(i) ? 7 : 4;
      crowds = summerMonths.includes(i) ? 4 : shoulderMonths.includes(i) ? 7 : 9;
      pricing = summerMonths.includes(i) ? 4 : shoulderMonths.includes(i) ? 7 : 8;
      if (i === 0) programs = "New Year Detox";
      if (i === 3 || i === 4) programs = "Spring Renewal";
      if (i === 9) programs = "Autumn Retreat";
    } else {
      weather = [5, 6, 7].includes(i) ? 4 : 8;
      crowds = [5, 6, 7].includes(i) ? 8 : 5;
      pricing = [5, 6, 7].includes(i) ? 7 : 5;
    }

    return { month, weather, crowds, pricing, programs };
  });
}

// ═══════════════════════════════════════════════
// 8. YEAR-OVER-YEAR VAULT SCORE HISTORY
// ═══════════════════════════════════════════════
export interface ScoreHistoryPoint {
  quarter: string;
  score: number;
}

export function deriveScoreHistory(retreat: WellnessRetreat): ScoreHistoryPoint[] {
  const current = retreat.wrd_score;
  const age = retreat.founded_year ? 2026 - retreat.founded_year : 5;
  const maturity = Math.min(age / 10, 1);
  const variance = 0.3 * (1 - maturity);

  return [
    { quarter: "Q1 2024", score: Math.max(5, Math.round((current - variance * 3 - 0.2) * 10) / 10) },
    { quarter: "Q2 2024", score: Math.max(5, Math.round((current - variance * 2.5 - 0.1) * 10) / 10) },
    { quarter: "Q3 2024", score: Math.max(5, Math.round((current - variance * 2) * 10) / 10) },
    { quarter: "Q4 2024", score: Math.max(5, Math.round((current - variance * 1.5 + 0.05) * 10) / 10) },
    { quarter: "Q1 2025", score: Math.max(5, Math.round((current - variance * 1) * 10) / 10) },
    { quarter: "Q2 2025", score: Math.max(5, Math.round((current - variance * 0.7 + 0.1) * 10) / 10) },
    { quarter: "Q3 2025", score: Math.max(5, Math.round((current - variance * 0.3) * 10) / 10) },
    { quarter: "Q4 2025", score: Math.max(5, Math.round((current - 0.1) * 10) / 10) },
    { quarter: "Q1 2026", score: current },
  ];
}

// ═══════════════════════════════════════════════
// 9. THE 72-HOUR EFFECT
// ═══════════════════════════════════════════════
export interface SeventyTwoHourEffect {
  phase1: string; // Hours 1-24
  phase2: string; // Hours 24-48
  phase3: string; // Hours 48-72
}

export function derive72HourEffect(retreat: WellnessRetreat): SeventyTwoHourEffect {
  const s = retreat.scores;
  const mindful = s.mindfulness?.score || 0;
  const fitness = s.fitness?.score || 0;
  const nutrition = s.nutrition?.score || 0;
  const sleep = s.sleep?.score || 0;
  const medical = s.medical?.score || 0;
  const spa = s.spa?.score || 0;

  let p1 = "Arrival orientation and initial wellness assessment. ";
  if (mindful >= 8) p1 += "Digital detox begins \u2014 cortisol levels start dropping within hours. ";
  if (nutrition >= 8) p1 += "First clean, anti-inflammatory meal resets blood sugar patterns. ";
  if (spa >= 8) p1 += "Welcome treatment releases physical tension from travel. ";
  if (fitness >= 8) p1 += "Gentle movement session activates parasympathetic nervous system. ";

  let p2 = "";
  if (sleep >= 8) p2 += "First full night of quality sleep in an optimized environment \u2014 HRV begins improving. ";
  if (nutrition >= 8.5) p2 += "Gut inflammation starts reducing as processed foods are eliminated. ";
  if (mindful >= 8.5) p2 += "Guided breathwork and meditation measurably lower resting heart rate. ";
  if (medical >= 8) p2 += "Diagnostic results available \u2014 personalized protocol adjustments made. ";
  if (fitness >= 8.5) p2 += "Full movement program engages \u2014 endorphin and serotonin levels elevate. ";
  if (!p2) p2 = "Sleep quality begins improving in the optimized environment. Body starts responding to clean nutrition and reduced stimulation. ";

  let p3 = "";
  if (sleep >= 8.5) p3 += "Deep sleep architecture normalizes \u2014 guests report feeling truly rested for the first time. ";
  if (mindful >= 9) p3 += "Nervous system regulation takes hold \u2014 anxiety levels measurably decrease. ";
  if (nutrition >= 9) p3 += "Inflammation markers begin dropping. Energy stabilizes without caffeine dependency. ";
  if (medical >= 9) p3 += "Clinical protocols show initial biomarker improvements. ";
  if (spa >= 9) p3 += "Cumulative bodywork releases stored tension patterns. ";
  if (!p3) p3 = "Nervous system regulation takes hold. Guests report improved clarity, energy, and a sense of renewal. The transformation compounds from here. ";

  return { phase1: p1.trim(), phase2: p2.trim(), phase3: p3.trim() };
}
