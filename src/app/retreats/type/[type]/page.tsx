import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllRetreats, slugifyRegion, slugifyCountry } from "@/lib/data";
import { WellnessRetreat } from "@/lib/types";
import RetreatCard from "@/components/RetreatCard";

export const revalidate = 86400;
export const dynamicParams = false;

// ═══════════════════════════════════════════════════════════════════════
// Type config — slug, display name, intro copy, matching keywords, FAQs
// ═══════════════════════════════════════════════════════════════════════

interface TypeConfig {
  slug: string;
  display: string;
  h1: string;
  intro: string;
  keywords: string[]; // matched against specialty_tags + program_types
  faqs: { question: string; answer: string }[];
}

const TYPE_CONFIGS: TypeConfig[] = [
  {
    slug: "yoga",
    display: "Yoga",
    h1: "Best Yoga Retreats",
    intro:
      "Whether you practice vinyasa, hatha, yin, or Ashtanga, a dedicated yoga retreat deepens your practice far beyond what studio classes offer. These retreats combine daily asana with meditation, breathwork, and nutrition — many in remote tropical or mountain locations. We score every yoga retreat across 15 categories so you can compare honestly.",
    keywords: ["yoga", "vinyasa", "hatha", "ashtanga", "yin-yoga", "yoga-retreat"],
    faqs: [
      { question: "How long should a yoga retreat be?", answer: "Most yoga retreats run 5 to 14 days. A 7-day retreat is the sweet spot for beginners — long enough to build momentum without overwhelming your schedule. Advanced practitioners often choose 10-14 day immersions for deeper transformation." },
      { question: "Do I need to be experienced to attend a yoga retreat?", answer: "No. The majority of yoga retreats welcome all levels, from complete beginners to advanced practitioners. Look for retreats that explicitly mention 'all levels' or 'beginner-friendly' in their program description." },
      { question: "What is the average cost of a yoga retreat?", answer: "Yoga retreats range from $150 to $1,500+ per night depending on location and luxury level. Budget-friendly options in Bali or Thailand start around $80/night, while premium resorts in the Caribbean or Europe average $500-$1,200/night all-inclusive." },
      { question: "What should I pack for a yoga retreat?", answer: "Pack comfortable, breathable yoga clothing, a travel yoga mat (most retreats provide mats), sunscreen, insect repellent, a reusable water bottle, and layers for cooler morning sessions. Leave electronics and work behind if possible." },
      { question: "What is the difference between a yoga retreat and a yoga teacher training?", answer: "A yoga retreat focuses on personal practice, relaxation, and wellness. A yoga teacher training (YTT) is an intensive certification program — typically 200 or 500 hours — designed to qualify you to teach yoga professionally. YTTs are significantly more demanding." },
    ],
  },
  {
    slug: "meditation",
    display: "Meditation",
    h1: "Best Meditation Retreats",
    intro:
      "A meditation retreat strips away daily distractions so you can cultivate genuine stillness. From Vipassana silence to guided mindfulness, these retreats offer structured programs led by experienced teachers. We evaluate meditation retreats on teacher credentials, environment, program depth, and guest outcomes across 15 weighted categories.",
    keywords: ["meditation", "mindfulness", "vipassana", "silent-meditation", "zen", "mindfulness-retreat"],
    faqs: [
      { question: "What happens during a meditation retreat?", answer: "Most meditation retreats follow a structured daily schedule: early morning meditation (often 5-6am), walking meditation, dharma talks or teachings, mindful meals, and multiple seated meditation sessions throughout the day. Many include noble silence for part or all of the retreat." },
      { question: "Are meditation retreats silent?", answer: "Not always. Some retreats — particularly Vipassana — observe complete silence for the duration. Others blend silent periods with group discussions, workshops, and social meals. Check the retreat description to understand the silence policy before booking." },
      { question: "How long is a typical meditation retreat?", answer: "Meditation retreats range from weekend intensives (2-3 days) to month-long immersions. The classic Vipassana course is 10 days. For first-timers, a 3-5 day retreat provides meaningful depth without excessive commitment." },
      { question: "Do I need meditation experience before attending?", answer: "No prior experience is required for most retreats. Many programs are designed specifically for beginners and include foundational instruction. However, advanced retreats (like 10-day Vipassana) can be physically and mentally challenging even for experienced meditators." },
      { question: "What are the proven benefits of a meditation retreat?", answer: "Research shows that meditation retreats can reduce cortisol levels, lower blood pressure, improve sleep quality, increase gray matter density in the brain, and reduce symptoms of anxiety and depression. Many participants report lasting changes in stress response and emotional regulation." },
    ],
  },
  {
    slug: "detox",
    display: "Detox",
    h1: "Best Detox Retreats",
    intro:
      "Detox retreats combine clinical protocols — juice fasting, colon hydrotherapy, infrared saunas, and IV therapy — with rest and nutritional education. The best programs are medically supervised and personalized to your health profile. We score detox retreats on medical rigor, nutritional science, practitioner credentials, and post-program support.",
    keywords: ["detox", "cleanse", "juice-cleanse", "fasting-detox", "detoxification", "detox-retreat"],
    faqs: [
      { question: "Are detox retreats scientifically supported?", answer: "The evidence is mixed. While your liver and kidneys handle daily detoxification, structured detox programs that include fasting, clean nutrition, and stress reduction can reduce inflammation markers and improve metabolic health. The best retreats combine evidence-based protocols with medical supervision." },
      { question: "How long should a detox retreat last?", answer: "Most effective detox programs run 5 to 14 days. A 7-day program allows your body to move through the initial adjustment phase and begin deeper cellular repair. Shorter stays (3-5 days) work for maintenance, while 14+ days target chronic conditions." },
      { question: "What side effects should I expect during a detox retreat?", answer: "Common side effects in the first 2-3 days include headaches, fatigue, irritability, and digestive changes. These typically subside as your body adjusts. Medically supervised retreats monitor your vitals and adjust protocols to minimize discomfort." },
      { question: "Can I do a detox retreat if I have medical conditions?", answer: "Many detox retreats accommodate medical conditions, but you must disclose your full health history during intake. Retreats with on-site physicians are best for guests with diabetes, autoimmune conditions, or medication dependencies. Always consult your doctor before booking." },
      { question: "What happens after a detox retreat?", answer: "The best detox retreats include a post-program protocol — typically a 2-4 week reintroduction diet, supplement recommendations, and follow-up consultations. Without a structured transition plan, many benefits fade within weeks of returning home." },
    ],
  },
  {
    slug: "ayahuasca",
    display: "Ayahuasca",
    h1: "Best Ayahuasca Retreats",
    intro:
      "Ayahuasca retreats offer guided ceremonial experiences with the Amazonian plant medicine, typically facilitated by indigenous or trained shamans. Safety, practitioner lineage, medical screening, and integration support are critical factors. We evaluate ayahuasca retreats on safety protocols, facilitator credentials, setting, and aftercare — not just the ceremony itself.",
    keywords: ["ayahuasca", "plant-medicine", "ceremony", "shamanic", "ayahuasca-retreat"],
    faqs: [
      { question: "Is ayahuasca legal?", answer: "Ayahuasca legality varies by country. It is legal in Peru, Brazil, Costa Rica, and several other Latin American countries where most retreats operate. It is illegal or exists in a legal gray area in the US, UK, and most of Europe. Always verify the legal status in your retreat's jurisdiction." },
      { question: "How do I choose a safe ayahuasca retreat?", answer: "Look for retreats with medical screening questionnaires, on-site medical staff, experienced facilitators with verifiable lineages, small group sizes (under 20), and structured integration support. Avoid retreats that skip health intake forms or mix ayahuasca with other substances." },
      { question: "What should I expect during an ayahuasca ceremony?", answer: "Ceremonies typically last 4-6 hours, held at night. Effects begin 30-60 minutes after drinking and may include visions, intense emotions, physical purging (vomiting or diarrhea), and profound psychological insights. Facilitators guide the process with icaros (sacred songs) and individual attention." },
      { question: "Who should NOT attend an ayahuasca retreat?", answer: "Ayahuasca is contraindicated for anyone taking SSRIs, MAOIs, or certain other medications due to dangerous interactions. People with schizophrenia, bipolar disorder, or psychotic conditions should avoid it. Pregnant women and those with serious heart conditions are also excluded by reputable retreats." },
      { question: "How many ceremonies are included in a typical retreat?", answer: "Most ayahuasca retreats include 2-4 ceremonies over 7-10 days, with rest and integration days between sessions. First-timers should choose retreats with at least 2 ceremonies — the first is often an introduction, and deeper work happens in subsequent sessions." },
    ],
  },
  {
    slug: "silent",
    display: "Silent",
    h1: "Best Silent Retreats",
    intro:
      "Silent retreats eliminate conversation, screens, and external stimulation so you can turn inward. Whether rooted in Buddhist Vipassana, Christian contemplative traditions, or secular mindfulness, these programs cultivate deep awareness and mental clarity. We score silent retreats on program structure, teacher quality, environment, and the depth of the silence container.",
    keywords: ["silent", "silence", "noble-silence", "vipassana", "silent-retreat", "contemplative"],
    faqs: [
      { question: "What does 'noble silence' mean at a retreat?", answer: "Noble silence means refraining from all forms of communication — verbal speech, eye contact, gestures, writing notes, and phone use. It creates a container for deep introspection. Some retreats allow brief functional communication with staff for practical needs." },
      { question: "How long are silent retreats?", answer: "Silent retreats range from weekend programs (2-3 days) to 30-day intensives. The classic Vipassana course is 10 days of complete silence. For beginners, a 3-5 day silent retreat provides a meaningful experience without overwhelming intensity." },
      { question: "Is a silent retreat difficult for beginners?", answer: "The first 24-48 hours are typically the hardest. Your mind races, boredom sets in, and the urge to speak is strong. By day 3, most participants report increased calm and clarity. Starting with a guided silent retreat (rather than self-directed silence) helps beginners enormously." },
      { question: "What do you do all day at a silent retreat?", answer: "Days are structured with seated meditation, walking meditation, mindful meals, gentle yoga or movement, and rest periods. Most retreats include dharma talks or guided instructions. You are never simply 'sitting in a room doing nothing' — the schedule is deliberate and full." },
      { question: "Can I leave a silent retreat early if it becomes too intense?", answer: "Yes, you can always leave. Reputable retreats make this clear during orientation. However, teachers generally encourage you to stay through difficult moments, as breakthroughs often follow periods of discomfort. Speak with a teacher or staff member if you are struggling." },
    ],
  },
  {
    slug: "wellness",
    display: "Wellness",
    h1: "Best Wellness Retreats",
    intro:
      "Wellness retreats take a holistic approach — integrating nutrition, fitness, mindfulness, spa therapies, and often medical diagnostics into a comprehensive program. Unlike single-focus retreats, these properties address your whole health picture. Our 15-category scoring system was designed specifically to evaluate these multi-dimensional programs objectively.",
    keywords: ["wellness", "holistic", "well-being", "health-retreat", "wellness-retreat", "integrative"],
    faqs: [
      { question: "What is included in a wellness retreat?", answer: "Most wellness retreats include accommodation, healthy meals, fitness classes, spa treatments, mindfulness sessions, and wellness consultations. Premium programs add medical assessments, lab work, IV therapy, and personalized health plans. Always check what is included vs. a la carte." },
      { question: "How much do wellness retreats cost?", answer: "Wellness retreats range from $200/night for basic programs to $5,000+/night for ultra-luxury medical wellness resorts. The average high-quality wellness retreat costs $400-$1,200/night all-inclusive. Prices vary dramatically by region — Southeast Asia is most affordable, Europe and the US most expensive." },
      { question: "How long should I stay at a wellness retreat?", answer: "A minimum of 5 nights is recommended for meaningful results. The optimal stay is 7-14 days, which allows your body to adjust, your stress hormones to normalize, and new habits to begin forming. Weekend stays work for maintenance but rarely produce lasting transformation." },
      { question: "Are wellness retreats worth the money?", answer: "For most people, yes — if you choose well. The combination of expert guidance, removal from daily stressors, clean nutrition, and structured programming produces results that are difficult to replicate at home. The key is selecting a retreat that matches your specific goals and health needs." },
      { question: "What is the difference between a wellness retreat and a spa vacation?", answer: "A spa vacation focuses on relaxation and pampering. A wellness retreat is goal-oriented — it includes health assessments, structured programming, educational components, and often follows a clinical or therapeutic framework. Retreats aim for lasting change; spa vacations aim for temporary relaxation." },
    ],
  },
  {
    slug: "fitness",
    display: "Fitness",
    h1: "Best Fitness Retreats",
    intro:
      "Fitness retreats combine intensive training with recovery, nutrition, and expert coaching in environments designed to push your limits. From boot camps to endurance programs, these retreats are for guests who want measurable physical progress. We score fitness retreats on programming quality, trainer credentials, recovery protocols, and nutritional support.",
    keywords: ["fitness", "bootcamp", "boot-camp", "training", "exercise", "fitness-retreat", "strength"],
    faqs: [
      { question: "What fitness level do I need for a fitness retreat?", answer: "Most fitness retreats offer programming for multiple levels, from beginner to advanced. However, boot camp-style retreats often assume a baseline of fitness. Be honest about your current level when booking and look for retreats that explicitly state their intensity expectations." },
      { question: "How many hours of exercise per day at a fitness retreat?", answer: "Typically 4-6 hours of structured activity per day, broken into morning and afternoon sessions. This includes warm-ups, main training blocks, stretching, and recovery work. Premium retreats balance high-intensity sessions with restorative activities like yoga, swimming, or massage." },
      { question: "Will I lose weight at a fitness retreat?", answer: "Most guests lose 3-8 pounds during a 7-day fitness retreat through the combination of increased activity and controlled nutrition. However, the primary value is building sustainable habits, improving cardiovascular fitness, and learning proper form — not short-term weight loss." },
      { question: "What should I bring to a fitness retreat?", answer: "Bring quality athletic shoes (trail and gym), moisture-wicking workout clothing for 2x daily sessions, a swimsuit, sunscreen, a foam roller or massage ball, and any personal supplements. Most retreats provide towels, water bottles, and basic equipment." },
      { question: "Do fitness retreats include nutrition programming?", answer: "The best ones do. Top-rated fitness retreats include nutritional assessments, macro-balanced meal plans, cooking workshops, and post-retreat nutrition guidance. Be wary of retreats that focus exclusively on exercise without addressing nutrition — results won't last." },
    ],
  },
  {
    slug: "weight-loss",
    display: "Weight Loss",
    h1: "Best Weight Loss Retreats",
    intro:
      "Weight loss retreats combine controlled nutrition, structured exercise, behavioral coaching, and often medical oversight to produce measurable results in a supportive environment. The best programs focus on sustainable habit change rather than crash dieting. We evaluate weight loss retreats on clinical rigor, nutritional science, exercise programming, and long-term support.",
    keywords: ["weight-loss", "weight-management", "slimming", "fat-loss", "obesity", "bariatric"],
    faqs: [
      { question: "How much weight can I lose at a weight loss retreat?", answer: "Results vary, but most guests lose 4-10 pounds during a 7-day retreat and 8-20 pounds during a 14-day stay. The most important factor is what happens after — retreats with post-program coaching and follow-up show significantly better long-term outcomes than those without." },
      { question: "Are weight loss retreats medically supervised?", answer: "The best ones are. Look for retreats with on-site physicians, registered dietitians, and clinical-grade body composition analysis. Medical supervision is especially important if you take medications, have metabolic conditions, or need to lose more than 30 pounds." },
      { question: "How is a weight loss retreat different from a diet program?", answer: "A retreat removes you from your daily environment, provides 24/7 support, and addresses the psychological and behavioral roots of weight gain — not just calories. The combination of controlled nutrition, daily exercise, stress reduction, and professional coaching produces results that self-directed dieting rarely achieves." },
      { question: "What do you eat at a weight loss retreat?", answer: "Meals are calorie-controlled but nutritionally complete — typically 1,200-1,800 calories per day of whole, unprocessed food. Expect plenty of vegetables, lean proteins, healthy fats, and complex carbohydrates. Most retreats accommodate dietary restrictions and allergies." },
      { question: "How long should I stay at a weight loss retreat?", answer: "A minimum of 7 days is necessary for meaningful results, but 14-28 days produces significantly better outcomes. Longer stays allow your metabolism to adjust, new habits to solidify, and behavioral patterns to shift. Many retreats offer discounted rates for extended stays." },
    ],
  },
  {
    slug: "spiritual",
    display: "Spiritual",
    h1: "Best Spiritual Retreats",
    intro:
      "Spiritual retreats offer guided exploration of inner life through meditation, prayer, ceremony, energy work, or contemplative practices. These programs range from secular mindfulness to deeply religious traditions. We evaluate spiritual retreats on teacher authenticity, program depth, setting, and the quality of the transformative container they create.",
    keywords: ["spiritual", "spirit", "shamanic", "energy-healing", "prayer", "contemplative", "spiritual-retreat"],
    faqs: [
      { question: "Do I need to be religious to attend a spiritual retreat?", answer: "No. Many spiritual retreats are secular or interfaith, drawing from multiple wisdom traditions without requiring adherence to any. However, some retreats are rooted in specific traditions (Buddhist, Christian, Hindu). Check the program description to ensure alignment with your beliefs or openness." },
      { question: "What happens at a spiritual retreat?", answer: "Activities vary widely but may include meditation, guided visualization, breathwork, journaling, nature immersion, energy healing, prayer, chanting, and group sharing circles. Most retreats follow a structured daily schedule with free time for reflection." },
      { question: "How do I choose the right spiritual retreat?", answer: "Start with your intention — are you seeking peace, meaning, healing, or connection? Then match the tradition and modality to your comfort level. Read teacher bios carefully, look for retreats with strong reviews mentioning personal transformation, and choose a setting that resonates with you." },
      { question: "Are spiritual retreats safe?", answer: "Reputable spiritual retreats are safe. Be cautious of retreats that pressure you into uncomfortable practices, discourage you from leaving, mix plant medicines without medical screening, or are led by untrained facilitators. Trust your instincts and verify credentials." },
      { question: "What results can I expect from a spiritual retreat?", answer: "Common outcomes include increased clarity about life direction, deeper self-awareness, reduced anxiety, improved relationships, and a renewed sense of purpose. Many participants describe a 'shift' in perspective that persists long after the retreat ends. Transformation is personal and cannot be guaranteed." },
    ],
  },
  {
    slug: "ayurveda",
    display: "Ayurveda",
    h1: "Best Ayurveda Retreats",
    intro:
      "Ayurveda retreats apply India's 5,000-year-old healing system through personalized treatments, herbal medicine, dietary protocols, and lifestyle recommendations based on your dosha (constitutional type). The best programs employ certified Ayurvedic physicians and follow authentic Panchakarma protocols. We score Ayurveda retreats on practitioner credentials, treatment authenticity, and clinical depth.",
    keywords: ["ayurveda", "ayurvedic", "panchakarma", "dosha", "ayurveda-retreat"],
    faqs: [
      { question: "What is Panchakarma and should I do it?", answer: "Panchakarma is Ayurveda's flagship detoxification protocol — a 7-28 day process involving oil treatments, herbal steam, therapeutic purging, and specialized diet. It is profoundly effective for deep cleansing but requires commitment. A minimum of 14 days is recommended for authentic Panchakarma; shorter programs offer modified versions." },
      { question: "How long should an Ayurveda retreat be?", answer: "Minimum 7 days for basic Ayurvedic treatments. 14-21 days for Panchakarma or chronic condition management. 28+ days for deep therapeutic programs. Shorter stays provide relaxation and introduction to Ayurvedic principles but lack the depth for meaningful clinical outcomes." },
      { question: "Where are the best Ayurveda retreats?", answer: "Kerala, India is the global epicenter of authentic Ayurveda — the state has more certified Ayurvedic physicians than anywhere else. Sri Lanka is an excellent alternative with slightly more modern facilities. European and US Ayurveda retreats exist but often blend Ayurveda with Western spa treatments." },
      { question: "What does a typical day look like at an Ayurveda retreat?", answer: "Days begin early (5-6am) with yoga and meditation, followed by herbal treatments (Abhyanga massage, Shirodhara, steam therapy), Ayurvedic meals timed to your dosha, rest periods, and evening relaxation. Treatments are prescribed by your Ayurvedic doctor and adjusted throughout your stay." },
      { question: "Is Ayurveda scientifically proven?", answer: "Individual Ayurvedic herbs (turmeric, ashwagandha, triphala) have strong clinical evidence. The holistic system as a whole has less Western clinical trial data, though studies on Panchakarma show measurable improvements in inflammation markers, cardiovascular health, and metabolic function. Ayurveda is recognized by the WHO as a traditional medicine system." },
    ],
  },
  {
    slug: "plant-medicine",
    display: "Plant Medicine",
    h1: "Best Plant Medicine Retreats",
    intro:
      "Plant medicine retreats facilitate guided experiences with traditional psychoactive substances — ayahuasca, psilocybin, San Pedro, kambo, and others — in ceremonial settings. Safety is paramount: proper medical screening, experienced facilitators, and robust integration support separate excellent programs from dangerous ones. We evaluate plant medicine retreats on safety protocols, facilitator lineage, and aftercare.",
    keywords: ["plant-medicine", "psychedelic", "psilocybin", "san-pedro", "kambo", "ibogaine", "ceremony"],
    faqs: [
      { question: "Are plant medicine retreats safe?", answer: "When conducted by experienced facilitators with proper medical screening, plant medicine ceremonies have strong safety profiles. Risks increase dramatically without screening (drug interactions with SSRIs can be fatal), with untrained facilitators, or in uncontrolled settings. Choose retreats with verifiable medical protocols." },
      { question: "What plant medicines are used at retreats?", answer: "The most common are ayahuasca (South America), psilocybin mushrooms (worldwide), San Pedro/huachuma cactus (Andes), kambo frog medicine (Amazon), and ibogaine (West Africa/Mexico). Each has distinct effects, durations, and risk profiles. Research thoroughly before choosing." },
      { question: "How should I prepare for a plant medicine retreat?", answer: "Most retreats require a preparatory diet (no alcohol, processed food, or certain medications for 1-4 weeks before). Disclose ALL medications to the retreat. Set clear intentions. Arrange post-retreat integration support. Avoid retreats that skip preparation guidelines." },
      { question: "What is integration and why does it matter?", answer: "Integration is the process of making sense of your plant medicine experience and applying its insights to daily life. Without integration, even profound experiences can fade or become confusing. The best retreats include integration circles, follow-up calls, and referrals to integration therapists." },
      { question: "Who should NOT attend a plant medicine retreat?", answer: "People taking SSRIs, MAOIs, lithium, or certain other psychiatric medications. Those with schizophrenia, psychotic disorders, or severe personality disorders. Pregnant or nursing women. People with serious cardiovascular conditions (for some medicines). Always complete the medical screening honestly." },
    ],
  },
  {
    slug: "breathwork",
    display: "Breathwork",
    h1: "Best Breathwork Retreats",
    intro:
      "Breathwork retreats use structured breathing techniques — Holotropic, Wim Hof, Transformational, or pranayama-based — to produce altered states, release stored trauma, and improve physiological resilience. These retreats combine intensive breathing sessions with integration, movement, and often cold exposure. We score breathwork retreats on facilitator training, safety protocols, and program design.",
    keywords: ["breathwork", "breath", "pranayama", "holotropic", "wim-hof", "breathing", "breathwork-retreat"],
    faqs: [
      { question: "What is Holotropic breathwork?", answer: "Holotropic breathwork was developed by psychiatrist Stanislav Grof. It uses accelerated breathing, evocative music, and bodywork to access non-ordinary states of consciousness. Sessions last 2-3 hours and can produce intense emotional releases, physical sensations, and psychological insights. A trained facilitator is essential." },
      { question: "Is breathwork safe?", answer: "For most healthy adults, breathwork is safe when guided by a trained facilitator. However, certain techniques can cause tingling, dizziness, muscle cramping, or intense emotional responses. Breathwork is contraindicated for people with epilepsy, severe cardiovascular conditions, recent surgery, or pregnancy." },
      { question: "How is a breathwork retreat different from a class?", answer: "A retreat provides the container for deeper work — multiple sessions over several days, combined with integration, movement, and rest. A single class introduces a technique; a retreat allows you to go deeper, process what arises, and build a sustainable practice with expert guidance." },
      { question: "What should I expect during my first breathwork session?", answer: "Expect physical sensations (tingling in hands/face, temperature changes, muscle tension), emotional releases (crying, laughing, anger), and potentially vivid mental imagery. Sessions typically last 60-90 minutes for circular breathing techniques. Facilitators are present to support you throughout." },
      { question: "Which breathwork technique is best for beginners?", answer: "Box breathing and coherence breathing are excellent starting points. For retreat settings, Transformational Breath and conscious connected breathing are beginner-friendly yet powerful. Holotropic and Wim Hof methods are more intense and better suited for those with some breathwork experience." },
    ],
  },
  {
    slug: "fasting",
    display: "Fasting",
    h1: "Best Fasting Retreats",
    intro:
      "Fasting retreats provide medically supervised environments for water fasting, juice fasting, or intermittent fasting protocols. The best programs include pre-fast preparation, daily medical monitoring, breaking-the-fast guidance, and post-fast nutritional coaching. We evaluate fasting retreats on medical supervision quality, safety protocols, and the science behind their programming.",
    keywords: ["fasting", "water-fasting", "juice-fasting", "intermittent-fasting", "fast", "fasting-retreat"],
    faqs: [
      { question: "Is it safe to do a water fast at a retreat?", answer: "Medically supervised water fasting is generally safe for healthy adults. The key is 'medically supervised' — daily vitals monitoring, electrolyte management, and physician oversight are essential, especially for fasts longer than 3 days. Never attempt extended water fasting without professional supervision." },
      { question: "How long should a fasting retreat be?", answer: "A 5-7 day retreat is typical, with 3-5 days of actual fasting plus pre-fast and re-feeding phases. Extended fasts of 7-14 days are available at specialized centers. Your first supervised fast should be shorter (3-5 days) to understand how your body responds." },
      { question: "What are the benefits of a supervised fasting retreat?", answer: "Research shows that medically supervised fasting can improve insulin sensitivity, reduce inflammation, promote autophagy (cellular cleanup), lower blood pressure, and support weight management. The supervised setting ensures safety and provides education that helps you incorporate fasting into daily life." },
      { question: "What happens when you break a fast?", answer: "Breaking a fast requires careful reintroduction of food — typically starting with broths, juices, and soft fruits before progressing to solid food over 2-3 days. Eating too much too quickly after fasting can cause refeeding syndrome, which is why medical supervision matters." },
      { question: "Who should avoid fasting retreats?", answer: "Fasting is not appropriate for pregnant or nursing women, those with eating disorders, people with Type 1 diabetes, anyone severely underweight, children, and those taking medications that require food. A thorough medical intake should be completed before any fasting program." },
    ],
  },
  {
    slug: "couples",
    display: "Couples",
    h1: "Best Couples Retreats",
    intro:
      "Couples retreats blend relationship-focused programming — communication workshops, partner yoga, couple's therapy sessions — with luxury wellness amenities. Whether you are strengthening a strong relationship or working through challenges, these retreats create a focused container for reconnection. We evaluate couples retreats on program quality, privacy, romantic setting, and therapeutic depth.",
    keywords: ["couples", "couple", "romantic", "honeymoon", "partner", "relationship", "couples-retreat"],
    faqs: [
      { question: "What do you do at a couples retreat?", answer: "Activities typically include couple's massage and spa treatments, partner yoga, communication workshops, guided relationship exercises, romantic dining, and adventure activities. Some retreats include sessions with a licensed therapist. The blend varies from purely romantic to deeply therapeutic." },
      { question: "Are couples retreats only for troubled relationships?", answer: "Absolutely not. Many couples attend retreats as an investment in an already strong relationship. Retreats provide dedicated time for connection, shared experiences, and communication that busy daily life often crowds out. Think of it as preventive maintenance for your relationship." },
      { question: "How much do couples retreats cost?", answer: "Couples retreats typically range from $500 to $3,000+ per night for double occupancy. This usually includes shared accommodation, meals, spa treatments, and programming. All-inclusive packages offer better value than a la carte pricing. Southeast Asia and Mexico offer more affordable luxury options." },
      { question: "Should we choose a retreat with therapy or without?", answer: "If you are working through specific challenges, choose a retreat with licensed therapists or relationship counselors. If your goal is reconnection and romance, a luxury wellness retreat with couples activities may be the better fit. Be honest with each other about your goals before booking." },
      { question: "How long should a couples retreat be?", answer: "A minimum of 4 nights allows couples to decompress and engage meaningfully. 7 nights is ideal for deeper work. Weekend retreats exist but often feel rushed. Longer stays (10-14 days) work well for couples combining relationship focus with individual wellness programming." },
    ],
  },
  {
    slug: "luxury",
    display: "Luxury",
    h1: "Best Luxury Retreats",
    intro:
      "Luxury wellness retreats deliver transformative health programming in extraordinary settings — private villas, Michelin-caliber cuisine, dedicated wellness butlers, and advanced medical diagnostics. These properties represent the pinnacle of the industry. We score luxury retreats on the same 15 categories as every other retreat, so you can verify whether the price matches the substance.",
    keywords: ["luxury", "ultra-luxury", "five-star", "premium", "exclusive", "high-end", "luxury-retreat"],
    faqs: [
      { question: "What makes a retreat 'luxury'?", answer: "True luxury retreats combine exceptional accommodation (private villas, suites), personalized programming (1:1 staff ratios), world-class cuisine, and premium wellness services (advanced diagnostics, specialized practitioners). It is not just about thread count — it is about the depth of personalization and clinical excellence." },
      { question: "Are luxury retreats worth the premium price?", answer: "At the best properties, yes. The value comes from personalization — dedicated practitioners, custom-formulated supplements, private sessions, and programs tailored to your biomarkers. Mid-range retreats often use group programming; luxury retreats build everything around your individual needs." },
      { question: "What is the price range for luxury wellness retreats?", answer: "Luxury wellness retreats typically start at $1,500/night and can exceed $10,000/night at ultra-premium properties. All-inclusive pricing is standard. Most guests stay 7-14 nights, putting total program costs between $10,000 and $100,000+. Some offer payment plans." },
      { question: "Which regions have the best luxury wellness retreats?", answer: "The strongest clusters are in Southeast Asia (Thailand, Bali), Europe (Austria, Switzerland, Spain), the Americas (Mexico, Caribbean, Arizona/California), and the Indian subcontinent (India, Sri Lanka). Each region offers distinct strengths — European retreats excel in medical wellness, Asian properties in holistic traditions." },
      { question: "What should I expect on arrival at a luxury retreat?", answer: "Expect a private transfer from the airport, personal welcome, health intake consultation (often with a physician), body composition analysis, goal-setting session, and a customized program built around your results. Your daily schedule, meals, and treatments are personalized before your first full day." },
    ],
  },
];

