const fs = require("fs");
const path = require("path");

// next.config.js is evaluated AFTER the `prebuild` step (npm runs prebuild →
// build, and next reads this config when `next build` starts). So we can check
// whether scripts/build-snapshot.mjs actually wrote the data snapshot and pick
// build concurrency accordingly:
//   • snapshot present  → static generation reads the file, no per-page DB load,
//                         so run FULLY PARALLEL — builds take a few minutes.
//   • snapshot missing  → fall back to the live Supabase query; force a single
//                         worker so the cold-read "thundering herd" that timed
//                         builds out can't recur. Slower, but never fails.
// Either way the deploy is reliable; the fast path is taken whenever the
// snapshot exists (which it will on Vercel, in-region with Supabase).
const hasSnapshot = (() => {
  try {
    const p = path.join(__dirname, "src/data/retreats-snapshot.json");
    return fs.existsSync(p) && fs.statSync(p).size > 2;
  } catch {
    return false;
  }
})();

if (!hasSnapshot) {
  console.warn("[next.config] no build snapshot found — using single-worker fallback build");
} else {
  console.log("[next.config] build snapshot present — parallel static generation");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Safety margin for the live-query fallback path only; with the snapshot in
  // place static generation does not touch Supabase per page.
  staticPageGenerationTimeout: 240,
  experimental: {
    optimizePackageImports: ["framer-motion", "lenis"],
    // Single worker only when we're on the live-query fallback (no snapshot).
    ...(hasSnapshot ? {} : { workerThreads: false, cpus: 1 }),
  },
  async redirects() {
    return [
      {
        source: "/retreats/cape-kalevala",
        destination: "/",
        permanent: true,
      },
    ];
  },
  images: {
    unoptimized: true,
  },
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
