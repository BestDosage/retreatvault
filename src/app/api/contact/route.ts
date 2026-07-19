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

    // Plain .insert() — never upsert/.select() (email_subscribers is insert-only
    // RLS with no read policy for anon). Full payload lives in metadata.
    const { error } = await supabase.from("email_subscribers").insert({
      email,
      source: "contact",
      source_detail: subject,
      status: "active",
      subscribed_at: new Date().toISOString(),
      metadata: contactPayload,
    });

    if (error) {
      console.error("Contact insert error:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

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
