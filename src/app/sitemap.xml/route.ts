import { generateSitemaps } from "../sitemap";

const BASE_URL = "https://www.retreatvault.com";

export const revalidate = 3600;

export async function GET() {
  const chunks = await generateSitemaps();

  const lastmod = new Date().toISOString();
  const entries = chunks
    .map(
      ({ id }) =>
        `  <sitemap>\n    <loc>${BASE_URL}/sitemap/${id}.xml</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control":
        "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
