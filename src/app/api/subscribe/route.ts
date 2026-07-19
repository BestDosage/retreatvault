import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendLeadAlert } from "@/lib/notify";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, firstName, source, sourceDetail } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // RLS on email_subscribers is INSERT-only (no UPDATE policy), so a plain
    // upsert({ onConflict }) fails for existing emails. ignoreDuplicates: true
    // turns this into INSERT ... ON CONFLICT DO NOTHING, which works under an
    // insert-only policy — a duplicate email simply no-ops instead of erroring.
    // Store best-effort. A DB failure (e.g. email_subscribers table not yet
    // created, or a duplicate under the unique-email index) must not lose a quiz
    // lead — the alert below is the real notification, so never 500 a valid email.
    try {
      const { error } = await supabase
        .from("email_subscribers")
        .upsert(
          {
            email: email.toLowerCase().trim(),
            first_name: firstName?.trim() || null,
            source: source || "unknown",
            source_detail: sourceDetail || null,
            status: "active",
            subscribed_at: new Date().toISOString(),
          },
          { onConflict: "email", ignoreDuplicates: true }
        );
      if (error) console.error("Subscribe store failed (non-fatal):", error.message);
    } catch (e) {
      console.error("Subscribe store threw (non-fatal):", e);
    }

    // Alert on EVERY email submission (per Chad: all site email captures notify
    // info@bestdosage.com). The alert is best-effort-independent of DB storage.
    await sendLeadAlert(
      source === "quiz" ? "New quiz lead" : `New email signup${source ? ` (${source})` : ""}`,
      {
        Email: email.toLowerCase().trim(),
        ...(sourceDetail ? { Detail: sourceDetail } : {}),
        Source: source || "unknown",
      }
    );

    // A duplicate email is a no-op above, not an error — treat it as success
    // so returning subscribers still see the confirmation state.
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
