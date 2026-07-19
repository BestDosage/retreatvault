#!/usr/bin/env node
/**
 * Launch verification harness — fetches LIVE pages and asserts the Week-1
 * credibility/conversion release actually shipped.
 *
 * Usage:  node scripts/verify-launch.mjs [baseUrl]
 * Default baseUrl: https://retreatvault.com
 *
 * Exits 1 on any failure. Emits a probe count so a run that checks zero
 * things can never report PASS.
 */

const BASE = process.argv[2] || "https://retreatvault.com";

// Strings that must NOT appear anywhere on the checked pages
const BANNED = [
  "analytical chemist",
  "Analytical Chemist",
  "Projected Trend",
  "underpriced",
  "no affiliate bias",
  "No paid placements, no affiliate",
  "affiliate commissions, or sponsored content",
  "Estimated from scoring data",
  "dumpstercomparison",
];

// Per-page strings that MUST appear
const REQUIRED = {
  "/": ["Scores are never for sale"],
  "/methodology": ["Scores are never for sale", "frozen"],
  "/about": ["Chad Waldman"],
  "/for-retreats": ["Claim"],
};

const PAGES = ["/", "/methodology", "/quiz", "/about", "/for-retreats", "/retreats/kamalaya-koh-samui"];

let probes = 0;
let failures = 0;

function check(ok, label) {
  probes++;
  if (ok) {
    console.log(`  PASS  ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}`);
  }
}

async function fetchPage(path) {
  const res = await fetch(BASE + path, {
    headers: { "user-agent": "RetreatVault-LaunchVerify/1.0" },
    redirect: "follow",
  });
  return { status: res.status, html: await res.text() };
}

let detailPath = PAGES[PAGES.length - 1];

for (const path of PAGES) {
  let page;
  try {
    page = await fetchPage(path);
  } catch (e) {
    console.log(`\n${path} — FETCH ERROR (${e.message}) — UNKNOWN, not pass`);
    probes++;
    failures++;
    continue;
  }
  console.log(`\n${path} [HTTP ${page.status}]`);
  check(page.status === 200, `HTTP 200 (got ${page.status})`);
  if (page.status !== 200) continue;

  for (const s of BANNED) {
    check(!page.html.includes(s), `banned string absent: "${s.slice(0, 40)}"`);
  }
  for (const s of REQUIRED[path] || []) {
    check(page.html.includes(s), `required string present: "${s}"`);
  }
  if (path === "/") {
    check(page.html.includes("googletagmanager"), "GA4 tag present on homepage");
  }
  if (path === detailPath) {
    check(page.html.includes("/go/"), "detail page routes outbound clicks through /go/");
    check(page.html.includes("Check Availability"), "detail page has gated Check Availability CTA");
    check(!page.html.includes("Visit Official Site"), "naked 'Visit Official Site' CTA removed");
  }
}

// /go redirect probe (should 30x or 200-after-redirect, never 404)
try {
  const res = await fetch(BASE + "/go/kamalaya-koh-samui", { redirect: "manual", headers: { "user-agent": "RetreatVault-LaunchVerify/1.0" } });
  console.log(`\n/go/kamalaya-koh-samui [HTTP ${res.status}]`);
  check([301, 302, 307, 308].includes(res.status), `/go/{slug} issues a redirect (got ${res.status})`);
} catch (e) {
  probes++; failures++;
  console.log(`\n/go probe FETCH ERROR: ${e.message}`);
}

console.log(`\n=== ${probes} probes run, ${failures} failed ===`);
if (probes < 30) {
  console.log("FAIL: fewer than 30 probes ran — harness itself is broken");
  process.exit(1);
}
process.exit(failures ? 1 : 0);
