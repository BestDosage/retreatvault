"use client";

import { useState, FormEvent } from "react";

const SUBJECTS = [
  { value: "general", label: "General Inquiry" },
  { value: "methodology", label: "Question About Our Scoring" },
  { value: "submit", label: "Submit a Retreat for Review" },
  { value: "partnership", label: "Partnership / Advertising" },
  { value: "press", label: "Press / Media" },
  { value: "correction", label: "Data Correction" },
] as const;

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
    const subject = (form.elements.namedItem("subject") as HTMLSelectElement)?.value;
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement)?.value;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b?.error || "Failed to send message");
      }

      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-sage-100 p-8 text-center">
        <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-sage-700">Message Sent</p>
        <p className="mt-3 font-display text-lg text-ink-900">
          Thanks &mdash; we&rsquo;ll reply to your email within 48 hours.
        </p>
      </div>
    );
  }

  const fieldClass =
    "mt-1 w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-[13px] text-ink-900 placeholder-ink-500 outline-none transition-colors focus:border-sage-600";
  const labelClass = "text-[10px] font-semibold uppercase tracking-wider text-ink-500";

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="cf-name" className={labelClass}>Name</label>
        <input
          id="cf-name"
          name="name"
          type="text"
          required
          className={fieldClass}
          placeholder="Your name"
        />
      </div>
      <div>
        <label htmlFor="cf-email" className={labelClass}>Email</label>
        <input
          id="cf-email"
          name="email"
          type="email"
          required
          className={fieldClass}
          placeholder="you@email.com"
        />
      </div>
      <div>
        <label htmlFor="cf-subject" className={labelClass}>Subject</label>
        <select id="cf-subject" name="subject" className={fieldClass}>
          {SUBJECTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="cf-message" className={labelClass}>Message</label>
        <textarea
          id="cf-message"
          name="message"
          rows={5}
          required
          className={`${fieldClass} resize-none`}
          placeholder="How can we help?"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="group flex w-full items-center justify-center gap-2.5 rounded-full bg-ink-900 py-3 pl-6 pr-4 text-sm font-medium text-cream-50 transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
      >
        {status === "loading" ? "Sending..." : "Send Message"}
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
          <svg className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </button>
      {status === "error" && (
        <p className="text-[11px] text-red-500">{errorMsg}</p>
      )}
    </form>
  );
}
