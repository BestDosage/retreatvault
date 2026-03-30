/**
 * Updates all 20 retreats with curated high-quality Unsplash images.
 * Run with: npx tsx scripts/update-images.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Curated Unsplash images matched to each retreat's location and aesthetic
// Using Unsplash Source URLs (free, no API key needed, high quality)
const retreatImages: Record<string, { hero: string; gallery: string[] }> = {
  "shou-sugi-ban-house": {
    hero: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1545579133-99bb5ab189bd?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&h=800&fit=crop&q=80",
    ],
  },
  "the-ranch-malibu": {
    hero: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=800&fit=crop&q=80",
    ],
  },
  "canyon-ranch-lenox": {
    hero: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop&q=80",
    ],
  },
  "amangiri": {
    hero: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&h=800&fit=crop&q=80",
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
  "retreat-blue-lagoon": {
    hero: "https://images.unsplash.com/photo-1515861461677-1e88ef89ce41?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&h=800&fit=crop&q=80",
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
    hero: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&h=800&fit=crop&q=80",
    ],
  },
  "schloss-elmau": {
    hero: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1455587734955-081b22074882?w=1200&h=800&fit=crop&q=80",
    ],
  },
  "grail-springs": {
    hero: "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1439853949127-fa647821eba0?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=800&fit=crop&q=80",
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
    hero: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=1200&h=800&fit=crop&q=80",
    ],
  },
  "northumberland-heights": {
    hero: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=800&fit=crop&q=80",
    ],
  },
  "rancho-la-puerta": {
    hero: "https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=1200&h=800&fit=crop&q=80",
    ],
  },
  "chable-yucatan": {
    hero: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop&q=80",
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
  "kamalaya-koh-samui": {
    hero: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1540202404-a2f29016b523?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=800&fit=crop&q=80",
    ],
  },
  "rakxa-bangkok": {
    hero: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=1400&h=800&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=1200&h=800&fit=crop&q=80",
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

async function updateImages() {
  console.log("Updating retreat images...\n");
  let count = 0;

  for (const [slug, images] of Object.entries(retreatImages)) {
    const { error } = await supabase
      .from("retreats")
      .update({
        hero_image_url: images.hero,
        gallery_images: images.gallery,
      })
      .eq("slug", slug);

    if (error) {
      console.error(`  FAIL: ${slug} — ${error.message}`);
    } else {
      count++;
      console.log(`  OK: ${slug} — hero + ${images.gallery.length} gallery images`);
    }
  }

  console.log(`\nDone: ${count}/20 retreats updated with images.`);
}

updateImages().catch(console.error);
