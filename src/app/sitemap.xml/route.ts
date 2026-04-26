const BASE_URL = "https://www.retreatvault.com";
const RETREAT_SITEMAPS = 10; // ~9,400 retreats / 1,000 per sitemap

export const revalidate = 3600;

export async function GET() {
  const lastmod = new Date().toISOString();

  // Sitemap 0 = static/hub pages, Sitemaps 1-10 = retreat chunks
  const ids = Array.from({ length: RETREAT_SITEMAPS + 1 }, (_, i) => i);

  const entries = ids
    .map(
      (id) =>
        `  <sitemap>\n    <loc>${BASE_URL}/sitemap/${id}.xml</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
