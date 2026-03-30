"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface RetreatData {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  city: string;
  country: string;
  region: string;
  hero_image_url: string;
  wrd_score: number;
  score_tier: string;
  price_min_per_night: number;
  price_max_per_night: number;
  minimum_stay_nights: number;
  max_guests: number;
  specialty_tags: string[];
  program_types: string[];
  scores: Record<string, number>;
}

interface QuizAnswer {
  questionIndex: number;
  value: string;
}

interface MatchedRetreat extends RetreatData {
  matchScore: number;
  matchPercent: number;
  matchReasons: string[];
}

// ═══════════════════════════════════════════════════════════
// QUESTIONS
// ═══════════════════════════════════════════════════════════

const questions = [
  {
    label: "What brings you here?",
    subtext: "PubMed research (PMC5312624) shows goal clarity is the single strongest predictor of retreat outcomes.",
    options: [
      { value: "stress", icon: "🧠", title: "Stress & Burnout Recovery", desc: "Cortisol is high. Everything feels heavy." },
      { value: "sleep", icon: "🌙", title: "Sleep Optimization", desc: "You can't remember the last time you slept deeply." },
      { value: "longevity", icon: "🧬", title: "Longevity & Biohacking", desc: "You want to know your biological age and reverse it." },
      { value: "fitness", icon: "💪", title: "Physical Transformation", desc: "Fitness, weight, strength — you want real results." },
      { value: "hormonal", icon: "⚖️", title: "Hormonal & Women's Health", desc: "Perimenopause, cycles, energy, balance." },
      { value: "spiritual", icon: "🕊️", title: "Spiritual Reset", desc: "You've lost your sense of purpose and inner quiet." },
      { value: "detox", icon: "🌿", title: "Full Detox & Cleanse", desc: "Your body needs a hard reset." },
    ],
  },
  {
    label: "How do you want to feel during the experience?",
    subtext: "McKinsey found 88% of luxury travelers want fitness — but intensity preference splits them into three distinct groups.",
    options: [
      { value: "challenged", icon: "🔥", title: "Deeply Challenged", desc: "Hard workouts, early mornings, structured discipline." },
      { value: "restored", icon: "🧘", title: "Deeply Restored", desc: "Slow, quiet, nurturing. Let the retreat do the work." },
      { value: "balanced", icon: "⚡", title: "Perfectly Balanced", desc: "Push when it's time. Rest when it's time." },
    ],
  },
  {
    label: "Who are you traveling with?",
    subtext: "GWI reports solo wellness travel grew 46% since 2022. But the right companion — or intentional solitude — shapes the entire experience.",
    options: [
      { value: "solo", icon: "🧘", title: "Solo", desc: "This journey is mine alone. Deep personal work." },
      { value: "partner", icon: "💑", title: "With a Partner", desc: "Shared transformation. Couples-focused programming." },
      { value: "friends", icon: "👯", title: "With Friends", desc: "Group energy, shared adventures, social wellness." },
      { value: "flexible", icon: "🤷", title: "Flexible", desc: "I'm open — just show me the best retreats." },
    ],
  },
  {
    label: "What kind of guidance do you trust most?",
    subtext: "Deloitte 2025 found luxury travelers split equally between clinical precision and ancient healing tradition.",
    options: [
      { value: "clinical", icon: "🔬", title: "Doctor-Led & Diagnostic", desc: "Blood work, biomarkers, clinical protocols. Show me the data." },
      { value: "holistic", icon: "🪷", title: "Ancient Healing Traditions", desc: "Ayurveda, TCM, Mayan healing. Trust the wisdom of centuries." },
      { value: "blend", icon: "🧪", title: "A Blend of Both", desc: "Science-backed, but soul-nourishing." },
    ],
  },
  {
    label: "How unplugged do you want to be?",
    subtext: "72% of wellness travelers in 2024 said disconnecting from screens was a primary motivation (Skift Research 2024).",
    options: [
      { value: "offgrid", icon: "📵", title: "Fully Off-Grid", desc: "Take my phone at the door. I trust the process." },
      { value: "curfew", icon: "🌅", title: "Guided Curfew", desc: "Evenings offline. Mornings to myself." },
      { value: "connected", icon: "📱", title: "Stay Connected", desc: "Available when I need to be. Work doesn't fully stop." },
    ],
  },
  {
    label: "Where would you like to retreat?",
    subtext: "Global wellness tourism reached $817B in 2024 (GWI). The best retreats are found on every continent — the question is where you want yours.",
    options: [
      { value: "usa_canada", icon: "🌎", title: "North America", desc: "USA, Canada, or Mexico — world-class retreats close to home." },
      { value: "europe", icon: "🌍", title: "Europe", desc: "Swiss clinics, Italian thermal springs, Nordic healing." },
      { value: "asia", icon: "🌏", title: "Asia & Indian Ocean", desc: "Bali, Thailand, India, Maldives — ancient traditions, modern luxury." },
      { value: "anywhere", icon: "✈️", title: "Surprise Me", desc: "Show me the best match regardless of location." },
    ],
  },
  {
    label: "How long can you give yourself?",
    subtext: "PubMed research (PMC5312624) shows measurable health improvements begin at day 5 and compound significantly by day 7.",
    options: [
      { value: "short", icon: "📅", title: "3–4 Days", desc: "A long weekend reset." },
      { value: "week", icon: "🗓️", title: "5–7 Days", desc: "A full week. Enough for real change." },
      { value: "extended", icon: "📆", title: "8–14 Days", desc: "I'm committing fully." },
      { value: "immersion", icon: "♾️", title: "2+ Weeks", desc: "This is a life investment." },
    ],
  },
  {
    label: "What's your investment for this experience?",
    subtext: "RetreatVault only reviews properties where the per-night cost reflects genuine value — not just luxury branding.",
    options: [
      { value: "budget", icon: "💎", title: "Under $500/night", desc: "Value-conscious, still exceptional." },
      { value: "premium", icon: "✨", title: "$500–$1,500/night", desc: "Premium. Real results." },
      { value: "ultra", icon: "👑", title: "$1,500–$3,000/night", desc: "Ultra-premium. Best of the best." },
      { value: "unlimited", icon: "🏆", title: "$3,000+/night", desc: "Price is not a consideration." },
    ],
  },
];

