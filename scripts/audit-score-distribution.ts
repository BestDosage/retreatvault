/**
 * Audit current WRD score distribution.
 *
 * Reads every retreat from Supabase and reports:
 *   - histogram of wrd_score in 0.5 buckets
 *   - median, p10, p25, p75, p90, mean
 *   - % of fleet >= 7.0, >= 8.0, >= 9.0
 *   - score_tier counts
 *   - per-category null/zero/present rates (a category counts as "present"
 *     when its stored score is a finite number > 0)
 *   - average number of present categories per retreat
 *
 * Usage: npx tsx scripts/audit-score-distribution.ts
 *
 * Read-only. Never writes.
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CATEGORIES = [
  "nutrition", "fitness", "mindfulness", "spa", "sleep", "medical",
  "personalization", "amenities", "pricing_value", "activities",
  "education", "travel_access", "sustainability", "social_proof", "addons",
];

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

function catScore(scores: any, cat: string): number | null {
  if (!scores || typeof scores !== "object") return null;
  const c = scores[cat];
  if (c == null) return null;
  const s = typeof c === "object" ? c.score : c;
  if (s == null || Number.isNaN(Number(s))) return null;
  return Number(s);
}

async function main() {
  // Match the live read filter (data.ts getAllRetreats) so the audit reflects
  // exactly what the site renders: exclude test rows + wrd_score > 0.
  // PostgREST caps responses at db-max-rows (1000 here) regardless of the
  // Range header, so paginate explicitly with keyset order until exhausted.
  const PAGE = 1000;
  const data: any[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data: batch, error } = await supabase
      .from("retreats")
      .select("slug,name,wrd_score,score_tier,scores")
      .neq("slug", "test")
      .neq("slug", "cape-kalevala")
      .gt("wrd_score", 0)
      .order("slug", { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) {
      console.error("Supabase error:", error.message);
      process.exit(1);
    }
    if (!batch || batch.length === 0) break;
    data.push(...batch);
    if (batch.length < PAGE) break;
  }
  if (data.length === 0) {
    console.error("0 rows returned.");
    process.exit(1);
  }

  const n = data.length;
  const scores = data.map((r) => Number(r.wrd_score)).filter((x) => !Number.isNaN(x));
  const sorted = [...scores].sort((a, b) => a - b);

  // Histogram — 0.5 buckets from 0 to 10
  const buckets = new Map<string, number>();
  for (let b = 0; b < 10; b += 0.5) {
    buckets.set(b.toFixed(1), 0);
  }
  for (const s of scores) {
    const b = Math.min(9.5, Math.floor(s * 2) / 2);
    const key = b.toFixed(1);
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  console.log(`\n=== WRD SCORE AUDIT — ${n} retreats ===\n`);
  console.log("Histogram (0.5 buckets):");
  const maxCount = Math.max(...buckets.values());
  for (const [key, count] of buckets) {
    const barLen = maxCount > 0 ? Math.round((count / maxCount) * 40) : 0;
    const pct = ((count / n) * 100).toFixed(1);
    console.log(
      `  ${key}-${(parseFloat(key) + 0.5).toFixed(1)}  ${String(count).padStart(5)} (${pct.padStart(5)}%) ${"#".repeat(barLen)}`
    );
  }

  const mean = scores.reduce((a, b) => a + b, 0) / n;
  console.log("\nSummary stats:");
  console.log(`  min    : ${sorted[0].toFixed(2)}`);
  console.log(`  p10    : ${quantile(sorted, 0.1).toFixed(2)}`);
  console.log(`  p25    : ${quantile(sorted, 0.25).toFixed(2)}`);
  console.log(`  median : ${quantile(sorted, 0.5).toFixed(2)}`);
  console.log(`  mean   : ${mean.toFixed(2)}`);
  console.log(`  p75    : ${quantile(sorted, 0.75).toFixed(2)}`);
  console.log(`  p90    : ${quantile(sorted, 0.9).toFixed(2)}`);
  console.log(`  p99    : ${quantile(sorted, 0.99).toFixed(2)}`);
  console.log(`  max    : ${sorted[sorted.length - 1].toFixed(2)}`);

  const ge = (t: number) => scores.filter((s) => s >= t).length;
  console.log("\nThreshold coverage:");
  console.log(`  >= 6.5 : ${ge(6.5)} (${((ge(6.5) / n) * 100).toFixed(1)}%)`);
  console.log(`  >= 7.0 : ${ge(7.0)} (${((ge(7.0) / n) * 100).toFixed(1)}%)`);
  console.log(`  >= 8.0 : ${ge(8.0)} (${((ge(8.0) / n) * 100).toFixed(1)}%)`);
  console.log(`  >= 9.0 : ${ge(9.0)} (${((ge(9.0) / n) * 100).toFixed(1)}%)`);

  // Tier counts
  const tierCounts = new Map<string, number>();
  for (const r of data) {
    const t = r.score_tier || "(null)";
    tierCounts.set(t, (tierCounts.get(t) || 0) + 1);
  }
  console.log("\nscore_tier counts:");
  for (const [t, c] of [...tierCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t.padEnd(20)} ${c} (${((c / n) * 100).toFixed(1)}%)`);
  }

  // Per-category present/zero/null rates
  console.log("\nPer-category data coverage (present = finite score > 0):");
  console.log(`  ${"category".padEnd(16)} present   zero    null   avg(present)`);
  let sumPresentCount = 0;
  for (const cat of CATEGORIES) {
    let present = 0, zero = 0, nul = 0, sumPresent = 0;
    for (const r of data) {
      const s = catScore(r.scores, cat);
      if (s === null) nul++;
      else if (s > 0) { present++; sumPresent += s; }
      else zero++;
    }
    sumPresentCount += present;
    const avgP = present > 0 ? (sumPresent / present).toFixed(2) : "—";
    console.log(
      `  ${cat.padEnd(16)} ${String(present).padStart(5)} ${String(zero).padStart(6)} ${String(nul).padStart(7)}   ${avgP}`
    );
  }
  console.log(`\n  avg present categories / retreat: ${(sumPresentCount / n).toFixed(1)} of ${CATEGORIES.length}`);

  // Distribution of present-category count
  const presentCounts = data.map((r) =>
    CATEGORIES.reduce((acc, cat) => acc + ((catScore(r.scores, cat) ?? 0) > 0 ? 1 : 0), 0)
  );
  const pcSorted = [...presentCounts].sort((a, b) => a - b);
  console.log("\nPresent-category-count distribution:");
  console.log(`  min ${pcSorted[0]}  p25 ${quantile(pcSorted, 0.25).toFixed(0)}  median ${quantile(pcSorted, 0.5).toFixed(0)}  p75 ${quantile(pcSorted, 0.75).toFixed(0)}  max ${pcSorted[pcSorted.length - 1]}`);
  const sparse = presentCounts.filter((c) => c <= 5).length;
  console.log(`  retreats with <= 5 present categories: ${sparse} (${((sparse / n) * 100).toFixed(1)}%)`);
  console.log(`  retreats with all 15 present: ${presentCounts.filter((c) => c === 15).length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
