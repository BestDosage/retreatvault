"use client";

import { useState } from "react";

// Ghost-pill "Copy link" for the compare header. Copies the current, fully
// shareable URL (already synced to ?retreats= by CompareUrlSync) and shows a
// "Copied" confirmation for 2s. Clipboard failures fail quietly.
export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-700 ring-1 ring-ink-900/20 transition-colors hover:text-ink-900 hover:ring-ink-900/40"
    >
      {copied ? (
        <svg className="h-3.5 w-3.5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
      )}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
