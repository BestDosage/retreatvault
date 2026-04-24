import { blogPosts as basePosts } from "@/data/blog-posts";
import { retreatBlogPosts } from "@/data/retreat-blog-posts";
import { GUIDES } from "@/data/guides";

const blogPosts = [...retreatBlogPosts, ...basePosts];

export async function GET() {
  const baseUrl = "https://www.retreatvault.com";

  const blogItems = blogPosts.slice(0, 20).map((post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
      <category>${post.category}</category>
    </item>`).join("");

  const guideItems = GUIDES.slice(0, 20).map((g) => `
    <item>
      <title><![CDATA[${g.title}]]></title>
      <link>${baseUrl}/guides/${g.slug}</link>
      <description><![CDATA[${g.subtitle}]]></description>
      <pubDate>${new Date("2026-04-24").toUTCString()}</pubDate>
      <guid isPermaLink="true">${baseUrl}/guides/${g.slug}</guid>
      <category>Guide</category>
    </item>`).join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>RetreatvVault — Wellness Retreat Intelligence</title>
    <link>${baseUrl}</link>
    <description>Data-driven wellness retreat reviews, guides, and analysis. 9,400+ retreats scored across 15 categories.</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${blogItems}
    ${guideItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
