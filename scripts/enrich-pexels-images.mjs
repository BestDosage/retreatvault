/**
 * enrich-pexels-images.mjs
 *
 * Replace generic region-fallback imagery with real, per-country location photos
 * from Pexels (free, hotlink-legal, images.pexels.com host is whitelisted in
 * src/lib/retreat-images.ts). Strategy = "by country location": fetch one pool of
 * landscape photos per normalized location, then assign to each retreat by a
 * stable slug hash so variety spreads within a country and every retreat is
 * deterministic (no flicker on rebuild).
 *
 * Only touches retreats that lack a copyright-safe image today (raw hero is
 * bookretreats.com / retreat.guru / null). Retreats already on Unsplash/Pexels/
 * local assets are skipped — idempotent and re-runnable.
 *
 * Usage:
 *   node scripts/enrich-pexels-images.mjs --dry            # fetch+map, no writes, print sample
 *   node scripts/enrich-pexels-images.mjs --dry --only="India,Spain"
 *   node scripts/enrich-pexels-images.mjs                  # full run (writes to Supabase)
 *   node scripts/enrich-pexels-images.mjs --limit=200      # cap retreats (testing)
 *
 * Env (.env.local): PEXELS_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// ---- env ----
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const PEXELS_KEY = process.env.PEXELS_API_KEY;
if (!PEXELS_KEY) { console.error("Missing PEXELS_API_KEY in .env.local"); process.exit(1); }
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// ---- args ----
const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");
const LIMIT = Number((argv.find((a) => a.startsWith("--limit=")) || "").split("=")[1]) || Infinity;
const ONLY = ((argv.find((a) => a.startsWith("--only=")) || "").split("=")[1] || "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

// ---- helpers ----
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function hashSlug(slug) { let h = 0; for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0; return Math.abs(h); }

// Continent / macro-region words that show up in the `country` column but aren't
// searchable countries — when we hit one we prefer city, else use the word as-is.
const MACRO = new Set(["europe", "asia", "north america", "south america", "central america",
  "africa", "oceania", "caribbean", "middle east", "scandinavia", "the americas"]);
// Normalize noisy country spellings to a clean Pexels-friendly place name.
const COUNTRY_FIX = {
  us: "United States", usa: "United States", "u.s.": "United States", "u.s.a.": "United States",
  "united states of america": "United States", america: "United States",
  uk: "United Kingdom", "u.k.": "United Kingdom", england: "England countryside",
  britain: "United Kingdom", "great britain": "United Kingdom", scotland: "Scotland highlands",
  bali: "Bali Indonesia", "costa rica": "Costa Rica rainforest", nepal: "Nepal himalaya",
  uae: "United Arab Emirates", "united states minor outlying islands": "tropical island",
};

// Known countries + common retreat destinations. If any appears inside a noisy
// `country` string ("Magnificent Castles and Forts of India" → "India"), we
// canonicalize to it — collapsing hundreds of junk 1-off groups into clean
// country pools and sharpening the Pexels query. Longest match wins so
// "Costa Rica" beats "Rica", "Sri Lanka" beats "Lanka".
const KNOWN_PLACES = [
  "Costa Rica", "Sri Lanka", "South Africa", "New Zealand", "United Kingdom", "United States",
  "United Arab Emirates", "Puerto Rico", "Dominican Republic", "Czech Republic", "Saudi Arabia",
  "India", "Spain", "Portugal", "Mexico", "Greece", "Italy", "Thailand", "Morocco", "Nepal",
  "France", "Canada", "Peru", "Indonesia", "Bali", "Germany", "Switzerland", "Austria", "Ireland",
  "Iceland", "Norway", "Sweden", "Turkey", "Egypt", "Kenya", "Tanzania", "Vietnam", "Cambodia",
  "Japan", "China", "Philippines", "Malaysia", "Guatemala", "Nicaragua", "Panama", "Ecuador",
  "Colombia", "Brazil", "Argentina", "Chile", "Bolivia", "Croatia", "Slovenia", "Hungary",
  "Poland", "Romania", "Bulgaria", "Netherlands", "Belgium", "Denmark", "Finland", "Scotland",
  "Wales", "England", "Australia", "Fiji", "Hawaii", "Bhutan", "Jordan", "Israel", "Lebanon",
  "Cyprus", "Malta", "Mallorca", "Ibiza", "Tenerife", "Tuscany", "Sicily", "Sardinia", "Crete",
  "Rishikesh", "Goa", "Kerala", "Tulum", "Ubud", "Sedona",
];

function extractKnownPlace(str) {
  const s = str.toLowerCase();
  let best = null;
  for (const p of KNOWN_PLACES) if (s.includes(p.toLowerCase()) && (!best || p.length > best.length)) best = p;
  return best;
}

/** Return { key, query } describing the best searchable location for a retreat. */
function normalizeLocation(country, region, city) {
  const c = (country || "").trim();
  const cl = c.toLowerCase();
  const ci = (city || "").trim();
  const rg = (region || "").trim();

  // 1) Pull a clean known place out of the (often noisy) country / city fields.
  let place = extractKnownPlace(c) || extractKnownPlace(ci);
  // 2) Otherwise: a real (non-macro) country string, then city, then region.
  if (!place) {
    if (c && !MACRO.has(cl)) place = COUNTRY_FIX[cl] || c;
    else if (ci) place = ci;
    else if (c) place = c;                                          // bare macro word
    else if (rg && !MACRO.has(rg.toLowerCase())) place = rg;
    else place = "serene nature";
  }
  place = COUNTRY_FIX[place.toLowerCase()] || place;

  const key = place.toLowerCase();
  return { key, place, query: `${place} landscape scenery` };
}

