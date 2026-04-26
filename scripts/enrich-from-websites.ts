/**
 * Enrich retreat listings by scraping their own websites for missing data.
 *
 * Fetches retreats from Supabase that have a website_url but are missing
 * key fields, then extracts data from the retreat's website HTML.
 *
 * Usage:
 *   npx tsx scripts/enrich-from-websites.ts
 *   npx tsx scripts/enrich-from-websites.ts --limit 20
 *   npx tsx scripts/enrich-from-websites.ts --dry-run
 *   npx tsx scripts/enrich-from-websites.ts --limit 5 --dry-run
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=... (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FETCH_TIMEOUT_MS = 10_000;
const BATCH_SIZE = 5; // concurrent fetches per batch
const DELAY_BETWEEN_BATCHES_MS = 2_000;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 50;

// ---------------------------------------------------------------------------
// Known patterns for extraction
// ---------------------------------------------------------------------------

const AMENITY_KEYWORDS = [
  "pool", "infinity pool", "plunge pool", "swimming pool",
  "spa", "sauna", "steam room", "hot tub", "jacuzzi",
  "yoga", "yoga studio", "yoga pavilion", "yoga shala",
  "meditation", "meditation room", "meditation garden",
  "gym", "fitness center", "fitness studio",
  "organic food", "organic garden", "farm-to-table", "organic farm",
  "restaurant", "dining",
  "library", "lounge",
  "tennis", "golf",
  "hiking", "nature trails", "trails",
  "beach", "beachfront", "ocean view", "oceanfront",
  "wifi", "wi-fi",
  "airport transfer", "shuttle",
  "concierge",
  "cooking class", "cooking classes",
  "private villa", "private suite",
  "rooftop", "terrace",
  "garden", "gardens", "tropical garden",
  "lake", "lakefront", "river",
  "mountain view", "mountain",
];

const PROGRAM_TYPE_PATTERNS: [RegExp, string][] = [
  [/\byoga\b/i, "yoga"],
  [/\bmeditation\b/i, "meditation"],
  [/\bmindfulness\b/i, "mindfulness"],
  [/\bdetox\b/i, "detox"],
  [/\bayurveda|ayurvedic\b/i, "ayurveda"],
  [/\bayahuasca\b/i, "ayahuasca"],
  [/\bsilent retreat\b/i, "silent-retreat"],
  [/\bvipassana\b/i, "vipassana"],
  [/\bfasting\b/i, "fasting"],
  [/\bweight loss|weight management\b/i, "weight-management"],
  [/\bfitness retreat|fitness program\b/i, "fitness-retreat"],
  [/\bspa retreat|spa treatment/i, "spa-focused"],
  [/\bdigital detox\b/i, "digital-detox"],
  [/\bstress (recovery|management|reduction)\b/i, "stress-recovery"],
  [/\bburnout\b/i, "burnout-recovery"],
  [/\bsleep\b/i, "sleep-program"],
  [/\bjuice cleanse|juice fast\b/i, "juice-cleanse"],
  [/\bpanchakarma\b/i, "panchakarma"],
  [/\breiki\b/i, "reiki"],
  [/\bsound (healing|bath|therapy)\b/i, "sound-healing"],
  [/\bbreath\s?work\b/i, "breathwork"],
  [/\bplant medicine|psychedelic|psilocybin\b/i, "plant-medicine"],
  [/\bwomen['\u2019]?s retreat|women only\b/i, "womens-retreat"],
  [/\bcouples retreat|couples program\b/i, "couples-retreat"],
  [/\blongevity\b/i, "longevity"],
  [/\banti[- ]?aging\b/i, "anti-aging"],
  [/\bholistic\b/i, "holistic-wellness"],
  [/\btcm|traditional chinese medicine\b/i, "tcm"],
  [/\bnaturopath/i, "naturopathy"],
  [/\bcryotherapy\b/i, "cryotherapy"],
  [/\bhydrotherapy\b/i, "hydrotherapy"],
  [/\biv (therapy|drip|infusion)\b/i, "iv-therapy"],
  [/\bfloat tank|sensory deprivation\b/i, "float-therapy"],
  [/\bequine|horse therapy\b/i, "equine-therapy"],
  [/\bart therapy\b/i, "art-therapy"],
  [/\bsurfing|surf retreat\b/i, "surf-retreat"],
  [/\bhiking|trekking\b/i, "hiking-retreat"],
];

const SOCIAL_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: "instagram", regex: /https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/i },
  { name: "facebook", regex: /https?:\/\/(?:www\.)?facebook\.com\/([a-zA-Z0-9_.]+)/i },
  { name: "twitter", regex: /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/i },
  { name: "youtube", regex: /https?:\/\/(?:www\.)?youtube\.com\/(?:c\/|channel\/|@)([a-zA-Z0-9_-]+)/i },
  { name: "tiktok", regex: /https?:\/\/(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.]+)/i },
];

// ---------------------------------------------------------------------------
// HTML helpers (regex-based, no external DOM parser needed)
// ---------------------------------------------------------------------------

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, " ")
    .replace(/&\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMetaContent(html: string, nameOrProperty: string): string | null {
  // Match both name= and property= attributes, in either order with content=
  const patterns = [
    new RegExp(
      `<meta[^>]*(?:name|property)=["']${nameOrProperty}["'][^>]*content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']${nameOrProperty}["']`,
      "i"
    ),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

// ---------------------------------------------------------------------------
// Extraction logic
// ---------------------------------------------------------------------------

interface ExtractedData {
  description: string | null;
  price_min: number | null;
  price_max: number | null;
  amenities: string[];
  program_types: string[];
  social_links: Record<string, string>;
  instagram_handle: string | null;
}

function extractFromHtml(html: string, retreatName: string): ExtractedData {
  const result: ExtractedData = {
    description: null,
    price_min: null,
    price_max: null,
    amenities: [],
    program_types: [],
    social_links: {},
    instagram_handle: null,
  };

  // --- Description ---
  const ogDesc = extractMetaContent(html, "og:description");
  const metaDesc = extractMetaContent(html, "description");
  const twitterDesc = extractMetaContent(html, "twitter:description");
  // Pick the longest / most useful one
  const descs = [ogDesc, metaDesc, twitterDesc].filter(Boolean) as string[];
  if (descs.length > 0) {
    result.description = descs.sort((a, b) => b.length - a.length)[0];
  }

  // If meta descriptions are too short, try to find main content
  if (!result.description || result.description.length < 50) {
    const mainMatch = html.match(
      /<(?:main|article|section)[^>]*class[^>]*(?:about|intro|hero|welcome|description)[^>]*>([\s\S]*?)<\/(?:main|article|section)>/i
    );
    if (mainMatch) {
      const text = stripTags(mainMatch[1]).slice(0, 500);
      if (text.length > 50) {
        result.description = text;
      }
    }
  }

  // Clean description
  if (result.description) {
    result.description = result.description
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);
  }

  // --- Full text for keyword matching ---
  const bodyText = stripTags(html).toLowerCase();

  // --- Prices ---
  // Match dollar amounts like $199, $1,200, $2500, "from $199"
  const priceMatches = html.match(/\$[\d,]+(?:\.\d{2})?/g);
  if (priceMatches) {
    const prices = priceMatches
      .map((p) => parseFloat(p.replace(/[$,]/g, "")))
      .filter((p) => p >= 50 && p <= 50_000) // reasonable retreat price range
      .sort((a, b) => a - b);
    if (prices.length > 0) {
      result.price_min = prices[0];
      result.price_max = prices[prices.length - 1];
    }
  }

  // --- Amenities ---
  const foundAmenities = new Set<string>();
  for (const keyword of AMENITY_KEYWORDS) {
    const re = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(bodyText)) {
      foundAmenities.add(keyword.toLowerCase());
    }
  }
  result.amenities = Array.from(foundAmenities).sort();

  // --- Program types ---
  const foundPrograms = new Set<string>();
  for (const [regex, tag] of PROGRAM_TYPE_PATTERNS) {
    if (regex.test(bodyText)) {
      foundPrograms.add(tag);
    }
  }
  result.program_types = Array.from(foundPrograms).sort();

  // --- Social media links ---
  for (const { name, regex } of SOCIAL_PATTERNS) {
    const m = html.match(regex);
    if (m) {
      const handle = m[1];
      // Skip generic/share links
      if (
        !["share", "sharer", "intent", "dialog"].some((s) =>
          m[0].toLowerCase().includes(s)
        )
      ) {
        result.social_links[name] = m[0];
        if (name === "instagram") {
          result.instagram_handle = `@${handle}`;
        }
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Fetch with timeout
// ---------------------------------------------------------------------------

async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<{ ok: boolean; status: number; html: string; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    clearTimeout(timer);

    if (!resp.ok) {
      return { ok: false, status: resp.status, html: "", error: `HTTP ${resp.status}` };
    }

    const html = await resp.text();
    return { ok: true, status: resp.status, html };
  } catch (err: any) {
    clearTimeout(timer);
    const msg = err.name === "AbortError" ? "Timeout" : err.message || "Unknown error";
    return { ok: false, status: 0, html: "", error: msg };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface RetreatRow {
  id: string;
  name: string;
  slug: string;
  website_url: string;
  subtitle: string | null;
  price_min_per_night: number | null;
  price_max_per_night: number | null;
  program_types: string[] | null;
  specialty_tags: string[] | null;
  dietary_options: string[] | null;
  instagram_handle: string | null;
}

async function main() {
  console.log("=".repeat(70));
  console.log("  RetreatvVault -- Enrich Retreats from Websites");
  console.log(`  Mode: ${DRY_RUN ? "DRY RUN (no updates)" : "LIVE (will update Supabase)"}`);
  console.log(`  Limit: ${LIMIT}`);
  console.log("=".repeat(70));
  console.log();

  // Fetch retreats that have a website but may be missing data
  const { data: retreats, error } = await supabase
    .from("retreats")
    .select(
      "id, name, slug, website_url, subtitle, price_min_per_night, price_max_per_night, program_types, specialty_tags, dietary_options, instagram_handle"
    )
    .not("website_url", "is", null)
    .neq("website_url", "")
    .order("name")
    .limit(LIMIT * 3); // fetch extra since we filter below

  if (error) {
    console.error("Failed to fetch retreats:", error.message);
    process.exit(1);
  }

  if (!retreats || retreats.length === 0) {
    console.log("No retreats with website URLs found.");
    return;
  }

  // Filter to those missing key data
  const candidates = (retreats as RetreatRow[]).filter((r) => {
    const missingDesc = !r.subtitle || r.subtitle.length < 20;
    const missingPrice = !r.price_min_per_night || r.price_min_per_night === 0;
    const missingPrograms = !r.program_types || r.program_types.length === 0;
    const missingInsta = !r.instagram_handle;
    return missingDesc || missingPrice || missingPrograms || missingInsta;
  });

  const toProcess = candidates.slice(0, LIMIT);
  console.log(
    `Found ${retreats.length} retreats with websites, ${candidates.length} missing data, processing ${toProcess.length}\n`
  );

  // Stats
  let fetched = 0;
  let fetchErrors = 0;
  let updated = 0;
  let skipped = 0;
  const results: Array<{
    name: string;
    url: string;
    extracted: ExtractedData;
    fieldsUpdated: string[];
  }> = [];

  // Process in batches
  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async (retreat) => {
      const url = retreat.website_url.startsWith("http")
        ? retreat.website_url
        : `https://${retreat.website_url}`;

      process.stdout.write(`  Fetching: ${retreat.name} (${url})... `);

      const { ok, html, error: fetchErr } = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);

      if (!ok) {
        console.log(`FAILED: ${fetchErr}`);
        fetchErrors++;
        return;
      }

      fetched++;
      const extracted = extractFromHtml(html, retreat.name);

      // Determine what to update
      const updates: Record<string, any> = {};
      const fieldsUpdated: string[] = [];

      // Description -> subtitle (if missing or too short)
      if (extracted.description && (!retreat.subtitle || retreat.subtitle.length < 20)) {
        updates.subtitle = extracted.description.slice(0, 300);
        fieldsUpdated.push("subtitle");
      }

      // Prices (only if currently missing)
      if (extracted.price_min && (!retreat.price_min_per_night || retreat.price_min_per_night === 0)) {
        updates.price_min_per_night = extracted.price_min;
        fieldsUpdated.push("price_min");
      }
      if (extracted.price_max && (!retreat.price_max_per_night || retreat.price_max_per_night === 0)) {
        updates.price_max_per_night = extracted.price_max;
        fieldsUpdated.push("price_max");
      }

      // Program types (merge with existing)
      if (extracted.program_types.length > 0) {
        const existing = new Set(retreat.program_types || []);
        const newTypes = extracted.program_types.filter((t) => !existing.has(t));
        if (newTypes.length > 0) {
          updates.program_types = [...Array.from(existing), ...newTypes];
          fieldsUpdated.push(`program_types (+${newTypes.length})`);
        }
      }

      // Instagram (if missing)
      if (extracted.instagram_handle && !retreat.instagram_handle) {
        updates.instagram_handle = extracted.instagram_handle;
        fieldsUpdated.push("instagram");
      }

      if (fieldsUpdated.length === 0) {
        console.log("OK (nothing new to update)");
        skipped++;
        return;
      }

      console.log(`OK -> updating: ${fieldsUpdated.join(", ")}`);

      results.push({
        name: retreat.name,
        url,
        extracted,
        fieldsUpdated,
      });

      if (!DRY_RUN) {
        const { error: updateErr } = await supabase
          .from("retreats")
          .update(updates)
          .eq("id", retreat.id);

        if (updateErr) {
          console.error(`    UPDATE ERROR for ${retreat.name}: ${updateErr.message}`);
        } else {
          updated++;
        }
      } else {
        updated++; // count as "would update"
      }
    });

    await Promise.all(promises);

    // Delay between batches to be polite
    if (i + BATCH_SIZE < toProcess.length) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
    }
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log();
  console.log("=".repeat(70));
  console.log("  SUMMARY");
  console.log("=".repeat(70));
  console.log(`  Processed:    ${toProcess.length} retreats`);
  console.log(`  Fetched OK:   ${fetched}`);
  console.log(`  Fetch errors: ${fetchErrors}`);
  console.log(`  Updated:      ${updated}${DRY_RUN ? " (dry run -- no actual changes)" : ""}`);
  console.log(`  Skipped:      ${skipped} (no new data found)`);
  console.log();

  // Write detailed log
  if (results.length > 0) {
    const logPath = "data/enrichment-log.json";
    fs.mkdirSync("data", { recursive: true });
    fs.writeFileSync(
      logPath,
      JSON.stringify(
        {
          run_at: new Date().toISOString(),
          dry_run: DRY_RUN,
          total_processed: toProcess.length,
          total_updated: updated,
          results: results.map((r) => ({
            name: r.name,
            url: r.url,
            fields_updated: r.fieldsUpdated,
            description_found: r.extracted.description?.slice(0, 100) || null,
            price_range: r.extracted.price_min
              ? `$${r.extracted.price_min} - $${r.extracted.price_max}`
              : null,
            amenities_count: r.extracted.amenities.length,
            program_types: r.extracted.program_types,
            social_links: r.extracted.social_links,
          })),
        },
        null,
        2
      )
    );
    console.log(`  Detailed log: ${logPath}`);
  }

  console.log();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
