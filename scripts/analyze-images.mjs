// One-off: quantify hero_image_url coverage & host distribution across retreats.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// load .env.local
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const PAGE = 1000;
let from = 0, rows = [];
for (;;) {
  const { data, error } = await sb
    .from("retreats")
    .select("slug,country,region,hero_image_url")
    .range(from, from + PAGE - 1);
  if (error) { console.error(error); process.exit(1); }
  rows.push(...data);
  if (data.length < PAGE) break;
  from += PAGE;
}

const hostOf = (u) => {
  if (!u) return "(null/empty)";
  if (u.startsWith("/")) return "(local /path)";
  try { return new URL(u).host; } catch { return "(unparseable)"; }
};

const byHost = {}, byCountryMissing = {};
let missing = 0;
for (const r of rows) {
  const h = hostOf(r.hero_image_url);
  byHost[h] = (byHost[h] || 0) + 1;
  const safe = r.hero_image_url && (r.hero_image_url.startsWith("/") ||
    r.hero_image_url.startsWith("https://images.unsplash.com/") ||
    r.hero_image_url.startsWith("https://images.pexels.com/"));
  if (!safe) {
    missing++;
    const c = r.country || "(none)";
    byCountryMissing[c] = (byCountryMissing[c] || 0) + 1;
  }
}

console.log("TOTAL retreats:", rows.length);
console.log("\n=== host distribution (raw hero_image_url) ===");
for (const [h, n] of Object.entries(byHost).sort((a,b)=>b[1]-a[1])) console.log(String(n).padStart(6), h);
console.log("\nNeed-real-image (not unsplash/pexels/local):", missing);
console.log("\n=== top 25 countries needing images ===");
for (const [c, n] of Object.entries(byCountryMissing).sort((a,b)=>b[1]-a[1]).slice(0,25)) console.log(String(n).padStart(6), c);
console.log("\nDistinct countries needing images:", Object.keys(byCountryMissing).length);
