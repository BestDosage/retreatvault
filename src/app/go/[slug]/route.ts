import { NextRequest, NextResponse } from "next/server";
import { getRetreatBySlug } from "@/lib/data";
import { supabase } from "@/lib/supabase";

// Referral redirect layer: every outbound "Visit Official Site" click routes
// through here so we can log intent before forwarding to the retreat's site.
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const retreat = await getRetreatBySlug(slug);

  // Unknown slug — send them back to the directory.
  if (!retreat) {
    return NextResponse.redirect(new URL("/retreats", req.url), 302);
  }

  const destination = retreat.website_url || "";

  // Best-effort click ledger. Never block or fail the redirect on a write error.
  try {
    await supabase.from("referral_clicks").insert({
      retreat_slug: slug,
      destination_url: destination || null,
      referrer: req.headers.get("referer") || null,
      user_agent: req.headers.get("user-agent") || null,
    });
  } catch (e) {
    console.error(`referral_clicks insert failed for "${slug}":`, e);
  }

  if (destination) {
    return NextResponse.redirect(destination, 302);
  }

  // No official site on file — fall back to the retreat's own detail page.
  return NextResponse.redirect(new URL(`/retreats/${slug}`, req.url), 302);
}
