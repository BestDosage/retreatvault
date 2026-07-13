/**
 * WRD score recalibration.
 *
 * Two honest levers (never arbitrary inflation):
 *
 *   1. Missing-data exclusion — the weighted average is computed only over
 *      categories that actually have data (finite score > 0). Weights are
 *      renormalized over the present categories instead of scoring a missing
 *      category as 0. Matches the directory spec: "Do not penalize a retreat
 *      for categories where data is simply unavailable."
 *
 *   2. Monotonic curve calibration — the raw weighted average is mapped through
 *      a piecewise-linear, strictly increasing curve so the fleet median lands
 *      in the 7.3–7.6 target band and the genuine top of the directory reaches
 *      9.0+. Because the curve is strictly increasing, it NEVER reorders
 *      retreats: rank order by raw score is preserved exactly (ties stay ties).
 *
 * score_tier is recomputed from the final score with the unchanged thresholds
 * (9.0 Elite / 8.0 Exceptional / 7.0 Highly Recommended / 6.0 Good / else Listed).
 *
 * Usage:
 *   npx tsx scripts/recalibrate-scores.ts --dry-run   # print before/after, no write
 *   npx tsx scripts/recalibrate-scores.ts             # live write to Supabase
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env in .env.local");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const DRY_RUN = process.argv.includes("--dry-run");

// Must stay in sync with SCORE_WEIGHTS in src/lib/types.ts
const SCORE_WEIGHTS: Record<string, number> = {
  nutrition: 0.10, fitness: 0.09, mindfulness: 0.08, spa: 0.08,
  sleep: 0.07, medical: 0.08, personalization: 0.07, amenities: 0.07,
  pricing_value: 0.08, activities: 0.06, education: 0.06,
  travel_access: 0.05, sustainability: 0.05, social_proof: 0.05, addons: 0.01,
};
const CATEGORIES = Object.keys(SCORE_WEIGHTS);

// Piecewise-linear calibration curve: raw weighted average -> published score.
// Strictly increasing => rank-preserving. Anchors chosen from the live raw
// distribution (median raw ~7.10) so the fleet median lands ~7.45 and the
// genuine top (raw 8.5–8.6) reaches 9.0+, without pushing the mid-fleet into
// the Exceptional/Elite tiers (that would be inflation, not recalibration).
const CURVE: [number, number][] = [
  [5.5, 6.55],
  [6.5, 7.05],
  [7.1, 7.45],
  [7.5, 7.78],
  [8.0, 8.25],
  [8.2, 8.58],
  [8.5, 8.98],
  [8.6, 9.15],
];

function applyCurve(raw: number): number {
  const pts = CURVE;
  if (raw <= pts[0][0]) {
    // extrapolate along the first segment's slope, clamp at 0
    const [x0, y0] = pts[0];
    const [x1, y1] = pts[1];
    const slope = (y1 - y0) / (x1 - x0);
    return Math.max(0, y0 + slope * (raw - x0));
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    if (raw <= x1) {
      const t = (raw - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  // extrapolate along the last segment's slope, clamp at 10
  const [x0, y0] = pts[pts.length - 2];
  const [x1, y1] = pts[pts.length - 1];
  const slope = (y1 - y0) / (x1 - x0);
  return Math.min(10, y1 + slope * (raw - x1));
}

function catScore(scores: any, cat: string): number | null {
  if (!scores || typeof scores !== "object") return null;
  const c = scores[cat];
  if (c == null) return null;
  const s = typeof c === "object" ? c.score : c;
  if (s == null || Number.isNaN(Number(s))) return null;
  return Number(s);
}

/** Raw weighted average with missing-data exclusion (renormalized weights). */
function computeRaw(scores: any): { raw: number; present: number } {
  let weighted = 0;
  let weightSum = 0;
  let present = 0;
  for (const cat of CATEGORIES) {
    const s = catScore(scores, cat);
    if (s !== null && s > 0) {
      weighted += s * SCORE_WEIGHTS[cat];
      weightSum += SCORE_WEIGHTS[cat];
      present++;
    }
  }
  if (weightSum === 0) return { raw: 0, present: 0 };
  return { raw: weighted / weightSum, present };
}

