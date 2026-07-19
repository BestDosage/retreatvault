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
    const message = clean(body.message, 4000);

    if (!EMAIL_RE.test(email) || !message) {
      return NextResponse.json(
        { error: "Valid email and message required" },
        { status: 400 }
      );
    }

    const name = clean(body.name, 200);
    const subject = clean(body.subject, 100) || "general";

    const contactPayload = {
      name,
      email,
      subject,
      message,
      source: "contact",
    };

    // Store best-effort. The email alert below is the real delivery, so a DB
    // failure (table missing, or a duplicate under the unique-email index) must
    // NEVER fail the submission. upsert+ignoreDuplicates = ON CONFLICT DO NOTHING,
    // safe under the insert-only RLS policy.
    try {
      const { error } = await supabase.from("email_subscribers").upsert(
        {
          email,
          source: "contact",
          source_detail: subject,
          status: "active",
          subscribed_at: new Date().toISOString(),
          metadata: contactPayload,
        },
        { onConflict: "email", ignoreDuplicates: true }
      );
      if (error) console.error("Contact store failed (non-fatal):", error.message);
    } catch (e) {
      console.error("Contact store threw (non-fatal):", e);
    }

    // The alert IS the delivery — always fire it, regardless of DB state.
    await sendLeadAlert(`New contact message: ${subject}`, {
      Name: name,
      Email: email,
      Subject: subject,
      Message: message,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
