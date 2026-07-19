// Internal lead-alert email via the Resend REST API (no SDK dependency).
//
// No-op unless RESEND_API_KEY is set, so this is safe to deploy before the key
// exists — alerts simply switch on the moment the key is added in Vercel.
// Never throws: a mail failure must never break lead capture. In a serverless
// route the send is awaited (not fire-and-forget) so the request doesn't freeze
// before the fetch completes.
//
// Env:
//   RESEND_API_KEY  – required to send (absent → silent skip)
//   ALERT_EMAIL     – where alerts go (default: chad.a.waldman@gmail.com)
//   RESEND_FROM     – verified sender (default: onboarding@resend.dev, works
//                     out of the box; swap for a verified retreatvault.com
//                     sender once the domain is added in Resend)

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

export async function sendLeadAlert(
  subject: string,
  fields: Record<string, string | number | null | undefined>
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // not configured yet — silently skip

  const to = process.env.ALERT_EMAIL || "chad.a.waldman@gmail.com";
  const from = process.env.RESEND_FROM || "RetreatVault Leads <onboarding@resend.dev>";

  const rows = Object.entries(fields)
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 14px 4px 0;color:#6b6b6b;font:13px/1.5 sans-serif;white-space:nowrap">${escapeHtml(
          k
        )}</td><td style="padding:4px 0;font:13px/1.5 sans-serif;color:#111">${escapeHtml(String(v))}</td></tr>`
    )
    .join("");

  const html = `<div style="font:14px/1.6 sans-serif;color:#111"><h2 style="font:600 16px sans-serif;margin:0 0 12px">${escapeHtml(
    subject
  )}</h2><table style="border-collapse:collapse">${rows}</table><p style="color:#9a9a9a;font-size:11px;margin-top:18px">RetreatVault · automated lead alert</p></div>`;

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      console.error("Resend alert failed:", res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.error("Resend alert error:", e instanceof Error ? e.message : e);
  }
}
