/** @type {import('next').NextConfig} */
const nextConfig = {
  // Give data-heavy pages (homepage, guides) more room to finish their Supabase
  // queries during static generation. Default is 60s; cold Supabase reads
  // occasionally exceed it and fail the whole build. 180s absorbs that flake.
  staticPageGenerationTimeout: 180,
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
