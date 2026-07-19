"use client";

import { useState, useMemo, FormEvent } from "react";

interface RequestRatesFormProps {
  retreatSlug: string;
  retreatName: string;
  budgetBand?: string;
}

// Build "Flexible" + the next 12 months as "March 2027"-style labels, computed
// from today so the options never go stale.
function buildTravelMonths(): string[] {
  const fmt = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
  const now = new Date();
  const months: string[] = ["Flexible"];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(fmt.format(d));
  }
  return months;
}

export default function RequestRatesForm({
  retreatSlug,
  retreatName,
  budgetBand,
}: RequestRatesFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const travelMonths = useMemo(buildTravelMonths, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
    const travelMonth = (form.elements.namedItem("travelMonth") as HTMLSelectElement)?.value;
    const partySize = (form.elements.namedItem("partySize") as HTMLSelectElement)?.value;
    const phone = (form.elements.namedItem("phone") as HTMLInputElement)?.value;

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          travelMonth,
          partySize,
          budgetBand,
          retreatSlug,
          retreatName,
          source: "detail_page",
        }),
      });

      if (!res.ok) throw new Error("Something went wrong. Please try again.");

      // Guarded analytics — fire only if the tags are present.
      (window as typeof window & { gtag?: (...a: unknown[]) => void }).gtag?.(
        "event",
        "inquiry_submit",
        { retreat_slug: retreatSlug }
      );
      (window as typeof window & { fbq?: (...a: unknown[]) => void }).fbq?.("track", "Lead");

      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-[2rem] bg-sage-100 px-8 py-14 text-center ring-1 ring-sage-700/15 sm:px-16 sm:py-20">
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-sage-700">Request received</p>
        <p className="mx-auto mt-4 max-w-md font-display text-2xl leading-snug text-ink-900">
          We&rsquo;ll email you rates within 48 hours.
        </p>
        <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-ink-700">
          Our concierge is requesting current availability and pricing for {retreatName} on your behalf.
        </p>
      </div>
    );
  }

  const fieldClass =
    "w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-[13px] text-ink-900 placeholder-ink-500 outline-none transition-colors focus:border-sage-600";

  return (
    <div className="rounded-[2rem] bg-cream-100 px-8 py-12 ring-1 ring-cream-200 sm:px-14 sm:py-16">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-sage-700">Concierge Request</p>
        <h2 className="mt-4 font-display text-3xl text-ink-900 sm:text-4xl">Check Availability &amp; Rates</h2>
        <p className="mx-auto mt-4 max-w-md text-[13px] leading-relaxed text-ink-700">
          We&rsquo;ll request current rates and availability from {retreatName} on your behalf &mdash; takes 30
          seconds, no charge, no spam.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-lg space-y-3">
        <input
          name="email"
          type="email"
          required
          placeholder="Email address"
          aria-label="Email address"
          className={fieldClass}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="rr-travelMonth" className="sr-only">Travel month</label>
            <select id="rr-travelMonth" name="travelMonth" defaultValue="Flexible" className={fieldClass}>
              {travelMonths.map((m) => (
                <option key={m} value={m}>{m === "Flexible" ? "Travel month: Flexible" : m}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rr-partySize" className="sr-only">Party size</label>
            <select id="rr-partySize" name="partySize" defaultValue="2" className={fieldClass}>
              <option value="1">1 guest</option>
              <option value="2">2 guests</option>
              <option value="3">3+ guests</option>
            </select>
          </div>
        </div>

        <input
          name="phone"
          type="tel"
          placeholder="Phone (optional — for concierge follow-up)"
          aria-label="Phone (optional — for concierge follow-up)"
          className={fieldClass}
        />

        <button
          type="submit"
          disabled={status === "loading"}
          className="group flex w-full items-center justify-center gap-2.5 rounded-full bg-ink-900 py-3 pl-6 pr-4 text-sm font-medium text-cream-50 transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
        >
          {status === "loading" ? "Sending request..." : "Check Availability & Rates"}
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
            <svg className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </button>

        {status === "error" && <p className="text-center text-[11px] text-red-500">{errorMsg}</p>}
        <p className="text-center text-[10px] text-ink-500">No charge. No spam. Unsubscribe anytime.</p>
      </form>
    </div>
  );
}
