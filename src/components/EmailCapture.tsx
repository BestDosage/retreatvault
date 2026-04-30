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
  subtext = "The 3 retreats our data says are underpriced right now. Plus new scores and insider intel.",
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
        body: JSON.stringify({ email, firstName, source, sourceDetail }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to subscribe");
      }

      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className={variant === "footer" ? "" : "rounded-2xl border border-gold-400/20 bg-gold-400/[0.03] p-8 text-center"}>
        <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-gold-500">You&rsquo;re in</p>
        <p className="mt-2 font-serif text-lg font-light text-white">Check your inbox for the first Vault Report.</p>
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
    <div className={variant === "inline" ? "" : "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center"}>
      <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-gold-500">Free Weekly Intel</p>
      <h3 className="mt-3 font-serif text-xl font-light text-white">{headline}</h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] font-light leading-relaxed text-dark-300">{subtext}</p>
      <form onSubmit={handleSubmit} className="mx-auto mt-6 max-w-sm space-y-3">
        {showName && (
          <input
            name="firstName"
            type="text"
            placeholder="First name"
            className="w-full rounded-xl border border-white/[0.08] bg-dark-900 px-4 py-3 text-[13px] text-white placeholder-dark-500 outline-none transition-colors focus:border-gold-400/30"
          />
        )}
        <input
          name="email"
          type="email"
          required
          placeholder="Email address"
          className="w-full rounded-xl border border-white/[0.08] bg-dark-900 px-4 py-3 text-[13px] text-white placeholder-dark-500 outline-none transition-colors focus:border-gold-400/30"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-luxury btn-luxury-md btn-luxury-full disabled:opacity-50"
        >
          {status === "loading" ? "Subscribing..." : "Get the Vault Report"}
        </button>
      </form>
      {status === "error" && <p className="mt-2 text-[11px] text-red-400">{errorMsg}</p>}
      <p className="mt-3 text-[10px] text-dark-600">No spam. Unsubscribe anytime.</p>
    </div>
  );
}
