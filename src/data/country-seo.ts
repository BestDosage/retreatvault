export interface CountryFAQ {
  question: string;
  answer: string;
}

export interface CountrySEOData {
  slug: string;
  country: string;
  description: string[];
  bestTimeToVisit: string;
  avgBudget: string;
  topTypes: string[];
  faqItems: CountryFAQ[];
}

export const COUNTRY_SEO: Record<string, CountrySEOData> = {
  indonesia: {
    slug: "indonesia",
    country: "Indonesia",
    description: [
      "Indonesia, and Bali in particular, has become the global epicenter of wellness travel. The island's Hindu-Balinese culture infuses every retreat experience with ceremony, spirituality, and a deep reverence for nature. From clifftop yoga shalas overlooking rice terraces to jungle-immersed healing centers in Ubud, Indonesia offers an unmatched density of world-class wellness properties at prices that remain accessible to most budgets.",
      "Beyond Bali, destinations like Lombok, Java, and the Gili Islands are emerging with boutique retreat offerings that emphasize solitude and authenticity. Indonesia's tropical climate, plant-based cuisine traditions, and the warmth of its people create an environment where transformation feels almost inevitable.",
      "Whether you're seeking a silent meditation retreat, an Ayurvedic detox, or an adventure-wellness hybrid with volcano treks and surf sessions, Indonesia delivers. The country's retreat scene spans the full spectrum from rustic ashram-style stays under $50/night to ultra-luxury wellness resorts rivaling anything in Europe or the Americas.",
    ],
    bestTimeToVisit: "April to October (dry season). May and September offer the best balance of good weather and lower crowds. The wet season (November-March) brings afternoon showers but also lush landscapes and discounted rates.",
    avgBudget: "$80-$350 per night. Budget retreats in Ubud start around $40-80/night, mid-range properties run $150-300, and luxury wellness resorts like COMO Shambhala or Fivelements command $400-800+.",
    topTypes: ["Yoga", "Meditation", "Detox & Cleanse", "Surf & Wellness", "Silent Retreat", "Ayurveda"],
    faqItems: [
      { question: "What is the best area in Indonesia for wellness retreats?", answer: "Ubud, Bali is the undisputed wellness capital, home to the highest concentration of retreat centers. Canggu offers surf-and-yoga combos, Uluwatu has clifftop luxury properties, and Sidemen provides a quieter, more traditional Balinese experience away from tourist crowds." },
      { question: "How much does a wellness retreat in Indonesia cost?", answer: "Indonesia offers retreats across every budget. Expect $40-80/night for basic yoga and meditation retreats, $150-300 for mid-range properties with holistic programs, and $400-800+ for luxury wellness resorts. Most retreats include meals, daily yoga, and meditation in their rates." },
      { question: "Do I need a visa for a wellness retreat in Indonesia?", answer: "Most nationalities can enter Indonesia visa-free for 30 days or obtain a Visa on Arrival (VOA) for 30 days, extendable once for another 30 days. For longer retreat stays, a B211A social/cultural visa allows up to 60 days with one extension." },
      { question: "What types of wellness retreats are popular in Indonesia?", answer: "Yoga retreats dominate, followed by meditation, detox and cleansing programs, Ayurvedic treatments, surf-and-wellness combos, and silent retreats. Many properties also offer Balinese healing traditions, sound therapy, and plant medicine ceremonies." },
      { question: "Is Indonesia safe for solo wellness travelers?", answer: "Indonesia, particularly Bali, is one of the safest destinations for solo wellness travelers. The retreat community is welcoming and well-established, with many properties specifically catering to solo guests. Standard travel precautions apply: use registered transport, drink bottled water, and secure valuables." },
    ],
  },
  thailand: {
    slug: "thailand",
    country: "Thailand",
    description: [
      "Thailand pioneered the modern wellness retreat industry in Southeast Asia, and its scene remains one of the most sophisticated in the world. From the pristine beaches of Koh Samui and Phuket to the misty mountains of Chiang Mai, Thai retreats blend ancient Buddhist meditation traditions with advanced detox protocols and world-class spa culture.",
      "The country's wellness infrastructure is unmatched in the region. Thailand's retreat centers benefit from a deep talent pool of trained therapists, excellent medical tourism facilities, and a cuisine that naturally emphasizes fresh herbs, spices, and plant-forward cooking. Many retreats integrate Thai massage, Muay Thai fitness, and Vipassana meditation into comprehensive programs.",
      "Thailand consistently delivers exceptional value. A week-long detox or yoga retreat in Thailand often costs less than a single night at comparable European wellness hotels, without compromising on quality, cleanliness, or professionalism.",
    ],
    bestTimeToVisit: "November to February (cool, dry season). The Gulf Coast (Koh Samui) has a different weather pattern, with its best months being January to April. Chiang Mai's burning season (February-April) should be avoided.",
    avgBudget: "$100-$400 per night. Budget retreats start around $50-100/night, mid-range properties run $150-350, and luxury resorts like Kamalaya or Chiva-Som range from $500-$1,500+.",
    topTypes: ["Detox & Cleanse", "Yoga", "Muay Thai Fitness", "Meditation", "Weight Loss", "Spa & Pampering"],
    faqItems: [
      { question: "What is the best island in Thailand for wellness retreats?", answer: "Koh Samui is Thailand's premier wellness island, home to flagship properties like Kamalaya, Absolute Sanctuary, and The Dawn. Phuket offers luxury resort-style wellness at places like Amatara and Thanyapura. Koh Phangan attracts a younger crowd with affordable yoga and detox centers." },
      { question: "How long should a wellness retreat in Thailand be?", answer: "Most Thailand retreats recommend a minimum of 7 days for meaningful results, especially detox programs. However, 3-5 day introductory programs are available. For deep transformation or weight loss goals, 14-21 day programs deliver the best outcomes." },
      { question: "Are Thailand detox retreats medically supervised?", answer: "The best Thailand detox retreats employ licensed medical professionals for intake assessments, monitoring, and program design. Properties like Kamalaya, The Dawn, and RAKxa have full medical teams. Always verify credentials and ask about medical oversight before booking a fasting or detox program." },
      { question: "What makes Thailand wellness retreats different from Bali?", answer: "Thailand excels in structured, results-oriented programs like detox, weight loss, and fitness boot camps. Bali leans more toward spiritual, yoga-centric experiences. Thailand also offers stronger medical tourism integration and generally more professional, resort-quality service standards." },
      { question: "Can I combine a wellness retreat with sightseeing in Thailand?", answer: "Absolutely. Many guests book a 7-14 day retreat and add a few days exploring Bangkok temples, Chiang Mai night markets, or island-hopping in the Andaman Sea. Retreats on Koh Samui and Phuket are well-positioned for easy pre- or post-retreat travel." },
    ],
  },
  "costa-rica": {
    slug: "costa-rica",
    country: "Costa Rica",
    description: [
      "Costa Rica has emerged as the Americas' premier wellness destination, drawing travelers who want transformation without compromising on adventure. The country's commitment to conservation (over 25% of its territory is protected land) creates a natural sanctuary where retreat centers sit amid rainforests, volcanic hot springs, and Pacific surf breaks.",
      "The wellness scene here is distinctly holistic and nature-forward. Costa Rican retreats emphasize connection to the natural world through jungle hikes, waterfall meditation, ocean-based therapy, and farm-to-table nutrition. The 'Pura Vida' philosophy permeates every experience, encouraging a slower, more intentional approach to wellbeing.",
      "From the Nicoya Peninsula (one of the world's five Blue Zones for longevity) to the cloud forests of Monteverde and the Caribbean coast, Costa Rica offers diverse ecosystems and retreat styles. The country is also easily accessible from North America, with direct flights from most major US cities.",
    ],
    bestTimeToVisit: "December to April (dry season). The green season (May-November) offers lower prices and fewer crowds, with mornings typically clear and rain arriving in the afternoon. The Nicoya Peninsula and Guanacaste stay drier year-round.",
    avgBudget: "$150-$500 per night. Budget eco-lodges with yoga start around $80-150, mid-range retreats run $200-450, and luxury properties like Nayara or Kinkara command $500-1,200+.",
    topTypes: ["Yoga", "Adventure Wellness", "Surf & Yoga", "Plant Medicine", "Eco-Wellness", "Meditation"],
    faqItems: [
      { question: "What is the best region in Costa Rica for wellness retreats?", answer: "The Nicoya Peninsula (Nosara and Santa Teresa) is Costa Rica's wellness epicenter, with the highest density of yoga and surf retreats. Arenal offers volcanic hot springs and adventure wellness. The Osa Peninsula provides remote jungle immersion, and the Central Valley has luxury wellness estates near San Jose." },
      { question: "Is Costa Rica a Blue Zone and what does that mean for retreats?", answer: "Yes, the Nicoya Peninsula is one of five globally recognized Blue Zones where people live measurably longer lives. Several retreats in Nosara and Samara draw on Blue Zone principles: plant-forward diets, daily movement, strong community bonds, and purposeful living." },
      { question: "Are ayahuasca and plant medicine retreats legal in Costa Rica?", answer: "Costa Rica occupies a legal gray area for plant medicine. Ayahuasca is not explicitly scheduled, and several retreat centers operate openly with plant medicine ceremonies. However, these are not regulated, so thorough research on facilitator credentials and safety protocols is essential." },
      { question: "What is the best time of year for a surf and yoga retreat in Costa Rica?", answer: "The Pacific coast has consistent surf year-round, but the best conditions are May-November (larger swells) for experienced surfers and December-April (smaller, cleaner waves) for beginners. Yoga is available year-round. Many surf-yoga retreats adjust programming seasonally." },
      { question: "How far in advance should I book a Costa Rica wellness retreat?", answer: "Book 2-3 months ahead for peak season (December-April), especially for popular properties in Nosara. Green season (May-November) often has last-minute availability and discounted rates of 20-40% off peak pricing." },
    ],
  },
  india: {
    slug: "india",
    country: "India",
    description: [
      "India is the birthplace of yoga, Ayurveda, and meditation, making it the most historically significant wellness destination on earth. From the ashrams of Rishikesh along the sacred Ganges to the Ayurvedic hospitals of Kerala, India offers an authenticity and depth of practice that no other country can replicate.",
      "What sets India apart is the seriousness and lineage behind its wellness traditions. A yoga teacher training in Rishikesh connects you to 5,000 years of unbroken practice. An Ayurvedic Panchakarma in Kerala follows protocols refined over millennia. Vipassana meditation centers across the country offer donation-based silent retreats in the tradition of S.N. Goenka.",
      "India also delivers extraordinary value. A month-long yoga immersion in Rishikesh can cost less than a weekend at a European wellness hotel. For travelers willing to embrace a simpler standard of accommodation, India offers the deepest wellness experiences available anywhere at the most accessible price points.",
    ],
    bestTimeToVisit: "October to March (cooler, dry season) for most of India. Kerala is best November to February. Rishikesh is ideal February to May and September to November. The Himalayas are best May to October. Avoid the monsoon (June-September) for most regions.",
    avgBudget: "$30-$250 per night. Ashram-style stays start at $15-40/night, mid-range Ayurvedic retreats run $80-200, and luxury wellness resorts like Ananda in the Himalayas or Vana command $400-1,000+.",
    topTypes: ["Yoga Teacher Training", "Ayurveda", "Vipassana Meditation", "Panchakarma Detox", "Silent Retreat", "Ashram Stay"],
    faqItems: [
      { question: "What is the best city in India for yoga retreats?", answer: "Rishikesh is the undisputed yoga capital of the world, recognized by the Indian government as the 'Yoga Capital.' It offers everything from 200-hour teacher trainings to casual drop-in retreats along the Ganges. Mysore is renowned for Ashtanga yoga, and Goa blends beach culture with yoga retreats." },
      { question: "How authentic are Ayurvedic retreats in India?", answer: "India's Ayurvedic retreats range from government-certified hospitals with licensed Ayurvedic doctors (BAMS degree) to tourist-oriented spa properties. For authentic Panchakarma treatment, seek centers in Kerala with Ayush Ministry certification and resident vaidyas (physicians) with clinical training." },
      { question: "Are Vipassana meditation retreats in India really free?", answer: "Yes, Vipassana centers in the S.N. Goenka tradition operate on a donation basis. The 10-day courses include accommodation, meals, and instruction at no fixed cost. Donations are accepted only from students who have completed at least one course, ensuring the tradition remains accessible to all." },
      { question: "Is India safe for solo female wellness travelers?", answer: "Solo female travelers should exercise standard precautions. Established retreat centers in Rishikesh, Kerala, and Goa are generally safe with supportive communities. Choose reputable, reviewed properties, arrange airport transfers through the retreat, avoid solo travel at night, and dress modestly outside the retreat." },
      { question: "What should I expect from a Panchakarma retreat in India?", answer: "A traditional Panchakarma is a 14-28 day Ayurvedic detoxification program involving oil treatments, herbal medicines, dietary protocols, and therapeutic procedures. Expect a consultation with an Ayurvedic doctor, a customized treatment plan, strict dietary guidelines, and daily treatments lasting 2-4 hours. The process can be physically and emotionally intense." },
    ],
  },
  mexico: {
    slug: "mexico",
    country: "Mexico",
    description: [
      "Mexico's wellness scene is one of the fastest-growing in the world, powered by a unique fusion of indigenous healing traditions, world-class hospitality, and dramatic natural landscapes. From the Riviera Maya's cenote-fed spas to Oaxaca's temazcal sweat lodges and Baja's desert healing centers, Mexico offers wellness experiences deeply rooted in Mesoamerican culture.",
      "The country's proximity to the United States and Canada makes it the most accessible international wellness destination for North American travelers. Direct flights from most US cities keep total travel time under five hours, and the cost of retreat stays is typically 30-50% less than comparable properties in the US or Europe.",
      "Mexico also stands out for its culinary wellness traditions. Mexican cuisine's emphasis on corn, beans, chili, cacao, and medicinal herbs aligns naturally with modern nutritional science. Retreats here often feature chef-driven, locally sourced menus that are as much a highlight as the yoga or spa programs.",
    ],
    bestTimeToVisit: "November to April (dry season). The Pacific coast (Puerto Vallarta, Sayulita) is best December-May. The Riviera Maya is pleasant year-round but peak season is December-April. San Miguel de Allende and Oaxaca are ideal October-May.",
    avgBudget: "$120-$450 per night. Budget retreats start around $60-120, mid-range properties run $200-400, and luxury resort-spa experiences at places like Chable or Habitas command $500-1,500+.",
    topTypes: ["Yoga", "Temazcal Ceremony", "Surf & Wellness", "Plant Medicine", "Spa & Luxury", "Holistic Healing"],
    faqItems: [
      { question: "What are the best destinations for wellness retreats in Mexico?", answer: "Tulum and the Riviera Maya lead for luxury jungle wellness. Oaxaca offers indigenous healing traditions and mezcal culture. San Miguel de Allende has a growing holistic health scene. Puerto Vallarta and Sayulita combine surf with yoga. Baja California Sur (Todos Santos, East Cape) provides desert solitude." },
      { question: "What is a temazcal ceremony and where can I experience one?", answer: "A temazcal is a traditional Mesoamerican sweat lodge ceremony used for purification, healing, and spiritual connection. Led by a shaman or guide, it involves entering a dome-shaped structure heated with volcanic stones. Authentic temazcal experiences are available throughout Mexico, with Oaxaca, Tulum, and San Miguel de Allende being popular locations." },
      { question: "How do Mexico wellness retreats compare to Costa Rica?", answer: "Mexico offers more cultural depth through indigenous healing traditions (temazcal, cacao ceremonies) and superior culinary experiences. Costa Rica excels in eco-adventure wellness and nature immersion. Mexico is generally more accessible and affordable for North American travelers, with more luxury hotel-spa options." },
      { question: "Is it safe to attend a wellness retreat in Mexico?", answer: "Major wellness destinations like Tulum, Oaxaca, San Miguel de Allende, and Puerto Vallarta are well-established tourist areas with good safety records. Choose reputable, reviewed retreat centers, use authorized transport, and follow standard travel precautions. Most retreat centers arrange airport transfers." },
      { question: "What is the best time to book a retreat on the Riviera Maya?", answer: "The Riviera Maya is a year-round destination. Peak season (December-April) offers the best weather but highest prices. Shoulder season (May-June, November) provides good weather with fewer crowds. Summer (July-October) is hotter and wetter but retreat prices drop 20-40%." },
    ],
  },
  portugal: {
    slug: "portugal",
    country: "Portugal",
    description: [
      "Portugal has quietly become Europe's most compelling wellness destination, offering a rare combination of year-round sunshine, Atlantic coastline, affordable luxury, and a laid-back culture that naturally supports wellbeing. The Algarve's dramatic cliff-backed beaches, the Alentejo's rolling cork oak landscapes, and Sintra's mystical forests provide natural backdrops for retreat experiences.",
      "The Portuguese wellness scene is distinctly European in its sophistication but far more accessible than competitors like Switzerland or Scandinavia. Retreat centers here tend toward boutique, design-forward properties that blend contemporary aesthetics with traditional Portuguese architecture and materials.",
      "Surf-and-yoga retreats dominate the coast from Ericeira to the Algarve, while the interior offers silent meditation retreats, Ayurvedic programs, and holistic healing centers. Portugal's position as a hub for digital nomads and creative expatriates has also fostered a growing wellness community, particularly around Lisbon, Sintra, and Lagos.",
    ],
    bestTimeToVisit: "April to October for warm weather. May-June and September-October offer ideal conditions with fewer tourists. The Algarve is pleasant year-round with 300+ days of sunshine. Winter (November-March) is mild by European standards and offers significant retreat discounts.",
    avgBudget: "$120-$400 per night. Budget surf-yoga retreats start around $70-120, mid-range holistic retreats run $200-380, and luxury wellness properties command $400-800+.",
    topTypes: ["Surf & Yoga", "Yoga", "Silent Retreat", "Detox", "Meditation", "Holistic Healing"],
    faqItems: [
      { question: "What is the best region in Portugal for wellness retreats?", answer: "The Algarve (Lagos, Aljezur) dominates with year-round sunshine and dramatic coastal settings. Sintra near Lisbon offers mystical forest retreats. Ericeira is Europe's surf mecca with excellent yoga-surf combos. The Alentejo provides rural solitude and emerging luxury wellness properties." },
      { question: "Why is Portugal becoming so popular for wellness retreats?", answer: "Portugal offers Europe's best value: year-round warm weather, world-class surf, excellent food and wine culture, safety, and a cost of living 40-60% lower than Western European competitors. Its growing digital nomad community has also attracted wellness entrepreneurs and practitioners from around the world." },
      { question: "Are surf and yoga retreats suitable for beginners?", answer: "Absolutely. Most Portuguese surf-yoga retreats cater primarily to beginners and intermediates. Programs typically include daily surf lessons with certified instructors, yoga sessions tailored to complement surfing, and all equipment. No prior experience in either discipline is required." },
      { question: "What is the food like at Portugal wellness retreats?", answer: "Portuguese wellness cuisine draws on the country's exceptional produce, seafood, and Mediterranean diet traditions. Expect locally sourced, seasonal menus with fresh fish, organic vegetables, olive oil, and Portuguese wines. Many retreats offer plant-based options and accommodate dietary restrictions with skill." },
      { question: "How do I get to wellness retreats in the Algarve?", answer: "Fly into Faro Airport (FAO), which receives direct flights from most European cities and seasonal flights from North America. Most retreats arrange airport transfers. Alternatively, fly into Lisbon and take a scenic 2.5-hour drive or train south. Renting a car provides the most flexibility for exploring the region." },
    ],
  },
  spain: {
    slug: "spain",
    country: "Spain",
    description: [
      "Spain offers one of Europe's most diverse wellness landscapes, from the volcanic tranquility of the Canary Islands to the medieval mysticism of Catalonia and the sun-drenched coast of Andalusia. The country's rich cultural heritage, Mediterranean climate, and world-renowned cuisine create a uniquely pleasurable context for wellness travel.",
      "The Spanish approach to wellness balances rigor with joy. Retreats here integrate physical challenge (hiking the Camino de Santiago, open-water swimming) with deep relaxation (thermal spa traditions dating back to Roman times, Mediterranean-diet-driven nutrition programs). Spain's wellness scene avoids the ascetic extremes found in some Asian destinations.",
      "Ibiza has undergone a remarkable transformation from party island to wellness hub, now hosting some of Europe's most innovative retreat centers. The Canary Islands offer year-round warmth and volcanic landscapes. And mainland Spain's sheer geographic diversity, from Pyrenean mountains to Andalusian desert, ensures there's a retreat setting for every preference.",
    ],
    bestTimeToVisit: "April to June and September to October for mainland Spain. The Canary Islands offer year-round warm weather. Ibiza's wellness season runs May to October. Avoid July-August for extreme heat in southern Spain.",
    avgBudget: "$150-$500 per night. Budget yoga retreats start around $80-150, mid-range holistic retreats run $200-450, and luxury finca-style wellness properties command $500-1,200+.",
    topTypes: ["Yoga", "Meditation", "Detox", "Hiking & Wellness", "Spa & Thermal", "Fasting Retreat"],
    faqItems: [
      { question: "What are the best wellness retreat destinations in Spain?", answer: "Ibiza leads with innovative holistic retreat centers like Atzaro and Six Senses. The Canary Islands (Tenerife, Lanzarote) offer year-round warmth. Andalusia has historic thermal spas and rural finca retreats. Catalonia and Mallorca combine Mediterranean coast with mountain retreats. The Basque Country is emerging for gastronomic wellness." },
      { question: "Has Ibiza really transformed into a wellness destination?", answer: "Yes, Ibiza's wellness transformation is genuine. The island now hosts retreat centers, yoga studios, and holistic practitioners year-round. Properties like Atzaro, Six Senses Ibiza, and numerous boutique fincas cater specifically to wellness travelers. The north of the island in particular has a thriving, established wellness community." },
      { question: "What thermal spa traditions exist in Spain?", answer: "Spain has a rich thermal spa (balneario) tradition dating to Roman times. The country has over 100 thermal springs with recognized medicinal properties. Notable wellness spa destinations include Alhama de Granada, Archena (Murcia), Caldas de Reis (Galicia), and numerous Catalan thermal towns. Many modern retreats incorporate these traditional waters." },
      { question: "Can I do a walking or Camino wellness retreat in Spain?", answer: "Yes, several retreats combine sections of the Camino de Santiago with yoga, meditation, and wellness programming. These typically cover shorter stages (10-15km/day) with support vehicles, luxury accommodation, spa treatments, and mindful walking instruction. Available primarily from April to October." },
      { question: "What is the food like at Spanish wellness retreats?", answer: "Spanish wellness cuisine is exceptional, rooted in the Mediterranean diet. Expect cold-pressed olive oils, seasonal produce, fresh seafood, legume-based dishes, and artisan cheeses. Many retreats work with local organic farms. Unlike some destinations, Spanish retreats rarely require giving up wine entirely, offering it mindfully as part of the Mediterranean lifestyle." },
    ],
  },
  peru: {
    slug: "peru",
    country: "Peru",
    description: [
      "Peru occupies a unique position in the global wellness landscape as the epicenter of plant medicine and shamanic healing traditions. The Sacred Valley and Amazon basin draw thousands of seekers annually for ayahuasca ceremonies, San Pedro (Huachuma) journeys, and traditional Andean healing practices that have been maintained by indigenous communities for thousands of years.",
      "Beyond plant medicine, Peru offers varied natural settings for wellness at every altitude. The Sacred Valley near Cusco sits at 2,800 meters, providing a dramatic Andean backdrop for yoga retreats and spiritual journeys. The Amazon rainforest offers jungle immersion and traditional medicine. And the Pacific coast delivers surf-wellness combinations in destinations like Mancora.",
      "Peru's wellness scene is deeply intertwined with indigenous Quechua culture, Inca cosmology, and a living spiritual tradition that connects practitioners to Pachamama (Mother Earth). For travelers seeking inner work beyond the physical, Peru offers experiences that are genuinely transformative in ways few other destinations can match.",
    ],
    bestTimeToVisit: "May to September (dry season) for the Sacred Valley and Cusco. The Amazon is accessible year-round but drier June-October. The coast is sunny December-March. Altitude acclimatization in Cusco (3,400m) requires 2-3 days before intense retreat activities.",
    avgBudget: "$80-$350 per night. Budget retreat centers start around $40-80, mid-range Sacred Valley properties run $150-300, and luxury lodges like Explora or Sol y Luna command $400-900+.",
    topTypes: ["Plant Medicine (Ayahuasca)", "Yoga", "Shamanic Healing", "Meditation", "Adventure Wellness", "Spiritual Retreat"],
    faqItems: [
      { question: "Are ayahuasca retreats legal in Peru?", answer: "Yes, ayahuasca is legal in Peru and was declared a national cultural heritage in 2008. The brew has been used by indigenous Amazonian communities for millennia. Reputable centers operate openly with trained curanderos (shamans). However, quality and safety vary enormously, so thorough research is essential." },
      { question: "How do I choose a safe ayahuasca retreat in Peru?", answer: "Look for centers with experienced, lineage-trained facilitators, medical screening processes, small group sizes, and strong safety protocols. Check recent reviews from multiple sources. Reputable centers will have clear contraindication policies, dietary preparation guidelines, and integration support. Avoid centers that mix ayahuasca with other substances." },
      { question: "What is the Sacred Valley and why is it popular for retreats?", answer: "The Sacred Valley (Valle Sagrado) stretches between Cusco and Machu Picchu along the Urubamba River. At 2,800m elevation, it's lower and warmer than Cusco, making it ideal for extended retreat stays. The valley is steeped in Inca history, surrounded by dramatic Andean peaks, and home to living Quechua communities." },
      { question: "Do I need to worry about altitude sickness at Peru retreats?", answer: "Yes, Cusco sits at 3,400m and the Sacred Valley at 2,800m. Most travelers experience mild altitude effects. Allow 2-3 days for acclimatization before starting intense retreat activities. Stay hydrated, avoid alcohol, eat lightly, and consider coca tea (a local remedy). Some retreats offer altitude-adjustment programs." },
      { question: "What wellness retreats does Peru offer besides plant medicine?", answer: "Peru has a growing yoga retreat scene in the Sacred Valley, adventure wellness options combining trekking with mindfulness, surf-yoga combos on the northern coast, and traditional Andean healing (coca leaf readings, despacho ceremonies, energy work). Cusco and the Sacred Valley also have meditation and breathwork retreat centers." },
    ],
  },
  "sri-lanka": {
    slug: "sri-lanka",
    country: "Sri Lanka",
    description: [
      "Sri Lanka is the world's most authentic destination for Ayurvedic wellness retreats. The island's 3,000-year Ayurvedic tradition is woven into daily life, with Ayurvedic practitioners found in every community and herbal gardens in most backyards. Unlike India's often overwhelming scale, Sri Lanka offers concentrated, accessible Ayurveda in a compact, spectacularly beautiful island setting.",
      "The country's retreat scene spans palm-fringed southern beaches, misty central highlands, and cultural triangle sites in the north-central plains. Properties like Santani, Ulpotha, and Sen Wellness deliver globally recognized wellness experiences that honor traditional practices while meeting international standards of comfort.",
      "Sri Lanka also offers remarkable value and warmth. The island's compact size means you can combine a beach Ayurvedic retreat in Galle with a hill-country yoga experience in Ella, all within a two-week trip. The Sri Lankan people's genuine hospitality adds an emotional dimension to the healing experience that guests consistently cite as transformative.",
    ],
    bestTimeToVisit: "December to March for the south and west coasts. April to September for the east coast. The hill country (Kandy, Ella) is pleasant year-round. Sri Lanka's two monsoon seasons hit opposite coasts, so there's always a dry side of the island.",
    avgBudget: "$60-$300 per night. Budget Ayurvedic guesthouses start around $30-60, mid-range wellness properties run $100-250, and luxury retreats like Santani or Anantara Peace Haven command $300-700+.",
    topTypes: ["Ayurveda", "Panchakarma", "Yoga", "Meditation", "Surf & Wellness", "Nature Immersion"],
    faqItems: [
      { question: "Why is Sri Lanka considered the best destination for Ayurveda?", answer: "Sri Lanka has an unbroken 3,000-year Ayurvedic tradition, government-regulated Ayurvedic education and practice, and an abundance of medicinal herbs grown in its tropical climate. Ayurvedic practitioners in Sri Lanka hold recognized degrees, and the island's smaller scale makes quality control more consistent than in larger countries." },
      { question: "How long should an Ayurvedic retreat in Sri Lanka be?", answer: "For a meaningful Panchakarma (Ayurvedic detox), a minimum of 14 days is recommended, with 21-28 days being ideal. For general Ayurvedic wellness programs including massage, herbal treatments, and dietary guidance, 7-10 days provides a good introduction." },
      { question: "What is the difference between Ayurveda in Sri Lanka vs India?", answer: "Sri Lankan Ayurveda shares the same foundational texts but has developed distinct herbal preparations using the island's unique medicinal plants. Sri Lanka tends to offer a more intimate, less commercialized experience with consistent quality standards. India offers more variety and extreme price ranges, from free ashrams to ultra-luxury resorts." },
      { question: "What should I expect from a Panchakarma retreat in Sri Lanka?", answer: "A traditional Panchakarma begins with a consultation with an Ayurvedic physician who determines your dosha (constitution) and creates a customized treatment plan. Expect daily oil treatments (Abhyanga, Shirodhara), herbal medicines, strict dietary protocols, and therapeutic procedures over 14-28 days. The process can be deeply cleansing both physically and emotionally." },
      { question: "Is Sri Lanka safe for wellness travelers?", answer: "Sri Lanka is generally very safe for tourists, including solo travelers. The island has a well-developed tourism infrastructure. Standard precautions apply: use reputable transport, be aware of rip currents at unguarded beaches, and ensure any Ayurvedic practitioner has proper credentials. Most wellness properties arrange all transfers and logistics." },
    ],
  },
  "united-states": {
    slug: "united-states",
    country: "United States",
    description: [
      "The United States is home to some of the world's most ambitious and scientifically advanced wellness retreats. From the desert canyons of Sedona to the redwood forests of Northern California, American retreat centers push the boundaries of what wellness travel can achieve, integrating advanced functional medicine, biohacking technology, and evidence-based programming.",
      "The US retreat landscape is remarkably diverse. California's Big Sur coast hosts iconic properties like Esalen Institute and Post Ranch Inn. Arizona's Sedona draws seekers for its vortex energy and canyon landscapes. New York's Hudson Valley, the Rocky Mountain West, and Hawaii each offer distinct retreat cultures shaped by their unique environments.",
      "American wellness retreats tend to be the most expensive globally, but they also deliver the most comprehensive, clinically sophisticated programs. Properties like Canyon Ranch, SHA Wellness (opening in the US), and Miraval set global standards for integrative health, fitness programming, and nutritional science. For those seeking measurable health outcomes over spiritual exploration, the US excels.",
    ],
    bestTimeToVisit: "Varies dramatically by region. California and Arizona are best October-May. Hawaii is year-round. The Northeast is best May-October. Colorado and mountain retreats peak in summer (June-September) and ski season (December-March).",
    avgBudget: "$300-$800 per night. Budget retreat centers start around $150-300, mid-range properties run $400-700, and luxury wellness resorts like Canyon Ranch, Sensei, or Cal-a-Vie command $800-2,500+.",
    topTypes: ["Integrative Health", "Spa & Luxury", "Yoga", "Fitness & Weight Loss", "Mental Health", "Meditation"],
    faqItems: [
      { question: "What are the best wellness retreat destinations in the United States?", answer: "Sedona, Arizona leads for spiritual and holistic retreats. Big Sur, California hosts iconic properties like Esalen. Lenox, Massachusetts has Canyon Ranch. Tucson, Arizona has Miraval and Canyon Ranch Tucson. Hawaii offers tropical wellness. The Hudson Valley and Berkshires serve the Northeast market." },
      { question: "How do US wellness retreats compare to international options?", answer: "US retreats are typically 2-5x more expensive than comparable properties in Asia or Latin America. However, they offer stronger medical integration, more evidence-based programming, luxury amenities, and no international travel logistics. For guests prioritizing clinical outcomes and convenience, the premium is justified." },
      { question: "Are there affordable wellness retreats in the United States?", answer: "Yes. Donation-based meditation centers (Spirit Rock, Insight Meditation Society) offer retreats for minimal cost. YMCA and community-based retreat centers provide budget options. Off-peak bookings at mid-range properties can reduce costs 20-40%. The most affordable US retreats are in rural areas of the Southeast and Midwest." },
      { question: "What is Sedona's vortex energy and does it enhance wellness retreats?", answer: "Sedona is believed to have concentrated spots of natural energy called vortexes. While scientifically unverified, many visitors report heightened spiritual experiences at these sites. Several retreat centers incorporate vortex hikes, energy healing, and outdoor meditation at vortex sites into their programs." },
      { question: "Do US wellness retreats accept insurance?", answer: "Most wellness retreats are self-pay. However, some medically focused programs (addiction treatment, mental health intensive outpatient) may qualify for insurance coverage. Canyon Ranch and similar medically integrated properties sometimes work with FSA/HSA accounts for eligible health services. Always verify coverage details directly." },
    ],
  },
  italy: {
    slug: "italy",
    country: "Italy",
    description: [
      "Italy transforms the wellness retreat experience into an art form, blending ancient Roman thermal traditions with Renaissance-era aesthetics and what may be the world's finest cuisine. From Tuscany's rolling vine-covered hills to the Amalfi Coast's clifftop panoramas and the South Tyrolean Alps, Italian retreats offer beauty that is itself therapeutic.",
      "The country's wellness heritage runs deep. Roman bath culture established the blueprint for modern spa resorts, and Italy's thermal towns (Terme) have attracted health-seekers for two millennia. Today, properties like Lefay Resort on Lake Garda, ADLER Spa Resorts in the Dolomites, and boutique agriturismos across Tuscany carry this tradition forward with world-class sophistication.",
      "Italy's greatest wellness asset may be its food. The Mediterranean diet, born here, is the most studied and validated nutritional approach in science. Italian retreat cuisine turns health food into pleasure rather than punishment, with seasonal ingredients, artisan olive oils, and an attitude toward eating that is inherently mindful.",
    ],
    bestTimeToVisit: "April to June and September to October for ideal weather and fewer tourists. Tuscany peaks in June-September. The Dolomites are best June-September for hiking and December-March for ski-wellness. The Amalfi Coast shines April-October.",
    avgBudget: "$200-$600 per night. Budget agriturismo-wellness stays start around $100-200, mid-range spa retreats run $300-550, and luxury properties like Lefay or ADLER command $500-1,200+.",
    topTypes: ["Spa & Thermal", "Yoga", "Culinary Wellness", "Hiking & Wellness", "Detox", "Meditation"],
    faqItems: [
      { question: "What are Italy's best regions for wellness retreats?", answer: "Tuscany leads for rural, holistic wellness with agriturismo retreats. The Dolomites (South Tyrol) offer alpine spa resorts combining mountain air with thermal waters. Lake Garda has luxury wellness resorts. The Amalfi Coast provides Mediterranean settings. Sardinia and Sicily are emerging with boutique wellness properties." },
      { question: "What are Italy's thermal spa traditions?", answer: "Italy has over 300 thermal springs with recognized therapeutic properties. Historic terme towns like Saturnia, Montecatini, Abano, and Ischia have attracted health visitors for centuries. Modern Italian wellness retreats often incorporate these mineral-rich thermal waters into comprehensive programs combining hydrotherapy, mud treatments, and inhalation therapy." },
      { question: "How does the Mediterranean diet feature in Italian wellness retreats?", answer: "The Mediterranean diet is central to Italian wellness programming. Retreats emphasize seasonal, locally sourced ingredients, cold-pressed olive oil, whole grains, legumes, fish, and moderate wine consumption. Many offer cooking classes, farm visits, and nutritional education as part of their wellness programs." },
      { question: "Can I combine a wellness retreat with cultural sightseeing in Italy?", answer: "Italy excels at this combination. Tuscan retreats are within reach of Florence, Siena, and medieval hill towns. Amalfi retreats allow visits to Pompeii and Capri. Dolomite retreats can include Bolzano and Verona. Many Italian wellness properties build cultural excursions into their programming." },
      { question: "What is an agriturismo wellness retreat?", answer: "An agriturismo is a working farm that offers hospitality. Wellness agriturismos combine organic farming, farm-to-table cuisine, yoga, spa treatments, and rural tranquility. They provide a more intimate, authentic Italian experience than resort-style properties, typically at lower prices. Tuscany, Umbria, and Puglia have the strongest agriturismo wellness scenes." },
    ],
  },
  greece: {
    slug: "greece",
    country: "Greece",
    description: [
      "Greece is where Western wellness culture was born. Hippocrates, the father of medicine, established the first principles of holistic health on the island of Kos 2,500 years ago. The ancient Greek concept of 'eudaimonia' (human flourishing) remains the philosophical foundation that modern wellness retreats aspire to worldwide.",
      "Today, Greece's retreat scene capitalizes on the country's extraordinary assets: over 200 inhabited islands offering every landscape from volcanic Santorini to forested Corfu, a Mediterranean climate with 250+ days of sunshine, and a cuisine built on olive oil, fresh seafood, wild greens, and simplicity. Greek wellness properties tend toward boutique, design-conscious spaces that honor the landscape.",
      "The Greek islands of Crete, Mykonos, Santorini, and Ikaria (another Blue Zone) anchor the wellness map, while mainland destinations like the Peloponnese and northern Greece offer mountain retreats and ancient thermal springs. Greece's wellness scene is less developed than Spain or Portugal, which means more authentic, less commercialized experiences for early adopters.",
    ],
    bestTimeToVisit: "May to June and September to October for ideal conditions. July-August brings peak heat and crowds. The Cycladic islands can be windy in August. Crete and the Dodecanese extend the season into November. Winter retreats are rare but available on Crete and the mainland.",
    avgBudget: "$150-$450 per night. Budget island retreats start around $80-150, mid-range holistic properties run $200-400, and luxury wellness hotels command $450-1,000+.",
    topTypes: ["Yoga", "Meditation", "Holistic Healing", "Detox", "Hiking & Wellness", "Blue Zone Longevity"],
    faqItems: [
      { question: "Which Greek island is best for wellness retreats?", answer: "Crete offers the most diverse wellness scene with year-round retreats, Blue Zone longevity experiences, and excellent infrastructure. Mykonos has luxury wellness hotels. Santorini provides dramatic settings for boutique yoga retreats. Ikaria, the Blue Zone island, offers authentic longevity-focused experiences. Corfu and Lefkada have emerging retreat communities." },
      { question: "What is the Blue Zone connection to Greek wellness retreats?", answer: "Ikaria is one of the world's five Blue Zones, where residents regularly live past 90 with low rates of chronic disease. Several retreats on Ikaria and Crete draw on Blue Zone principles: Mediterranean diet, daily movement, strong social bonds, afternoon naps, herbal teas, and a relaxed approach to time." },
      { question: "What makes Greek wellness cuisine special?", answer: "Greek wellness cuisine is rooted in the Mediterranean diet, the most scientifically validated eating pattern. Key elements include extra virgin olive oil, wild greens (horta), fresh seafood, legumes, yogurt, honey, and herbal teas. Island-specific ingredients like Cretan barley rusks, mountain tea, and Ikarian honey add unique nutritional value." },
      { question: "Are there affordable wellness retreats in Greece?", answer: "Yes, Greece offers better value than many European competitors. Budget yoga and meditation retreats on lesser-known islands (Paros, Naxos, Lefkada) start from $80-150/night. Shoulder season (May, October) on popular islands brings 30-40% discounts. Mainland Greece and Crete offer year-round affordable options." },
      { question: "Can I combine island-hopping with wellness retreats in Greece?", answer: "Absolutely. Greece's ferry network makes it easy to combine a week-long retreat on one island with visits to others. Popular combinations include a Crete wellness retreat followed by Santorini exploration, or a yoga retreat in the Cyclades combined with mainland historical sites like Delphi or Meteora." },
    ],
  },
  nepal: {
    slug: "nepal",
    country: "Nepal",
    description: [
      "Nepal offers a wellness experience unlike anywhere else on earth, shaped by its position between the world's highest mountains and the spiritual traditions of both Hinduism and Buddhism. Meditation retreats in the Kathmandu Valley, yoga ashrams in Pokhara, and monastery stays in the Himalayan foothills provide profound inner experiences set against the most dramatic landscape on the planet.",
      "The country's wellness scene is deeply authentic and remarkably affordable. Nepal's Buddhist monasteries have welcomed meditators for centuries, and Vipassana and Tibetan Buddhist meditation retreats here carry a weight of genuine lineage. The Kopan Monastery near Kathmandu and various meditation centers in Lumbini (the birthplace of Buddha) offer structured programs for beginners and experienced practitioners alike.",
      "For those who want to combine physical challenge with spiritual practice, Nepal is unmatched. Trek-and-retreat combinations that pair Himalayan hiking with yoga, meditation, and Ayurvedic recovery offer a holistic experience that addresses body, mind, and spirit simultaneously. The post-trek recovery retreat has become a distinctly Nepalese wellness format.",
    ],
    bestTimeToVisit: "October to November (post-monsoon) for the clearest mountain views and best trekking. March to April brings rhododendron blooms and warm weather. December-February is cold but clear. June-September (monsoon) is wet but some retreats in rain-shadow valleys remain accessible.",
    avgBudget: "$30-$150 per night. Monastery stays and basic meditation retreats start at $15-40, mid-range yoga and wellness centers run $60-150, and the few luxury properties command $200-500+.",
    topTypes: ["Meditation", "Yoga", "Trekking & Wellness", "Buddhist Monastery Stay", "Vipassana", "Ayurveda"],
    faqItems: [
      { question: "What types of meditation retreats are available in Nepal?", answer: "Nepal offers Vipassana (10-day silent courses in the Goenka tradition), Tibetan Buddhist meditation (at monasteries like Kopan, Pharping, and Namo Buddha), mindfulness retreats, and guided meditation programs. Lumbini, the birthplace of Buddha, has meditation centers from various Buddhist traditions. Most are affordable or donation-based." },
      { question: "Can I stay at a Buddhist monastery in Nepal?", answer: "Yes, several monasteries welcome guests for meditation retreats, typically ranging from a few days to several months. Kopan Monastery near Kathmandu is the most well-known, offering structured courses. Expect simple accommodation, vegetarian meals, and a schedule centered on meditation and teachings. Modest donations are expected." },
      { question: "How do I combine trekking with a wellness retreat in Nepal?", answer: "Several operators offer trek-and-retreat packages. A common format is 7-10 days of trekking (Annapurna Base Camp, Langtang Valley, or Everest Base Camp) followed by 3-7 days of yoga, massage, and meditation recovery in Pokhara or Kathmandu. Some luxury lodges along trekking routes now include spa and yoga facilities." },
      { question: "Is Nepal safe for solo wellness travelers?", answer: "Nepal is generally very safe for tourists, including solo travelers. Kathmandu and Pokhara have well-established tourist infrastructures. For trekking, always use registered guides and reputable agencies. The wellness community in Nepal is welcoming. Standard precautions apply: register your trek, carry insurance, and stay hydrated at altitude." },
      { question: "What is the altitude like at Nepal wellness retreats?", answer: "Kathmandu sits at 1,400m and Pokhara at 800m, both comfortable for most people. Monastery retreats in the Kathmandu Valley are at similar altitudes. Trekking retreats can reach 3,500-5,400m. Allow acclimatization time, stay hydrated, and consult your retreat provider about altitude management for any high-altitude programs." },
    ],
  },
  colombia: {
    slug: "colombia",
    country: "Colombia",
    description: [
      "Colombia is Latin America's fastest-rising wellness destination, offering a captivating blend of biodiversity, indigenous healing traditions, and an infectious energy for life that Colombians call 'sabrosura.' From the Caribbean coast of Cartagena to the coffee region's cloud forests and the Amazon basin, Colombia packs extraordinary ecological diversity into retreat experiences.",
      "The country's wellness scene is powered by its natural pharmacy. Colombia is the second most biodiverse country on earth, and its indigenous communities maintain extensive knowledge of medicinal plants. Rapeh, cacao ceremonies, and other traditional plant medicines are increasingly integrated into modern wellness programming at retreat centers throughout the country.",
      "Colombia also offers exceptional value and improving infrastructure. Medellin's 'City of Eternal Spring' climate and modern amenities make it a hub for urban wellness. The coffee region provides rural tranquility. And Colombia's warmth, music, and dance culture inject a joyfulness into the wellness experience that can be hard to find at more austere retreat destinations.",
    ],
    bestTimeToVisit: "December to March and July to August (dry seasons). Medellin's climate is pleasant year-round (spring-like temperatures). The Caribbean coast is best December-April. The coffee region is lush and green year-round with occasional rain. The Amazon is accessible but hot and humid throughout the year.",
    avgBudget: "$60-$250 per night. Budget retreat centers start around $30-60, mid-range properties run $100-250, and luxury wellness hotels in Cartagena or the coffee region command $250-600+.",
    topTypes: ["Yoga", "Plant Medicine", "Meditation", "Adventure Wellness", "Holistic Healing", "Cacao Ceremony"],
    faqItems: [
      { question: "Is Colombia safe for wellness travelers?", answer: "Colombia's safety has improved dramatically. Major tourist destinations (Cartagena, Medellin, the coffee region, Santa Marta) are well-established and generally safe. Choose reputable retreat centers, use registered transport, and follow local guidance. Many retreats arrange all logistics from airport pickup to activities." },
      { question: "What are the best wellness destinations in Colombia?", answer: "Medellin and its surroundings lead for urban-accessible wellness. The coffee region (Eje Cafetero) offers farm-stay retreats amid dramatic landscapes. Santa Marta and Palomino on the Caribbean coast combine beach with jungle healing. Cartagena provides luxury spa experiences. Villa de Leyva has spiritual retreat centers." },
      { question: "What plant medicine traditions are practiced in Colombia?", answer: "Colombia has rich indigenous plant medicine traditions including yage (ayahuasca from the Amazon basin), rapeh (tobacco snuff used ceremonially), mambe (coca leaf preparation), and cacao ceremonies. Several retreat centers work with indigenous taitas (healers). As with all plant medicine, research facilitator credentials and safety protocols thoroughly." },
      { question: "What is the best time to visit the Colombian coffee region?", answer: "The coffee region (Quindio, Risaralda, Caldas) is pleasant year-round with temperatures averaging 18-24C. The driest months are December-February and June-August. Coffee harvest seasons (April-May and October-November) add cultural interest. Rain can occur any time of year but is usually brief." },
      { question: "How accessible are Colombia wellness retreats from the US?", answer: "Very accessible. Direct flights from Miami, Fort Lauderdale, Houston, New York, and other US cities reach Bogota (4-5 hours), Medellin (4 hours), and Cartagena (3.5 hours). No visa is required for US citizens for stays up to 90 days. Colombia is in the Eastern Time zone, eliminating jet lag." },
    ],
  },
  guatemala: {
    slug: "guatemala",
    country: "Guatemala",
    description: [
      "Guatemala has cultivated a deeply authentic wellness scene centered around Lake Atitlan, described by Aldous Huxley as 'the most beautiful lake in the world.' Ringed by three volcanoes and dotted with indigenous Maya villages, Atitlan has attracted spiritual seekers, healers, and retreat entrepreneurs who have built one of Central America's most active wellness communities.",
      "The Guatemalan wellness experience is rooted in Mayan cosmology and ceremony. Cacao ceremonies, temazcal sweat lodges, fire ceremonies, and Mayan astrology readings are woven into retreat programming alongside modern yoga, breathwork, and meditation. This indigenous foundation gives Guatemalan retreats a spiritual depth that feels genuinely ancient rather than manufactured.",
      "Guatemala offers extraordinary value for wellness travelers. A week-long yoga and meditation retreat at Lake Atitlan often costs less than a single night at a luxury US wellness resort. The trade-off is simpler accommodation and infrastructure, but for travelers who prioritize depth of experience over material comfort, Guatemala delivers disproportionate transformation per dollar.",
    ],
    bestTimeToVisit: "November to April (dry season). Lake Atitlan is pleasant year-round with morning clarity and occasional afternoon clouds. Antigua is ideal November-March. The rainy season (May-October) brings afternoon storms but lush green landscapes and fewer tourists.",
    avgBudget: "$40-$180 per night. Budget lakeside retreats start at $25-50, mid-range holistic centers run $80-180, and the few luxury properties around Atitlan command $200-450+.",
    topTypes: ["Yoga", "Cacao Ceremony", "Meditation", "Temazcal", "Plant Medicine", "Spiritual Retreat"],
    faqItems: [
      { question: "Why is Lake Atitlan considered a spiritual destination?", answer: "Lake Atitlan sits in a volcanic caldera surrounded by three volcanoes and 12 indigenous Maya villages. The area has attracted spiritual seekers since the 1960s. Its energy, natural beauty, and living Maya traditions create a uniquely charged environment. Multiple retreat centers around the lake offer yoga, meditation, and ceremonial experiences." },
      { question: "What Maya wellness traditions can I experience in Guatemala?", answer: "Guatemala maintains living Maya spiritual traditions including temazcal (sweat lodge) ceremonies, cacao ceremonies (cacao is sacred in Maya culture), fire ceremonies, Mayan calendar readings, and traditional herbal medicine. Many retreats at Lake Atitlan work with local Maya spiritual guides (Ajq'ij) to offer authentic ceremonial experiences." },
      { question: "Which village at Lake Atitlan is best for wellness retreats?", answer: "San Marcos La Laguna is the undisputed wellness hub of Lake Atitlan, with the highest concentration of yoga studios, retreat centers, and holistic practitioners. San Juan La Laguna offers Maya cultural experiences. Santa Cruz provides quieter, more remote retreat settings. Panajachel is the main transport hub with some urban wellness options." },
      { question: "How do I get to Lake Atitlan for a wellness retreat?", answer: "Fly into Guatemala City (GUA), then take a shuttle (3-3.5 hours) to Panajachel on the lake shore. From Panajachel, water taxis reach lakeside villages in 15-30 minutes. Many retreats arrange shuttle transfers from Guatemala City or Antigua. Some travelers spend a few days in Antigua before heading to the lake." },
      { question: "Is Guatemala safe for wellness travelers?", answer: "Lake Atitlan and Antigua are well-established tourist areas with good safety records. Use authorized transport, travel during daylight, and follow retreat center guidance. Petty theft can occur in tourist areas, so secure valuables. Most retreat centers provide comprehensive arrival instructions and can arrange all transfers." },
    ],
  },
};

/** Lookup helper — returns undefined if no SEO data exists for a country slug */
export function getCountrySEO(slug: string): CountrySEOData | undefined {
  return COUNTRY_SEO[slug];
}

/** All country slugs that have SEO data */
export function getCountrySEOSlugs(): string[] {
  return Object.keys(COUNTRY_SEO);
}
