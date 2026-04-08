/**
 * Retreat image resolver.
 *
 * The retreats table has a hero_image_url on every row, but most of the 9,409
 * scraped retreats point at secure.retreat.guru — a source that hotlink-blocks,
 * serves low-quality thumbnails, or 404s entirely. The ~120 curated retreats
 * use direct Unsplash URLs which work reliably.
 *
 * Strategy: trust Unsplash URLs as-is. For everything else, fall back to a
 * curated location-relevant Unsplash photo keyed by region (and country where
 * we have coverage). The slug is used as a deterministic hash so the same
 * retreat always gets the same fallback image — no random flicker, and
 * neighboring cards in the grid don't all show the same stock photo.
 */
import type { WellnessRetreat } from "./types";

// Hand-picked Unsplash photo IDs, organized by region and country. Each is a
// wide landscape shot suggestive of wellness/retreat settings in that area.
// Using known-good photo IDs (not the deprecated /source/ endpoint) so the
// URLs survive forever and can be served through next/image → AVIF/WebP.
const FALLBACKS: Record<string, string[]> = {
  // ───────── Asia ─────────
  "Asia:India": [
    "photo-1524492412937-b28074a5d7da", // himalayas
    "photo-1514222709107-a180c68d72b4", // indian mountain temple
    "photo-1544735716-392fe2489ffa", // rishikesh
    "photo-1518002171953-a080ee817e1f", // indian palace
  ],
  "Asia:Thailand": [
    "photo-1528181304800-259b08848526", // thai beach pavilion
    "photo-1552465011-b4e21bf6e79a", // thai tropical resort
    "photo-1540541338287-41700207dee6", // phuket
    "photo-1506665531195-3566af2b4dfa", // thai temple
  ],
  "Asia:Bali": [
    "photo-1537996194471-e657df975ab4", // bali rice terraces
    "photo-1573790387438-4da905039392", // ubud jungle
    "photo-1555400038-63f5ba517a47", // bali beach
  ],
  "Asia:Indonesia": [
    "photo-1537996194471-e657df975ab4",
    "photo-1573790387438-4da905039392",
    "photo-1555400038-63f5ba517a47",
  ],
  Asia: [
    "photo-1506905925346-21bda4d32df4", // generic asian retreat
    "photo-1528127269322-539801943592", // tropical pavilion
    "photo-1540541338287-41700207dee6", // serene asia
    "photo-1520637836862-4d197d17c90a", // asia mountain
  ],

  // ───────── Europe ─────────
  "Europe:Switzerland": [
    "photo-1527668752968-14dc70a27c95", // swiss alps
    "photo-1502786129293-79981df4e689", // alpine lake
    "photo-1506905925346-21bda4d32df4",
  ],
  "Europe:Italy": [
    "photo-1523906834658-6e24ef2386f9", // tuscany
    "photo-1520176128925-16cf2c5f2cc4", // italian villa
    "photo-1529260830199-42c24126f198", // italian coast
  ],
  "Europe:Spain": [
    "photo-1518548419970-58e3b4079ab2", // spanish villa
    "photo-1512453979798-5ea266f8880c", // mallorca
    "photo-1543783207-ec64e4d95325", // ibiza
  ],
  "Europe:Greece": [
    "photo-1533105079780-92b9be482077", // santorini
    "photo-1555993539-1732b0258235", // greek island
    "photo-1504512485720-7d83a16ee930", // greece coast
  ],
  Europe: [
    "photo-1571896349842-33c89424de2d", // european spa
    "photo-1540541338287-41700207dee6",
    "photo-1520637836862-4d197d17c90a",
    "photo-1469854523086-cc02fe5d8800", // european retreat
  ],

  // ───────── USA ─────────
  "USA:Arizona": [
    "photo-1524230572899-a752b3835840", // sedona red rock
    "photo-1533421644343-45b5a2a86cff", // arizona desert
    "photo-1506905925346-21bda4d32df4",
  ],
  "USA:California": [
    "photo-1507525428034-b723cf961d3e", // california coast
    "photo-1519046904884-53103b34b206", // big sur
    "photo-1504893524553-b855bce32c67", // california mountains
  ],
  "USA:Utah": [
    "photo-1533106497176-45ae19e68ba2", // utah canyons
    "photo-1501780327430-c4f8a89e1e07", // moab
    "photo-1459213599465-03ab6a4d5931", // utah desert
  ],
  "USA:Colorado": [
    "photo-1464822759023-fed622ff2c3b", // rocky mountains
    "photo-1578927107994-0ba3e49ef47d", // colorado aspen
    "photo-1441829266145-6d4bfb7a3dcb", // snowy peaks
  ],
  "USA:Hawaii": [
    "photo-1507525428034-b723cf961d3e", // hawaii beach
    "photo-1542259009477-d625272157b7", // kauai
    "photo-1500081254561-e30d6324e27a", // maui
  ],
  USA: [
    "photo-1506905925346-21bda4d32df4",
    "photo-1464822759023-fed622ff2c3b",
    "photo-1519046904884-53103b34b206",
    "photo-1507525428034-b723cf961d3e",
  ],

  // ───────── Canada ─────────
  Canada: [
    "photo-1503614472-8c93d56e92ce", // banff
    "photo-1464822759023-fed622ff2c3b", // rockies
    "photo-1527004013197-933c4bb611b3", // canadian lake
    "photo-1441829266145-6d4bfb7a3dcb",
  ],

  // ───────── Mexico ─────────
  Mexico: [
    "photo-1518638150340-f706e86654de", // tulum
    "photo-1512813498716-3e640fed3f39", // cabo
    "photo-1570737209810-87a8e7245f88", // mexico coast
    "photo-1552074283-25ea5ae9e301", // playa
  ],

  // ───────── Other / fallback ─────────
  Other: [
    "photo-1506905925346-21bda4d32df4",
    "photo-1540541338287-41700207dee6",
    "photo-1520637836862-4d197d17c90a",
    "photo-1528127269322-539801943592",
  ],
};

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickFallback(retreat: WellnessRetreat): string {
  const region = retreat.region || "Other";
  const country = retreat.country || "";
  const keys = [`${region}:${country}`, region, "Other"];
  let pool: string[] = [];
  for (const k of keys) {
    if (FALLBACKS[k]) {
      pool = FALLBACKS[k];
      break;
    }
  }
  if (pool.length === 0) pool = FALLBACKS.Other;
  const id = pool[hashSlug(retreat.slug) % pool.length];
  return `https://images.unsplash.com/${id}?w=1200&h=1500&fit=crop&q=75`;
}

/**
 * Return a reliable image URL for a retreat.
 *
 * - If the retreat's hero_image_url is already a direct Unsplash URL, use it.
 * - Otherwise return a location-keyed Unsplash fallback so every card in the
 *   directory has a relevant-looking image (vs. broken retreat.guru thumbnails).
 */
export function getRetreatImage(retreat: WellnessRetreat): string {
  const hero = retreat.hero_image_url || "";
  if (hero.startsWith("https://images.unsplash.com/")) return hero;
  return pickFallback(retreat);
}
