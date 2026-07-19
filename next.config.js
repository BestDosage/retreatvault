/** @type {import('next').NextConfig} */
const nextConfig = {
  // Give data-heavy pages (homepage, guides) more room to finish their Supabase
  // queries during static generation. Default is 60s; cold Supabase reads
  // occasionally exceed it and fail the whole build. 180s absorbs that flake.
  staticPageGenerationTimeout: 240,
  // Serialize static generation to a single worker. Many routes (city/country/
  // region/type/guides) call getAllRetreats() — the ~9,400-row bulk query —
  // inside generateStaticParams/generateMetadata. On a cold parallel build the
  // default multi-worker fan-out has them all cold-call Supabase at once before
  // the unstable_cache is warm (thundering herd), tripping the anon statement
  // timeout → SIGTERM → build failure. With one worker the query runs once,
  // caches, and every subsequent page reuses it. Slower build, reliable deploy.
  experimental: {
    workerThreads: false,
    cpus: 1,
    optimizePackageImports: ["framer-motion", "lenis"],
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
  experimental: {
    optimizePackageImports: ["framer-motion", "lenis"],
  },
};

module.exports = nextConfig;