function safe(u) {
  return !!u && (u.startsWith("/") ||
    u.startsWith("https://images.unsplash.com/") ||
    u.startsWith("https://images.pexels.com/"));
}

// ---- Pexels ----
async function pexelsSearch(query) {
  const url = "https://api.pexels.com/v1/search?" + new URLSearchParams({
    query, orientation: "landscape", size: "large", per_page: "80",
  });
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
    if (r.status === 429) { await sleep(2000 * (attempt + 1)); continue; }
    if (!r.ok) { console.warn(`  Pexels ${r.status} for "${query}"`); return []; }
    const j = await r.json();
    return j.photos || [];
  }
  return [];
}

// Build a right-sized, cropped, images.pexels.com URL from a photo's original.
function sizedUrl(photo, w, h) {
  const base = photo.src?.original;
  if (!base) return photo.src?.large2x || photo.src?.large || null;
  return `${base}?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;
}

/** Fetch + cache a pool of hero/gallery URLs for a location key. */
const poolCache = new Map();
async function getPool(loc) {
  if (poolCache.has(loc.key)) return poolCache.get(loc.key);
  let photos = await pexelsSearch(loc.query);
  if (photos.length < 4) photos = photos.concat(await pexelsSearch(loc.place));           // broaden
  if (photos.length < 4) photos = photos.concat(await pexelsSearch(`${loc.place} nature mountains`));
  // de-dup by photo id, drop any non-pexels host defensively
  const seen = new Set();
  const pool = [];
  for (const p of photos) {
    if (seen.has(p.id)) continue; seen.add(p.id);
    const hero = sizedUrl(p, 1200, 900);
    if (hero && hero.startsWith("https://images.pexels.com/")) pool.push(hero);
  }
  poolCache.set(loc.key, pool);
  await sleep(250); // gentle on rate limit
  return pool;
}

// ---- main ----
async function loadRetreats() {
  const PAGE = 1000; let from = 0; const rows = [];
  for (;;) {
    const { data, error } = await sb.from("retreats")
      .select("slug,name,country,region,city,hero_image_url").range(from, from + PAGE - 1);
    if (error) { console.error(error); process.exit(1); }
    rows.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

async function run() {
  const all = await loadRetreats();
  let targets = all.filter((r) => !safe(r.hero_image_url));
  // group by normalized location
  for (const r of targets) r._loc = normalizeLocation(r.country, r.region, r.city);
  if (ONLY.length) targets = targets.filter((r) => ONLY.some((o) => r._loc.key.includes(o)));
  targets = targets.slice(0, LIMIT);

  const byKey = new Map();
  for (const r of targets) { if (!byKey.has(r._loc.key)) byKey.set(r._loc.key, { loc: r._loc, retreats: [] }); byKey.get(r._loc.key).retreats.push(r); }

  console.log(`Retreats needing images: ${targets.length}  |  distinct locations: ${byKey.size}  |  ${DRY ? "DRY RUN" : "WRITING"}`);

  const updates = [];
  let li = 0;
  for (const { loc, retreats } of byKey.values()) {
    li++;
    const pool = await getPool(loc);
    const status = pool.length ? `${pool.length} imgs` : "NO IMAGES → left on fallback";
    console.log(`  [${li}/${byKey.size}] ${loc.place} (${retreats.length} retreats) → ${status}`);
    if (!pool.length) continue;
    for (const r of retreats) {
      const h = hashSlug(r.slug);
      const hero = pool[h % pool.length];
      const gallery = pool.length > 1
        ? [1, 2, 3].map((k) => pool[(h + k) % pool.length]).filter((u) => u !== hero)
        : [];
      updates.push({ slug: r.slug, name: r.name, place: loc.place, hero_image_url: hero, gallery_images: gallery });
    }
  }

  console.log(`\nPrepared ${updates.length} updates.`);
  // sample
  for (const u of updates.slice(0, 8)) console.log(`  · ${u.name} [${u.place}]\n      ${u.hero_image_url}`);

  if (DRY) { console.log("\nDRY RUN — no writes."); return; }

  let ok = 0, fail = 0;
  for (const u of updates) {
    const { error } = await sb.from("retreats")
      .update({ hero_image_url: u.hero_image_url, gallery_images: u.gallery_images })
      .eq("slug", u.slug);
    if (error) { fail++; if (fail <= 5) console.warn(`  write fail ${u.slug}: ${error.message}`); }
    else ok++;
    if ((ok + fail) % 500 === 0) console.log(`  ...written ${ok + fail}/${updates.length}`);
  }
  console.log(`\nDONE. wrote=${ok} failed=${fail}`);
}

run();
