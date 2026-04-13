import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://www.retreatvault.com";
const CHUNK_SIZE = 5000;

export const revalidate = 3600;

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );

  const { count } = await supabase
    .from("retreats")
    .select("id", { count: "exact", head: true })
    .neq("slug", "test")
    .gt("wrd_score", 0);

  // total URLs = 7 static + ~4 blog + retreats
  const totalUrls = 11 + (count ?? 0);
  const chunks = Math.max(1, Math.ceil(totalUrls / CHUNK_SIZE));

  const lastmod = new Date().toISOString();
  const entries = Array.from({ length: chunks }, (_, i) =>
    `  <sitemap>\n    <loc>${BASE_URL}/sitemap/${i}.xml</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`,
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control":
        "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
