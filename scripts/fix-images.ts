import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Map each slug to a relevant Unsplash image URL
const imageMap: Record<string, string> = {
  // ═══ USA EXPANSION ═══
  "cal-a-vie-health-spa": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&h=800&fit=crop&q=80",
  "golden-door": "https://images.unsplash.com/photo-1545579133-99bb5ab189bd?w=1400&h=800&fit=crop&q=80",
  "miraval-arizona": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1400&h=800&fit=crop&q=80",
  "miraval-austin": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&h=800&fit=crop&q=80",
  "miraval-berkshires": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&h=800&fit=crop&q=80",
  "lake-austin-spa-resort": "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1400&h=800&fit=crop&q=80",
  "sensei-lanai": "https://images.unsplash.com/photo-1542259009477-d625272157b7?w=1400&h=800&fit=crop&q=80",
  "civana-wellness-resort": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1400&h=800&fit=crop&q=80",
  "canyon-ranch-tucson": "https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=1400&h=800&fit=crop&q=80",
  "the-lodge-at-woodloch": "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1400&h=800&fit=crop&q=80",
  "pritikin-longevity-center": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1400&h=800&fit=crop&q=80",
  "hilton-head-health": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&h=800&fit=crop&q=80",
  "red-mountain-resort": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1400&h=800&fit=crop&q=80",
  "kripalu-center": "https://images.unsplash.com/photo-1545389336-cf090694435e?w=1400&h=800&fit=crop&q=80",
  "mii-amo-sedona": "https://images.unsplash.com/photo-1527549993586-dff825b37782?w=1400&h=800&fit=crop&q=80",
  "enchantment-resort-sedona": "https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1400&h=800&fit=crop&q=80",
  "travaasa-hana": "https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?w=1400&h=800&fit=crop&q=80",
  "the-ranch-hudson-valley": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&h=800&fit=crop&q=80",
  "blackberry-mountain": "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=1400&h=800&fit=crop&q=80",
  "carillon-miami-wellness-resort": "https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=1400&h=800&fit=crop&q=80",
  "we-care-spa": "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1400&h=800&fit=crop&q=80",
  "esalen-institute": "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1400&h=800&fit=crop&q=80",
  "omega-institute": "https://images.unsplash.com/photo-1470770841497-7b3200ac8e76?w=1400&h=800&fit=crop&q=80",
  "1440-multiversity": "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1400&h=800&fit=crop&q=80",
  "ojo-santa-fe": "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1400&h=800&fit=crop&q=80",
  "post-ranch-inn": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1400&h=800&fit=crop&q=80",
  "ojai-valley-inn": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&h=800&fit=crop&q=80",
  "sea-island-resort": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1400&h=800&fit=crop&q=80",
  "sundara-inn-spa": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&h=800&fit=crop&q=80",
  "mohonk-mountain-house": "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1400&h=800&fit=crop&q=80",
  "nemacolin": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1400&h=800&fit=crop&q=80",
  "salamander-resort": "https://images.unsplash.com/photo-1553653924-39b70229fb42?w=1400&h=800&fit=crop&q=80",
  "solage-calistoga": "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1400&h=800&fit=crop&q=80",
  "ventana-big-sur": "https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=1400&h=800&fit=crop&q=80",
  "art-of-living-retreat-center": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1400&h=800&fit=crop&q=80",
  "truenorth-health-center": "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=1400&h=800&fit=crop&q=80",
  "the-greenbrier": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&h=800&fit=crop&q=80",
  "aman-new-york": "https://images.unsplash.com/photo-1490122417551-6ee9691429d0?w=1400&h=800&fit=crop&q=80",
  "cliff-house-maine": "https://images.unsplash.com/photo-1500930287596-c1ecaa210c05?w=1400&h=800&fit=crop&q=80",
  "gurneys-montauk": "https://images.unsplash.com/photo-1437719417032-8799c5a34b60?w=1400&h=800&fit=crop&q=80",
  "montage-deer-valley": "https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=1400&h=800&fit=crop&q=80",
  "montage-palmetto-bluff": "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1400&h=800&fit=crop&q=80",
  "kohler-waters-spa": "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1400&h=800&fit=crop&q=80",
  "body-evolve-scottsdale": "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1400&h=800&fit=crop&q=80",
  "terranea-resort": "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=1400&h=800&fit=crop&q=80",
  "emerson-resort-spa": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1400&h=800&fit=crop&q=80",
  "the-boulders-scottsdale": "https://images.unsplash.com/photo-1542401886-65d6c61db217?w=1400&h=800&fit=crop&q=80",
  "meadowood-napa-valley": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1400&h=800&fit=crop&q=80",
  "optimum-health-institute": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1400&h=800&fit=crop&q=80",
  "l-auberge-de-sedona": "https://images.unsplash.com/photo-1482192505345-5655af888cc4?w=1400&h=800&fit=crop&q=80",

  // ═══ EUROPE EXPANSION ═══
  "sha-wellness-clinic": "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1400&h=800&fit=crop&q=80",
  "lanserhof-tegernsee": "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1400&h=800&fit=crop&q=80",
  "lanserhof-lans": "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1400&h=800&fit=crop&q=80",
  "buchinger-wilhelmi": "https://images.unsplash.com/photo-1504418684940-4e96641c5511?w=1400&h=800&fit=crop&q=80",
  "lefay-resort-lago-di-garda": "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=1400&h=800&fit=crop&q=80",
  "como-castello-del-nero": "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1400&h=800&fit=crop&q=80",
  "borgo-egnazia": "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=1400&h=800&fit=crop&q=80",
  "adler-spa-resort-thermae": "https://images.unsplash.com/photo-1499678329028-101435549a4e?w=1400&h=800&fit=crop&q=80",
  "forestis-dolomites": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1400&h=800&fit=crop&q=80",
  "clinique-la-prairie": "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1400&h=800&fit=crop&q=80",
  "burgenstock-resort": "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1400&h=800&fit=crop&q=80",
  "the-dolder-grand": "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1400&h=800&fit=crop&q=80",
  "chenot-palace-weggis": "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=1400&h=800&fit=crop&q=80",
  "mayrlife-altaussee": "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=1400&h=800&fit=crop&q=80",
  "vivamayr-maria-worth": "https://images.unsplash.com/photo-1501621667575-af81f1f0bacc?w=1400&h=800&fit=crop&q=80",
  "preidlhof-south-tyrol": "https://images.unsplash.com/photo-1528127269322-539801943592?w=1400&h=800&fit=crop&q=80",
  "terme-di-saturnia": "https://images.unsplash.com/photo-1515861209959-4183d9dc31f1?w=1400&h=800&fit=crop&q=80",
  "vila-vita-parc": "https://images.unsplash.com/photo-1540202404-1b927e27fa8b?w=1400&h=800&fit=crop&q=80",
  "the-yeatman-porto": "https://images.unsplash.com/photo-1555881400-69b67e71be60?w=1400&h=800&fit=crop&q=80",
  "lily-of-the-valley": "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1400&h=800&fit=crop&q=80",
  "royal-champagne": "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1400&h=800&fit=crop&q=80",
  "les-sources-de-caudalie": "https://images.unsplash.com/photo-1543257580-7269da773bf5?w=1400&h=800&fit=crop&q=80",
  "terre-blanche-provence": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1400&h=800&fit=crop&q=80",
  "aman-le-melezin": "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1400&h=800&fit=crop&q=80",
  "galgorm-spa-golf-resort": "https://images.unsplash.com/photo-1590490360182-c33d5e47b31c?w=1400&h=800&fit=crop&q=80",
  "lucknam-park": "https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=1400&h=800&fit=crop&q=80",
  "chewton-glen": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1400&h=800&fit=crop&q=80",
  "longevity-health-wellness-hotel": "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1400&h=800&fit=crop&q=80",
  "palazzo-fiuggi": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1400&h=800&fit=crop&q=80",
  "kulm-hotel-st-moritz": "https://images.unsplash.com/photo-1520681279154-51b3fb4ea0f7?w=1400&h=800&fit=crop&q=80",

  // ═══ ASIA EXPANSION ═══
  "chiva-som-hua-hin": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&h=800&fit=crop&q=80",
  "ananda-in-the-himalayas": "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=1400&h=800&fit=crop&q=80",
  "como-shambhala-estate": "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1400&h=800&fit=crop&q=80",
  "amanpuri-phuket": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1400&h=800&fit=crop&q=80",
  "four-seasons-sayan-bali": "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=1400&h=800&fit=crop&q=80",
  "the-farm-at-san-benito": "https://images.unsplash.com/photo-1510598969022-c4c6c5d05769?w=1400&h=800&fit=crop&q=80",
  "fivelements-retreat-bali": "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=1400&h=800&fit=crop&q=80",
  "aman-tokyo": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1400&h=800&fit=crop&q=80",
  "hoshinoya-karuizawa": "https://images.unsplash.com/photo-1528164344885-47b1492d2e49?w=1400&h=800&fit=crop&q=80",
  "hoshinoya-bali": "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1400&h=800&fit=crop&q=80",
  "amanemu-japan": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1400&h=800&fit=crop&q=80",
  "song-saa-private-island": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&h=800&fit=crop&q=80",
  "absolute-sanctuary-koh-samui": "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=1400&h=800&fit=crop&q=80",
  "atmantan-wellness-centre": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1400&h=800&fit=crop&q=80",
  "shreyas-retreat-bangalore": "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=1400&h=800&fit=crop&q=80",
  "amanoi-vietnam": "https://images.unsplash.com/photo-1528127269322-539801943592?w=1400&h=800&fit=crop&q=80",
  "joali-being-maldives": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&h=800&fit=crop&q=80",
  "como-uma-canggu": "https://images.unsplash.com/photo-1505881502353-a1986add3762?w=1400&h=800&fit=crop&q=80",
  "mangosteen-ayurveda-phuket": "https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=1400&h=800&fit=crop&q=80",
  "svarga-loka-ubud": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&h=800&fit=crop&q=80",

  // ═══ ORIGINAL RETREATS (fix if they also have /images/ paths) ═══
  "shou-sugi-ban-house": "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1400&h=800&fit=crop&q=80",
  "the-ranch-malibu": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&h=800&fit=crop&q=80",
  "canyon-ranch-lenox": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&h=800&fit=crop&q=80",
  "amangiri": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1400&h=800&fit=crop&q=80",
  "amrit-ocean-resort": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&h=800&fit=crop&q=80",
  "retreat-blue-lagoon": "https://images.unsplash.com/photo-1515861209959-4183d9dc31f1?w=1400&h=800&fit=crop&q=80",
  "six-senses-douro-valley": "https://images.unsplash.com/photo-1543257580-7269da773bf5?w=1400&h=800&fit=crop&q=80",
  "euphoria-retreat": "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1400&h=800&fit=crop&q=80",
  "schloss-elmau": "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1400&h=800&fit=crop&q=80",
  "grail-springs": "https://images.unsplash.com/photo-1470770841497-7b3200ac8e76?w=1400&h=800&fit=crop&q=80",
  "echo-valley-ranch": "https://images.unsplash.com/photo-1553653924-39b70229fb42?w=1400&h=800&fit=crop&q=80",
  "nimmo-bay": "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1400&h=800&fit=crop&q=80",
  "northumberland-heights": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&h=800&fit=crop&q=80",
  "rancho-la-puerta": "https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1400&h=800&fit=crop&q=80",
  "chable-yucatan": "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1400&h=800&fit=crop&q=80",
  "sha-mexico": "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1400&h=800&fit=crop&q=80",
  "banyan-tree-veya": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1400&h=800&fit=crop&q=80",
  "kamalaya-koh-samui": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&h=800&fit=crop&q=80",
  "rakxa-bangkok": "https://images.unsplash.com/photo-1528181304800-259b08848526?w=1400&h=800&fit=crop&q=80",
  "six-senses-vana": "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=1400&h=800&fit=crop&q=80",
};

async function fixImages() {
  console.log("Updating hero images for all retreats...");
  let updated = 0;

  for (const [slug, url] of Object.entries(imageMap)) {
    const { error } = await sb
      .from("retreats")
      .update({ hero_image_url: url })
      .eq("slug", slug);

    if (error) {
      console.error(`  ✗ ${slug}: ${error.message}`);
    } else {
      updated++;
    }
  }

  console.log(`Done! Updated ${updated} retreat images.`);
}

fixImages().catch(console.error);