// ═══════════════════════════════════════════════════════════
// MATCHING ALGORITHM
// ═══════════════════════════════════════════════════════════

function matchRetreats(answers: QuizAnswer[], retreats: RetreatData[]): MatchedRetreat[] {
  const answerMap = new Map(answers.map((a) => [a.questionIndex, a.value]));
  const goal = answerMap.get(0) || "";
  const intensity = answerMap.get(1) || "";
  const travelStyle = answerMap.get(2) || "";
  const guidance = answerMap.get(3) || "";
  const detox = answerMap.get(4) || "";
  const travel = answerMap.get(5) || "";
  const stay = answerMap.get(6) || "";
  const budget = answerMap.get(7) || "";

  // Region filter
  const allowedRegions: string[] = [];
  if (travel === "usa_canada") allowedRegions.push("USA", "Canada", "Mexico");
  else if (travel === "europe") allowedRegions.push("Europe");
  else if (travel === "asia") allowedRegions.push("Asia");
  // "anywhere" = no filter

  // Budget filter
  let maxBudget = Infinity;
  if (budget === "budget") maxBudget = 500;
  else if (budget === "premium") maxBudget = 1500;
  else if (budget === "ultra") maxBudget = 3000;

  // Stay filter
  let maxMinStay = Infinity;
  if (stay === "short") maxMinStay = 4;
  else if (stay === "week") maxMinStay = 7;
  else if (stay === "extended") maxMinStay = 14;

  // Goal → tags
  const goalTags: Record<string, string[]> = {
    stress: ["stress", "burnout", "mindfulness", "meditation", "recovery"],
    sleep: ["sleep", "recovery", "circadian", "rest"],
    longevity: ["longevity", "biohacking", "anti-aging", "genetic", "diagnostic", "functional-medicine"],
    fitness: ["fitness", "weight", "hiking", "bootcamp", "intensive", "transformation"],
    hormonal: ["hormone", "women", "ayurveda", "perimenopause", "balance"],
    spiritual: ["spiritual", "meditation", "yoga", "ashram", "mindfulness", "silence"],
    detox: ["detox", "fasting", "cleanse", "juice", "colon", "raw"],
  };

  const scoredRetreats = retreats
    .filter((r) => {
      if (allowedRegions.length > 0 && !allowedRegions.includes(r.region)) return false;
      if (r.price_min_per_night > maxBudget) return false;
      if (r.minimum_stay_nights > maxMinStay) return false;
      return true;
    })
    .map((r) => {
      let score = 0;
      const reasons: string[] = [];

      // Base WRD score (0-10 normalized to 0-30)
      score += r.wrd_score * 3;

      // Q1: Goal alignment via tags
      const tags = [...r.specialty_tags, ...r.program_types].join(" ").toLowerCase();
      const matchingTags = (goalTags[goal] || []).filter((t) => tags.includes(t));
      const tagScore = Math.min(matchingTags.length * 5, 20);
      score += tagScore;
      if (tagScore >= 10) reasons.push(`Strong ${goal.replace(/-/g, " ")} program alignment`);

      // Q2: Intensity weighting
      if (intensity === "challenged") {
        score += r.scores.fitness * 2;
        if (r.scores.fitness >= 9) reasons.push("Elite fitness programming");
      } else if (intensity === "restored") {
        score += (r.scores.spa + r.scores.sleep) * 1;
        if (r.scores.spa >= 9) reasons.push("World-class spa and restoration");
        if (r.scores.sleep >= 9) reasons.push("Exceptional sleep environment");
      } else {
        score += (r.scores.fitness + r.scores.spa) * 0.75;
      }

      // Q3: Medical/holistic
      if (guidance === "clinical") {
        score += r.scores.medical * 2;
        if (r.scores.medical >= 9) reasons.push("Doctor-led diagnostics available");
      } else if (guidance === "holistic") {
        score += (r.scores.spa + r.scores.mindfulness) * 1;
        if (r.scores.mindfulness >= 9) reasons.push("Deep traditional healing practices");
      } else {
        score += (r.scores.medical + r.scores.mindfulness) * 0.6;
      }

      // Q4: Digital detox
      if (detox === "offgrid") {
        if (tags.includes("digital-detox") || tags.includes("silence") || tags.includes("off-grid")) {
          score += 10;
          reasons.push("Fully enforced digital detox");
        }
        score += r.scores.mindfulness * 0.5;
      }

      // Travel style matching
      if (travelStyle === "solo") {
        if (tags.includes("solo") || tags.includes("silence") || tags.includes("meditation") || tags.includes("ashram")) {
          score += 8;
          reasons.push("Ideal for solo wellness seekers");
        }
        if (r.scores.personalization >= 8.5) score += 3;
      } else if (travelStyle === "partner") {
        if (tags.includes("couples") || tags.includes("romantic") || tags.includes("luxury")) {
          score += 8;
          reasons.push("Designed for couples experiences");
        }
        if (r.scores.amenities >= 9) score += 3;
      } else if (travelStyle === "friends") {
        if (tags.includes("adventure") || tags.includes("fitness") || tags.includes("group") || r.max_guests >= 100) {
          score += 8;
          reasons.push("Great for group & friend getaways");
        }
        if (r.scores.activities >= 8.5) score += 3;
      }

      // Q5: Travel — already filtered

      // Q6: Stay — already filtered, but bonus for matching
      if (stay === "week" && r.minimum_stay_nights >= 5 && r.minimum_stay_nights <= 7) {
        score += 5;
      }

      // Q7: Budget — value scoring
      if (budget === "budget" && r.scores.pricing_value >= 9) {
        score += 8;
        reasons.push("Exceptional value for the price");
      }
      if (budget === "unlimited" && r.scores.amenities >= 9) {
        score += 5;
        reasons.push("Ultra-luxury amenities and service");
      }

      // Personalization bonus
      if (r.scores.personalization >= 9) {
        score += 5;
        reasons.push("Highly personalized wellness programs");
      }

      // Top category bonuses
      const topCategories = Object.entries(r.scores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2);
      const catLabels: Record<string, string> = {
        nutrition: "nutrition", fitness: "fitness", mindfulness: "mindfulness",
        spa: "spa & relaxation", sleep: "sleep", medical: "medical wellness",
        personalization: "personalization", amenities: "amenities",
        pricing_value: "value", activities: "activities", education: "education",
        sustainability: "sustainability", social_proof: "reputation",
      };
      for (const [cat, val] of topCategories) {
        if (val >= 9.5 && reasons.length < 3) {
          reasons.push(`Highest ${catLabels[cat] || cat} scores in the vault`);
        }
      }

      // Ensure at least 1 reason
      if (reasons.length === 0) {
        reasons.push(`RV Score: ${r.wrd_score.toFixed(1)} — rigorously rated`);
      }

      return { ...r, matchScore: score, matchPercent: 0, matchReasons: reasons.slice(0, 3) };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  // Normalize to percentage
  const maxScore = scoredRetreats[0]?.matchScore || 1;
  return scoredRetreats.slice(0, 3).map((r) => ({
    ...r,
    matchPercent: Math.min(Math.round((r.matchScore / maxScore) * 100), 99),
  }));
}

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export default function QuizClient({ retreats }: { retreats: RetreatData[] }) {
  const [step, setStep] = useState(0); // 0-6 = questions, 7 = loading, 8 = results
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<MatchedRetreat[]>([]);
  const [direction, setDirection] = useState(1);

  const currentAnswer = answers.find((a) => a.questionIndex === step)?.value || null;

  const handleSelect = useCallback((value: string) => {
    setSelected(value);
  }, []);

  const handleNext = useCallback(() => {
    if (!selected && !currentAnswer) return;
    const val = selected || currentAnswer || "";

    const updated = answers.filter((a) => a.questionIndex !== step);
    updated.push({ questionIndex: step, value: val });
    setAnswers(updated);
    setSelected(null);
    setDirection(1);

    if (step < 7) {
      setStep(step + 1);
    } else {
      // Show loading then results
      setStep(8);
      setTimeout(() => {
        const matched = matchRetreats(updated, retreats);
        setResults(matched);
        setStep(9);
      }, 2200);
    }
  }, [selected, currentAnswer, step, answers, retreats]);

  const handleBack = useCallback(() => {
    setDirection(-1);
    setSelected(null);
    setStep(Math.max(0, step - 1));
  }, [step]);

  const progress = step <= 7 ? ((step + 1) / 8) * 100 : 100;

  // ═══ LOADING STATE ═══
  if (step === 8) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-dark-950 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto mb-8 h-12 w-12 animate-spin rounded-full border-2 border-gold-400/20 border-t-gold-400" />
          <p className="font-serif text-xl text-white sm:text-2xl">Analyzing 120+ data points across our vault...</p>
          <p className="mt-3 text-[12px] text-dark-400">Matching your profile to 15 scoring categories</p>
        </motion.div>
      </div>
    );
  }

  // ═══ RESULTS ═══
  if (step === 9) {
    return (
      <div className="min-h-screen bg-dark-950 px-4 pb-20 pt-28 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-gold-500">Your Results</p>
            <h1 className="mt-4 font-serif text-4xl font-light text-white sm:text-5xl">Your Vault Matches</h1>
            <p className="mt-3 text-[13px] text-dark-400">Based on your goals, preferences, and lifestyle</p>
          </motion.div>

          <div className="mt-12 space-y-6">
            {results.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
              >
                <a
                  href={`/retreats/${r.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all hover:border-gold-400/20"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Image */}
                    <div className="relative aspect-[16/10] sm:aspect-auto sm:w-[280px] flex-shrink-0">
                      {r.hero_image_url?.startsWith("http") ? (
                        <img src={r.hero_image_url} alt={r.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-dark-800" />
                      )}
                      {/* Match badge */}
                      <div className="absolute left-4 top-4 rounded-full bg-gold-400/90 px-3 py-1.5">
                        <span className="text-[11px] font-bold text-dark-950">{r.matchPercent}% Match</span>
                      </div>
                      {i === 0 && (
                        <div className="absolute right-4 top-4 rounded-full bg-dark-950/80 px-2.5 py-1 backdrop-blur-sm">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-gold-300">✦ Top Pick</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="font-serif text-xl font-light text-white group-hover:text-gold-300 sm:text-2xl">{r.name}</h2>
                          <div className="flex h-8 w-8 flex-col items-center justify-center rounded-full border border-gold-400/30 bg-dark-950/60">
                            <span className="font-serif text-[11px] text-white">{r.wrd_score.toFixed(1)}</span>
                            <span className="text-[4px] uppercase tracking-wider text-gold-400">RV</span>
                          </div>
                        </div>
                        <p className="mt-1 text-[12px] text-dark-400">{r.city}, {r.country}</p>
                        <p className="mt-2 text-[12px] leading-relaxed text-dark-300">{r.subtitle}</p>

                        {/* Match reasons */}
                        <div className="mt-4 space-y-1.5">
                          {r.matchReasons.map((reason, j) => (
                            <div key={j} className="flex items-start gap-2">
                              <svg className="mt-0.5 h-3 w-3 flex-shrink-0 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-[11px] text-dark-300">{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between">
                        <div className="text-[13px]">
                          <span className="font-medium text-white">${r.price_min_per_night.toLocaleString()}</span>
                          {r.price_min_per_night !== r.price_max_per_night && (
                            <span className="text-dark-400">&ndash;${r.price_max_per_night.toLocaleString()}</span>
                          )}
                          <span className="ml-1 text-[10px] text-dark-500">/night</span>
                        </div>
                        <span className="rounded-full border border-gold-400/30 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-gold-300 transition-all group-hover:bg-gold-400/10">
                          View Full Profile
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              </motion.div>
            ))}
          </div>

          {/* Email capture */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mx-auto mt-16 max-w-lg"
          >
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-gold-500">Save Your Results</p>
              <h3 className="mt-3 font-serif text-xl font-light text-white">
                Save your matches + receive our full 2026 Vault Report
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const name = (form.elements.namedItem("firstName") as HTMLInputElement)?.value;
                  const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
                  if (name && email) {
                    alert("Thank you! Your results have been saved.");
                  }
                }}
                className="mt-6 space-y-3"
              >
                <input
                  name="firstName"
                  type="text"
                  placeholder="First name"
                  className="w-full rounded-xl border border-white/[0.08] bg-dark-900 px-4 py-3 text-[13px] text-white placeholder-dark-500 outline-none transition-colors focus:border-gold-400/30"
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  className="w-full rounded-xl border border-white/[0.08] bg-dark-900 px-4 py-3 text-[13px] text-white placeholder-dark-500 outline-none transition-colors focus:border-gold-400/30"
                />
                <button type="submit" className="btn-luxury w-full !py-3 !text-[10px]">
                  Send My Results
                </button>
              </form>
              <p className="mt-3 text-[10px] text-dark-600">No spam. Unsubscribe anytime.</p>
            </div>
          </motion.div>

          {/* Retake */}
          <div className="mt-10 text-center">
            <button
              onClick={() => { setStep(0); setAnswers([]); setSelected(null); setResults([]); }}
              className="text-[11px] uppercase tracking-wider text-dark-400 transition-colors hover:text-gold-400"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ QUESTION SCREEN ═══
  const q = questions[step];
  const activeValue = selected || currentAnswer;

  return (
    <div className="flex min-h-screen flex-col bg-dark-950">
      {/* Progress bar */}
      <div className="fixed left-0 right-0 top-0 z-50 h-[3px] bg-dark-800">
        <motion.div
          className="h-full bg-gradient-to-r from-gold-400 to-gold-300"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* Back + step counter */}
      <div className="fixed left-0 right-0 top-[3px] z-40 bg-dark-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <button
            onClick={step > 0 ? handleBack : undefined}
            className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wider transition-colors ${step > 0 ? "text-dark-300 hover:text-white" : "text-transparent"}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="text-[11px] font-medium tracking-wider text-gold-400">
            {step + 1} of 8
          </span>
          <a href="/" className="text-[11px] uppercase tracking-wider text-dark-500 hover:text-dark-300">
            Exit
          </a>
        </div>
      </div>

      {/* Question content */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 pt-24 pb-32 sm:px-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl"
          >
            {/* Question text */}
            <div className="mb-8 text-center sm:mb-10">
              <h2 className="font-serif text-2xl font-light text-white sm:text-4xl">
                {q.label}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[12px] italic leading-relaxed text-dark-400">
                {q.subtext}
              </p>
            </div>

            {/* Options */}
            <div className={`grid gap-3 ${q.options.length <= 3 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
              {q.options.map((opt) => {
                const isActive = activeValue === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`group relative flex items-start gap-4 rounded-xl border px-5 py-4 text-left transition-all duration-300 ${
                      isActive
                        ? "border-gold-400/50 bg-gold-400/[0.08] shadow-[0_0_20px_rgba(212,175,55,0.08)]"
                        : "border-white/[0.06] bg-white/[0.015] hover:border-white/[0.12] hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className="mt-0.5 text-xl">{opt.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[13px] font-medium ${isActive ? "text-gold-300" : "text-white"}`}>
                          {opt.title}
                        </span>
                        {isActive && (
                          <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-4 w-4 text-gold-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </motion.svg>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-dark-400">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Continue button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-dark-950 via-dark-950/95 to-transparent pb-6 pt-12">
        <div className="mx-auto flex max-w-2xl justify-end px-6">
          <button
            onClick={handleNext}
            disabled={!activeValue}
            className={`btn-luxury !py-3 !px-8 !text-[10px] transition-all ${
              activeValue ? "opacity-100" : "opacity-30 cursor-not-allowed"
            }`}
          >
            {step === 7 ? "See My Matches" : "Continue"}
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
