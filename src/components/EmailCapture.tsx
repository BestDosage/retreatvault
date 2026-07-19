"use client";

import { useState, FormEvent } from "react";

interface EmailCaptureProps {
  source: string;
  sourceDetail?: string;
  variant?: "inline" | "card" | "footer";
  headline?: string;
  subtext?: string;
  showName?: boolean;
}

export default function EmailCapture({
  source,
  sourceDetail,
  variant = "card",
  headline = "Get the Weekly Vault Report",
  subtext = "The three best-value retreats our data surfaced this week. Plus new scores and insider intel.",
  showName = false,
}: EmailCaptureProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
    const firstName = showName ? (form.elements.namedItem("firstName") as HTMLInputElement)?.value : undefined;

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          source: source || "unknown",
          sourceDetail,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to subscribe");
      }

      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className={variant === "footer" ? "" : "rounded-2xl bg-sage-100 p-8 text-center"}>
        <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-sage-700">You&rsquo;re in</p>
        <p className="mt-2 font-display text-lg text-ink-900">Check your inbox for the first Vault Report.</p>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="Your email"
          className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-dark-900 px-3 py-2.5 text-[12px] text-white placeholder-dark-500 outline-none transition-colors focus:border-gold-400/30"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 rounded-lg bg-gold-400 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-dark-950 transition-colors hover:bg-gold-300 disabled:opacity-50"
        >
          {status === "loading" ? "..." : "Subscribe"}
        </button>
        {status === "error" && <p className="mt-1 text-[10px] text-red-400">{errorMsg}</p>}
      </form>
    );
  }

  return (
    <div className={variant === "inline" ? "" : "rounded-[2rem] bg-cream-100 p-8 text-center ring-1 ring-cream-200 sm:p-10"}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-sage-700">Free Weekly Intel</p>
      <h3 className="mt-3 font-display text-2xl text-ink-900">{headline}</h3>
      <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-ink-700">{subtext}</p>
      <form onSubmit={handleSubmit} className="mx-auto mt-6 max-w-sm space-y-3">
        {showName && (
          <input
            name="firstName"
            type="text"
            placeholder="First name"
            className="w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-[13px] text-ink-900 placeholder-ink-500 outline-none transition-colors focus:border-sage-600"
          />
        )}
        <input
          name="email"
          type="email"
          required
          placeholder="Email address"
          className="w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-[13px] text-ink-900 placeholder-ink-500 outline-none transition-colors focus:border-sage-600"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="group flex w-full items-center justify-center gap-2.5 rounded-full bg-ink-900 py-3 pl-6 pr-4 text-sm font-medium text-cream-50 transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
        >
          {status === "loading" ? "Subscribing..." : "Get the Vault Report"}
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
            <svg className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      </form>
      {status === "error" && <p className="mt-2 text-[11px] text-red-400">{errorMsg}</p>}
      <p className="mt-3 text-[10px] text-ink-500">No spam. Unsubscribe anytime.</p>
    </div>
  );
}
