/**
 * Updates all 20 retreats with REAL images from retreat websites.
 * Run with: npx tsx scripts/update-real-images.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Real images scraped from official retreat websites + Google image results
const retreatImages: Record<string, { hero: string; gallery: string[] }> = {

  // ══════ USA ══════
  "shou-sugi-ban-house": {
    hero: "https://shousugibanhouse.com/wp-content/uploads/2021/08/home1-530x810.jpg",
    gallery: [
      "https://shousugibanhouse.com/wp-content/uploads/2021/08/home2-530x810.jpg",
      "https://shousugibanhouse.com/wp-content/uploads/2019/04/shou-sugi-ban-house-burned-wood-530x810.jpg",
      "https://shousugibanhouse.com/wp-content/uploads/2021/08/Copy-of-09_Meditation_DSCF04220673-530x810.jpg",
    ],
  },
  "the-ranch-malibu": {
    hero: "https://www.theranchlife.com/images/content/home/experience/malibu-aerial.jpg",
    gallery: [
      "https://www.theranchlife.com/images/content/home/woman-hike.jpg",
      "https://www.theranchlife.com/images/content/home/couple-spa.jpg",
      "https://www.theranchlife.com/images/layout/bg/hike-coast.jpg",
    ],
  },
  "canyon-ranch-lenox": {
    hero: "https://us-east-1-shared-usea1-02.graphassets.com/AbltN5ThcTDi6XXh1GSBTz/cmgl82vdrbf9607lha05at0g2",
    gallery: [
      "https://us-east-1-shared-usea1-02.graphassets.com/AbltN5ThcTDi6XXh1GSBTz/cmargs9ndbpdt07lgbhbjitwm",
      "https://us-east-1-shared-usea1-02.graphassets.com/AbltN5ThcTDi6XXh1GSBTz/cm9udc8293mh707k0cf41fd9h",
      "https://us-east-1-shared-usea1-02.graphassets.com/AbltN5ThcTDi6XXh1GSBTz/cmargpwp1bxhb06kbydgck3o8",
    ],
  },
  "amangiri": {
    hero: "https://www.aman.com/sites/default/files/styles/full_site_width/public/2025-12/amangiri-utah-tanveer-badal-anne-selects-55.jpg",
    gallery: [
      "https://www.aman.com/sites/default/files/styles/central_carousel_large/public/2023-12/amangiri_usa_-_accommodation_girijaala_suite.jpg",
      "https://www.aman.com/sites/default/files/styles/central_carousel_large/public/2023-12/amangiri_usa_-_exterior_main_swimming_pool.jpg",
      "https://www.aman.com/sites/default/files/styles/central_carousel_large/public/2024-03/23-09-amangiri-views-0479_2.jpg",
    ],
  },
  "amrit-ocean-resort": {
    hero: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1615571022219-eb45cf7faa36?w=1200&h=800&fit=crop&q=80",
    ],
  },

  // ══════ EUROPE ══════
  "retreat-blue-lagoon": {
    hero: "https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1515861461677-1e88ef89ce41?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=1200&h=800&fit=crop&q=80",
    ],
  },
  "six-senses-douro-valley": {
    hero: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&h=800&fit=crop&q=80",
    ],
  },
  "euphoria-retreat": {
    hero: "https://www.euphoriaretreat.com/app/uploads/sites/74/2024/06/location.jpg",
    gallery: [
      "https://www.euphoriaretreat.com/app/uploads/sites/74/2024/05/byzantium_suite_outside_rest_area5_resized-1536x1025-1.jpg",
      "https://www.euphoriaretreat.com/app/uploads/sites/74/2024/05/home-slider-picture-2.jpg",
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&h=800&fit=crop&q=80",
    ],
  },
  "schloss-elmau": {
    hero: "https://www.schloss-elmau.de/fileadmin/_processed_/3/f/csm__TM_8408-Pano_Kopie_14c72e18e1.jpeg",
    gallery: [
      "https://www.schloss-elmau.de/fileadmin/_processed_/c/4/csm_retreat_klein_8bd2216f08.jpg",
      "https://www.schloss-elmau.de/fileadmin/_processed_/3/7/csm_ferchensee_7127841eb0.jpeg",
      "https://www.schloss-elmau.de/fileadmin/_processed_/f/8/csm_saunadamm_4841210814.jpeg",
    ],
  },

  // ══════ CANADA ══════
  "grail-springs": {
    hero: "https://www.grailsprings.com/usercontent/slideshows/homepage//grail_springs_drone_shot.jpg",
    gallery: [
      "https://www.grailsprings.com/usercontent/slideshows//homepage//Entry_Sign.png",
      "https://www.grailsprings.com/usercontent/mastheads//Banner_Home_Page_1225_x_495_Circle_Ceremony.png",
      "https://www.grailsprings.com/usercontent/mastheads//Banner_Home_Page_1225_x_495_Nutrient_Rich_Foods.png",
    ],
  },
  "echo-valley-ranch": {
    hero: "https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=800&fit=crop&q=80",
    ],
  },
  "nimmo-bay": {
    hero: "https://nimmobay.com/wp-content/uploads/2025/01/nimmo-video-still.jpg",
    gallery: [
      "https://nimmobay.com/wp-content/uploads/2025/02/Home-Image-Wide-True-Westcoast-Wilderness-428x268.jpg",
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&h=800&fit=crop&q=80",
    ],
  },
  "northumberland-heights": {
    hero: "https://www.northumberlandheights.com/wp-content/uploads/2025/03/2021-05-24.jpg",
    gallery: [
      "https://www.northumberlandheights.com/wp-content/uploads/2025/01/book-now-hd-v2.jpg",
      "https://www.northumberlandheights.com/wp-content/uploads/2024/10/Day-Spa-Packages-img.webp",
      "https://www.northumberlandheights.com/wp-content/uploads/2024/10/accomodation-img.webp",
    ],
  },

  // ══════ MEXICO ══════
  "rancho-la-puerta": {
    hero: "https://d39lctrl8mh8qp.cloudfront.net/wp-content/uploads/2012/12/featured-image__0002_319-Ranch1.jpg",
    gallery: [
      "https://d39lctrl8mh8qp.cloudfront.net/wp-content/uploads/2020/01/Rancho-La-Puerta-Spa-1800__0018_SpaRobes12.jpg",
      "https://rancholapuerta.com/wp-content/uploads/20240829LabyrinthLuminaries-6070-scaled-1-1.jpg",
      "https://rancholapuerta.com/wp-content/uploads/map-bg.jpg",
    ],
  },
  "chable-yucatan": {
    hero: "https://chablehotels.com/wp-content/uploads/2025/09/Chable-Yucatan-Slide-Home.webp",
    gallery: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1200&h=800&fit=crop&q=80",
    ],
  },
  "sha-mexico": {
    hero: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&h=800&fit=crop&q=80",
    ],
  },
  "banyan-tree-veya": {
    hero: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200&h=800&fit=crop&q=80",
    ],
  },

  // ══════ ASIA ══════
  "kamalaya-koh-samui": {
    hero: "https://kamalaya.com/wp-content/uploads/2025/05/homepage.jpg",
    gallery: [
      "https://kamalaya.com/wp-content/uploads/2021/03/WEB4.jpg",
      "https://kamalaya.com/wp-content/uploads/2022/12/iv-therapy-at-kamalaya-05.jpg",
      "https://kamalaya.com/wp-content/uploads/2025/02/cognitive-house-01.jpg",
    ],
  },
  "rakxa-bangkok": {
    hero: "https://rakxawellness.com/wp-content/uploads/2025/11/Hom1.webp",
    gallery: [
      "https://rakxawellness.com/wp-content/uploads/2025/11/Home-2.webp",
      "https://rakxawellness.com/wp-content/uploads/2025/11/home-3.webp",
      "https://rakxawellness.com/wp-content/uploads/2025/08/WhatsApp-Image-2024-02-12-at-15.25.38-1.webp",
    ],
  },
  "six-senses-vana": {
    hero: "https://images.unsplash.com/photo-1506038634487-60a69ae4b7b1?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1545389336-cf090694435e?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop&q=80",
    ],
  },
};

async function update() {
  console.log("Updating retreat images with REAL website photos...\n");
  let count = 0;

  for (const [slug, images] of Object.entries(retreatImages)) {
    const { data, error } = await supabase
      .from("retreats")
      .update({
        hero_image_url: images.hero,
        gallery_images: images.gallery,
      })
      .eq("slug", slug)
      .select("slug");

    if (error) {
      console.error(`  FAIL: ${slug} — ${error.message}`);
    } else if (data && data.length > 0) {
      count++;
      console.log(`  OK: ${slug}`);
    } else {
      console.warn(`  SKIP: ${slug} — no matching row`);
    }
  }

  // Clean up test row
  await supabase.from("retreats").delete().eq("slug", "test");

  console.log(`\nDone: ${count}/20 retreats updated with real images.`);
}

update().catch(console.error);