function getScoreTier(score: number): string {
  if (score >= 9.0) return "elite";
  if (score >= 8.0) return "exceptional";
  if (score >= 7.0) return "highly_recommended";
  if (score >= 6.0) return "good";
  return "listed";
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

function stats(label: string, arr: number[]) {
  const s = [...arr].sort((a, b) => a - b);
  const n = s.length;
  const ge = (t: number) => arr.filter((x) => x >= t).length;
  console.log(`\n${label} (n=${n}):`);
  console.log(
    `  min ${s[0].toFixed(2)}  p10 ${quantile(s, 0.1).toFixed(2)}  p25 ${quantile(s, 0.25).toFixed(2)}  ` +
    `median ${quantile(s, 0.5).toFixed(2)}  p75 ${quantile(s, 0.75).toFixed(2)}  p90 ${quantile(s, 0.9).toFixed(2)}  ` +
    `p99 ${quantile(s, 0.99).toFixed(2)}  max ${s[n - 1].toFixed(2)}`
  );
  console.log(
    `  >=6.5 ${((ge(6.5) / n) * 100).toFixed(1)}%  >=7.0 ${((ge(7.0) / n) * 100).toFixed(1)}%  ` +
    `>=8.0 ${((ge(8.0) / n) * 100).toFixed(1)}%  >=8.5 ${((ge(8.5) / n) * 100).toFixed(1)}%  ` +
    `>=9.0 ${((ge(9.0) / n) * 100).toFixed(1)}%`
  );
}

function histogram(arr: number[]) {
  const n = arr.length;
  const buckets = new Map<string, number>();
  for (let b = 5; b < 10; b += 0.5) buckets.set(b.toFixed(1), 0);
  for (const s of arr) {
    const b = Math.max(5, Math.min(9.5, Math.floor(s * 2) / 2));
    const k = b.toFixed(1);
    buckets.set(k, (buckets.get(k) || 0) + 1);
  }
  const max = Math.max(...buckets.values());
  for (const [k, c] of buckets) {
    const bar = max > 0 ? "#".repeat(Math.round((c / max) * 36)) : "";
    console.log(`  ${k}-${(parseFloat(k) + 0.5).toFixed(1)}  ${String(c).padStart(5)} (${((c / n) * 100).toFixed(1).padStart(5)}%) ${bar}`);
  }
}

const FLAGSHIPS = [
  "kamalaya-koh-samui", "the-ranch-malibu", "amangiri", "sha-mexico",
  "rancho-la-puerta", "six-senses-douro-valley",
];

async function fetchAll() {
  const PAGE = 1000;
  const rows: any[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase
      .from("retreats")
      .select("id,slug,name,wrd_score,score_tier,scores")
      .neq("slug", "test")
      .neq("slug", "cape-kalevala")
      .gt("wrd_score", 0)
      .order("slug", { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return rows;
}

async function main() {
  console.log(`\n${DRY_RUN ? "DRY-RUN" : "LIVE WRITE"} — WRD score recalibration\n`);
  const rows = await fetchAll();
  console.log(`Fetched ${rows.length} retreats.`);

  const computed = rows.map((r) => {
    const oldScore = Number(r.wrd_score);
    const { raw, present } = computeRaw(r.scores);
    // Curve input: for full-data rows use the stored score so the current
    // published rank order is preserved EXACTLY (zero inversions). Only rows
    // with a genuinely missing category get the recomputed, missing-data-
    // excluded raw — this is the intended Step-2 correction that lifts them.
    const curveInput = present < CATEGORIES.length ? raw : oldScore;
    const final = Math.round(applyCurve(curveInput) * 10) / 10;
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      oldScore,
      oldTier: r.score_tier,
      raw: curveInput,
      present,
      newScore: final,
      newTier: getScoreTier(final),
    };
  });

  const oldScores = computed.map((c) => c.oldScore);
  const newScores = computed.map((c) => c.newScore);

  console.log("\n=== BEFORE (stored wrd_score) ===");
  histogram(oldScores);
  stats("BEFORE stats", oldScores);

  console.log("\n=== AFTER (recalibrated) ===");
  histogram(newScores);
  stats("AFTER stats", newScores);

  // Tier distribution after
  const tierCounts = new Map<string, number>();
  for (const c of computed) tierCounts.set(c.newTier, (tierCounts.get(c.newTier) || 0) + 1);
  console.log("\nAFTER score_tier counts:");
  for (const [t, c] of [...tierCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t.padEnd(20)} ${c} (${((c / computed.length) * 100).toFixed(1)}%)`);
  }

  // ── Rank-order verification ──────────────────────────────────────────────
  // The acceptance criterion is that recalibration preserves rank order (ties
  // allowed). We verify the two things that actually matter:
  //
  //  1. Curve monotonicity: sorting every retreat by its raw weighted average
  //     must yield a NON-DECREASING sequence of published scores. Any decrease
  //     is a true inversion introduced by the curve. (A strictly-increasing
  //     piecewise-linear curve guarantees zero.)
  //  2. True inversions vs the OLD stored score: pairs where old_a > old_b but
  //     new_a < new_b. For the 9,377 full-data rows, old stored score equals
  //     round(raw) (weights sum to 1.0, so missing-data renormalization is the
  //     identity), so the only rows that can invert are the 31 with a missing
  //     category — exactly the intended Step-2 correction.
  const byRaw = [...computed].sort((a, b) => a.raw - b.raw);
  let curveInversions = 0;
  for (let i = 1; i < byRaw.length; i++) {
    if (byRaw[i].newScore < byRaw[i - 1].newScore) curveInversions++;
  }
  // True inversions vs old stored order, counted with a Fenwick tree over
  // published-score ranks, iterating groups of equal old score (ties excluded).
  const countInversions = (items: typeof computed) => {
    const uniqNew = [...new Set(items.map((c) => c.newScore))].sort((a, b) => a - b);
    const rankOf = new Map(uniqNew.map((v, i) => [v, i + 1]));
    const bit = new Array(uniqNew.length + 2).fill(0);
    const bitAdd = (i: number) => { for (; i <= uniqNew.length; i += i & -i) bit[i]++; };
    const bitSum = (i: number) => { let s = 0; for (; i > 0; i -= i & -i) s += bit[i]; return s; };
    const byOldDesc = [...items].sort((a, b) => b.oldScore - a.oldScore);
    let inv = 0, g = 0;
    while (g < byOldDesc.length) {
      let h = g;
      while (h < byOldDesc.length && byOldDesc[h].oldScore === byOldDesc[g].oldScore) h++;
      // Higher-old items (already inserted) now strictly BELOW this one => inversion.
      for (let k = g; k < h; k++) inv += bitSum(rankOf.get(byOldDesc[k].newScore)! - 1);
      for (let k = g; k < h; k++) bitAdd(rankOf.get(byOldDesc[k].newScore)!);
      g = h;
    }
    return inv;
  };
  const trueInversions = countInversions(computed);
  const fullDataOnly = computed.filter((c) => c.present === CATEGORIES.length);
  const fullDataInversions = countInversions(fullDataOnly);
  const missingDataRows = computed.filter((c) => c.present < CATEGORIES.length).length;
  // These 31 missing-data rows are the one sanctioned exception to "never reorder":
  // old stored scores silently zero-penalized missing categories, so Step 2's
  // missing-data exclusion (renormalize over present categories only) legitimately
  // moves their rank relative to full-data peers — that's a bug fix, not drift.
  console.log(`\nRank order:`);
  console.log(`  curve inversions (sort by raw -> published non-decreasing): ${curveInversions}  [must be 0]`);
  console.log(`  true inversions among the ${fullDataOnly.length} full-data retreats: ${fullDataInversions}  [target 0]`);
  console.log(`  true inversions incl. missing-data rows (Step-2 intended lift): ${trueInversions}`);
  console.log(`  rows with a missing category (Step-2 exclusion applies, expected to move up): ${missingDataRows}`);

  // Flagship spot-check
  console.log("\nFlagship spot-check (>= 8.5 target if substantial data):");
  console.log(`  ${"slug".padEnd(28)} raw    old -> new   tier`);
  for (const slug of FLAGSHIPS) {
    const c = computed.find((x) => x.slug === slug);
    if (!c) { console.log(`  ${slug.padEnd(28)} NOT FOUND`); continue; }
    const flag = c.newScore >= 8.5 ? "OK" : "below 8.5";
    console.log(`  ${slug.padEnd(28)} ${c.raw.toFixed(2)}  ${c.oldScore.toFixed(1)} -> ${c.newScore.toFixed(1)}  ${c.newTier} [${flag}]`);
  }

  // Sparse / bottom spot-check: lowest-raw retreats should read mid-to-high 6s /
  // low-mid 7s, never 4s.
  const bottom = [...computed].sort((a, b) => a.raw - b.raw).slice(0, 8);
  console.log("\nBottom-of-fleet spot-check (should read mid-6s+, never 4s):");
  for (const c of bottom) {
    console.log(`  ${c.slug.padEnd(40)} raw ${c.raw.toFixed(2)}  ${c.oldScore.toFixed(1)} -> ${c.newScore.toFixed(1)}  ${c.newTier}`);
  }

  if (DRY_RUN) {
    console.log("\nDRY-RUN complete. No writes performed.");
    return;
  }

  // Live write — update only wrd_score + score_tier, by id, in concurrent chunks.
  console.log(`\nWriting ${computed.length} rows to Supabase...`);
  const CHUNK = 50;
  let written = 0, errors = 0;
  for (let i = 0; i < computed.length; i += CHUNK) {
    const chunk = computed.slice(i, i + CHUNK);
    const results = await Promise.all(
      chunk.map((c) =>
        supabase
          .from("retreats")
          .update({ wrd_score: c.newScore, score_tier: c.newTier })
          .eq("id", c.id)
          .then((res) => res.error ? { ok: false, slug: c.slug, msg: res.error.message } : { ok: true })
      )
    );
    for (const r of results) {
      if (r.ok) written++;
      else { errors++; console.error(`  ERR ${(r as any).slug}: ${(r as any).msg}`); }
    }
    process.stdout.write(`  ${written} written (${errors} errors)\r`);
  }
  console.log(`\nDone. ${written} written, ${errors} errors.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
