import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    if (error) {
      console.error("Subscribe error:", error);
      return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
    }

    // A duplicate email is a no-op above, not an error — treat it as success
    // so returning subscribers still see the confirmation state.
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