const TYPE_MAP = new Map(TYPE_CONFIGS.map((t) => [t.slug, t]));
const ALL_TYPE_SLUGS = TYPE_CONFIGS.map((t) => t.slug);

// ═══════════════════════════════════════════════════════════════════════
// Static params
// ═══════════════════════════════════════════════════════════════════════

export function generateStaticParams() {
  return ALL_TYPE_SLUGS.map((type) => ({ type }));
}

// ═══════════════════════════════════════════════════════════════════════
// Metadata
// ═══════════════════════════════════════════════════════════════════════

type Params = { type: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { type } = await params;
  const config = TYPE_MAP.get(type);
  if (!config) return { title: "Retreat Type Not Found" };

  const title = `Best ${config.display} Retreats 2026 \u2014 Compare & Book | RetreatVault`;
  const description = `Compare the best ${config.display.toLowerCase()} retreats worldwide, scored across 15 categories. Honest ratings, real prices, no sponsored rankings.`;

  return {
    title,
    description,
    alternates: { canonical: `https://www.retreatvault.com/retreats/type/${type}` },
    openGraph: {
      title,
      description,
      url: `https://www.retreatvault.com/retreats/type/${type}`,
      siteName: "RetreatVault",
      type: "website",
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

function matchesType(retreat: WellnessRetreat, keywords: string[]): boolean {
  const allTags = [
    ...retreat.specialty_tags.map((t) => t.toLowerCase()),
    ...retreat.program_types.map((t) => t.toLowerCase()),
  ];
  return keywords.some((kw) => allTags.some((tag) => tag.includes(kw)));
}

// ═══════════════════════════════════════════════════════════════════════
// Page component
// ═══════════════════════════════════════════════════════════════════════

export default async function RetreatTypePage({ params }: { params: Promise<Params> }) {
  const { type } = await params;
  const config = TYPE_MAP.get(type);
  if (!config) notFound();

  const allRetreats = await getAllRetreats();
  const typeRetreats = allRetreats
    .filter((r) => matchesType(r, config.keywords))
    .sort((a, b) => b.wrd_score - a.wrd_score);

  if (typeRetreats.length === 0) notFound();

  // Top 12 for card display
  const top12 = typeRetreats.slice(0, 12);

  // Group by region
  const byRegion = new Map<string, WellnessRetreat[]>();
  typeRetreats.forEach((r) => {
    const list = byRegion.get(r.region) || [];
    list.push(r);
    byRegion.set(r.region, list);
  });

  // Group by country
  const byCountry = new Map<string, WellnessRetreat[]>();
  typeRetreats.forEach((r) => {
    const list = byCountry.get(r.country) || [];
    list.push(r);
    byCountry.set(r.country, list);
  });

  // Stats
  const avgScore = typeRetreats.reduce((sum, r) => sum + r.wrd_score, 0) / typeRetreats.length;
  const avgPrice =
    typeRetreats.reduce((sum, r) => sum + r.price_min_per_night, 0) / typeRetreats.length;
  const countryCount = byCountry.size;

  // JSON-LD: Breadcrumb — built from static config, not user input
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.retreatvault.com" },
      { "@type": "ListItem", position: 2, name: "Retreats", item: "https://www.retreatvault.com/retreats" },
      { "@type": "ListItem", position: 3, name: `${config.display} Retreats`, item: `https://www.retreatvault.com/retreats/type/${type}` },
    ],
  };

  // JSON-LD: FAQ — built from static config
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  // JSON-LD: ItemList
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best ${config.display} Retreats`,
    description: `Top-rated ${config.display.toLowerCase()} retreats worldwide, ranked by RetreatVault score.`,
    url: `https://www.retreatvault.com/retreats/type/${type}`,
    numberOfItems: typeRetreats.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: top12.map((retreat, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: retreat.name,
      url: `https://www.retreatvault.com/retreats/${retreat.slug}`,
    })),
  };

  return (
    <>
      {/* Structured data — all content derived from static config, safe */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <main className="min-h-screen bg-dark-950">
        {/* ═══ HERO ═══ */}
        <section className="border-b border-white/[0.06] px-6 pb-16 pt-32 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            {/* Breadcrumb */}
            <nav className="mb-8 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-dark-400">
              <a href="/" className="transition-colors hover:text-gold-400">Home</a>
              <span className="text-dark-700">/</span>
              <a href="/retreats" className="transition-colors hover:text-gold-400">Retreats</a>
              <span className="text-dark-700">/</span>
              <span className="text-dark-300">{config.display}</span>
            </nav>

            <h1 className="font-serif text-4xl font-light text-white md:text-5xl lg:text-6xl">
              {config.h1}
            </h1>
            <p className="mt-4 text-lg text-dark-400">
              {typeRetreats.length} {typeRetreats.length === 1 ? "retreat" : "retreats"} across{" "}
              {countryCount} {countryCount === 1 ? "country" : "countries"}
            </p>
            <p className="mt-6 max-w-3xl text-[15px] leading-relaxed text-dark-300">
              {config.intro}
            </p>
          </div>
        </section>

        {/* ═══ QUICK STATS ═══ */}
        <section className="border-b border-white/[0.06] px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-500">
              {config.display} Retreat Overview
            </p>
            <h2 className="mt-3 font-serif text-2xl font-light text-white">
              {config.display} Retreats at a Glance
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-dark-400">Total Retreats</p>
                <p className="mt-2 font-serif text-3xl text-white">{typeRetreats.length}</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-dark-400">Avg. Score</p>
                <p className="mt-2 font-serif text-3xl text-gold-400">{avgScore.toFixed(1)}</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-dark-400">Avg. Price</p>
                <p className="mt-2 font-serif text-3xl text-white">${Math.round(avgPrice).toLocaleString()}<span className="text-lg text-dark-400">/night</span></p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-dark-400">Countries</p>
                <p className="mt-2 font-serif text-3xl text-white">{countryCount}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ TOP RETREATS (CARDS) ═══ */}
        <section className="border-b border-white/[0.06] px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-serif text-2xl font-light text-white">
              Top {config.display} Retreats
            </h2>
            <p className="mt-2 text-[13px] text-dark-300">
              Ranked by RetreatVault score
            </p>
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {top12.map((retreat) => (
                <RetreatCard key={retreat.slug} retreat={retreat} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══ BROWSE BY REGION ═══ */}
        {byRegion.size > 1 && (
          <section className="border-b border-white/[0.06] px-6 py-16 md:px-12 lg:px-20">
            <div className="mx-auto max-w-7xl">
              <h2 className="font-serif text-2xl font-light text-white">
                {config.display} Retreats by Region
              </h2>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array.from(byRegion.entries())
                  .sort(([, a], [, b]) => b.length - a.length)
                  .map(([region, retreats]) => (
                    <a
                      key={region}
                      href={`/retreats/region/${slugifyRegion(region)}`}
                      className="group flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition-all hover:border-gold-400/30 hover:bg-white/[0.04]"
                    >
                      <span className="font-serif text-[15px] text-white group-hover:text-gold-400 transition-colors">
                        {region}
                      </span>
                      <span className="ml-3 text-[12px] text-dark-400">
                        {retreats.length}
                      </span>
                    </a>
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══ FULL DIRECTORY BY COUNTRY ═══ */}
        <section className="px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-serif text-2xl font-light text-white">
              Complete {config.display} Retreat Directory
            </h2>
            <p className="mt-2 text-[13px] text-dark-300">
              Every {config.display.toLowerCase()} retreat, organized by country
            </p>

            {Array.from(byCountry.entries())
              .sort(([, a], [, b]) => b.length - a.length)
              .map(([country, retreats]) => (
                <div key={country} className="mt-10">
                  <div className="flex items-center gap-4">
                    <h3 className="font-serif text-lg text-gold-400">
                      <a
                        href={`/retreats/country/${slugifyCountry(country)}`}
                        className="hover:text-gold-300 transition-colors"
                      >
                        {country}
                      </a>
                    </h3>
                    <span className="text-[11px] text-dark-400">
                      {retreats.length} {retreats.length === 1 ? "retreat" : "retreats"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {retreats.map((r) => (
                      <a
                        key={r.slug}
                        href={`/retreats/${r.slug}`}
                        className="group flex flex-col gap-1 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all hover:border-gold-400/20 hover:bg-white/[0.04] md:flex-row md:items-center md:gap-6 md:rounded-none md:border-0 md:border-b md:bg-transparent md:px-0 md:py-3"
                      >
                        <span className="text-[14px] font-medium text-white group-hover:text-gold-400 transition-colors md:flex-1">
                          {r.name}
                        </span>
                        <span className="text-[13px] text-dark-300 md:w-40">
                          {r.city}
                        </span>
                        <div className="flex items-center justify-between md:contents">
                          <span className="font-serif text-[14px] text-gold-400 md:w-20 md:text-right">
                            {r.wrd_score.toFixed(1)}
                          </span>
                          <span className="text-[13px] text-dark-200 md:w-48 md:text-right">
                            ${r.price_min_per_night.toLocaleString()}
                            {r.price_min_per_night !== r.price_max_per_night && (
                              <span className="text-dark-400">
                                &ndash;${r.price_max_per_night.toLocaleString()}
                              </span>
                            )}
                            <span className="ml-1 text-[11px] text-dark-400">/night</span>
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section className="border-t border-white/[0.06] px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-serif text-2xl font-light text-white">
              {config.display} Retreat FAQ
            </h2>
            <div className="mt-10 space-y-6">
              {config.faqs.map((faq, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 md:p-8">
                  <h3 className="font-serif text-lg text-white">{faq.question}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-dark-300">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ INTERNAL LINKS ═══ */}
        <section className="border-t border-white/[0.06] px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-serif text-2xl font-light text-white">
              Explore More
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="/retreats"
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-gold-400/30 hover:bg-white/[0.04]"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-500">Directory</p>
                <p className="mt-2 font-serif text-lg text-white group-hover:text-gold-400 transition-colors">
                  Full Retreat Directory
                </p>
                <p className="mt-1 text-[13px] text-dark-400">
                  Browse all 9,400+ retreats with filters
                </p>
              </a>
              <a
                href="/guides"
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-gold-400/30 hover:bg-white/[0.04]"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-500">Guides</p>
                <p className="mt-2 font-serif text-lg text-white group-hover:text-gold-400 transition-colors">
                  Wellness Retreat Guides
                </p>
                <p className="mt-1 text-[13px] text-dark-400">
                  Data-driven guides by goal, budget, and style
                </p>
              </a>
              <a
                href="/quiz"
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-gold-400/30 hover:bg-white/[0.04]"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-500">Quiz</p>
                <p className="mt-2 font-serif text-lg text-white group-hover:text-gold-400 transition-colors">
                  Find Your Perfect Retreat
                </p>
                <p className="mt-1 text-[13px] text-dark-400">
                  Answer 5 questions, get matched instantly
                </p>
              </a>
            </div>

            {/* Cross-links to other type pages */}
            <div className="mt-12">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-500">
                Browse by Type
              </h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {ALL_TYPE_SLUGS.filter((s) => s !== type).map((s) => {
                  const c = TYPE_MAP.get(s)!;
                  return (
                    <a
                      key={s}
                      href={`/retreats/type/${s}`}
                      className="rounded-full border border-white/[0.08] px-4 py-2 text-[12px] text-dark-300 transition-all hover:border-gold-400/30 hover:text-gold-400"
                    >
                      {c.display} Retreats
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
