import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendLeadAlert } from "@/lib/notify";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(v: unknown, max = 500): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t.length ? t : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const email = clean(body.email, 200)?.toLowerCase() || "";
    const retreatSlug = clean(body.retreatSlug, 200);

    if (!EMAIL_RE.test(email) || !retreatSlug) {
      return NextResponse.json({ error: "Valid email and retreat required" }, { status: 400 });
    }

    const phone = clean(body.phone, 40);
    const retreatName = clean(body.retreatName, 200);
    const travelMonth = clean(body.travelMonth, 40);
    const budgetBand = clean(body.budgetBand, 40);
    const message = clean(body.message, 2000);
    const partySizeRaw = Number(body.partySize);
    const partySize = Number.isFinite(partySizeRaw) && partySizeRaw > 0 ? Math.floor(partySizeRaw) : null;
    const source = clean(body.source, 60) || "detail_page";

    const leadPayload = {
      email,
      phone,
      retreat_slug: retreatSlug,
      retreat_name: retreatName,
      travel_month: travelMonth,
      party_size: partySize,
      budget_band: budgetBand,
      message,
      source,
    };

    // Primary path: booking_leads. Plain .insert() — never upsert (insert-only
    // RLS) and never .select() after insert (anon has no read policy).
    const { error } = await supabase.from("booking_leads").insert(leadPayload);

    if (!error) {
      await sendLeadAlert(`New booking lead: ${retreatName || retreatSlug}`, {
        Retreat: retreatName || retreatSlug,
        Email: email,
        Phone: phone,
        "Travel month": travelMonth,
        "Party size": partySize,
        "Budget band": budgetBand,
        Message: message,
        Source: source,
      });
      return NextResponse.json({ ok: true });
    }

    // Fallback: if booking_leads is unavailable (e.g. migration not yet applied),
    // never lose the lead — capture it in email_subscribers with the full payload
    // in metadata so it can be recovered.
    console.error("booking_leads insert error, falling back to email_subscribers:", error);
    const { error: fbError } = await supabase.from("email_subscribers").insert({
      email,
      source: "booking_lead",
      source_detail: retreatSlug,
      status: "active",
      subscribed_at: new Date().toISOString(),
      metadata: leadPayload,
    });

    if (fbError) {
      console.error("email_subscribers fallback insert error:", fbError);
      return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
    }

    await sendLeadAlert(`New booking lead: ${retreatName || retreatSlug}`, {
      Retreat: retreatName || retreatSlug,
      Email: email,
      Phone: phone,
      "Travel month": travelMonth,
      "Party size": partySize,
      "Budget band": budgetBand,
      Message: message,
      Source: source,
      Note: "captured via fallback (booking_leads insert failed)",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
