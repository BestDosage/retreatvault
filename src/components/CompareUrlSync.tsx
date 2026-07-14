"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCompare, CompareItem } from "./CompareProvider";

// Closes the shareable-URL loop for /compare. The comparison table itself is
// rendered server-side from ?retreats=, so a shared link always works. This
// component keeps the in-memory compare state (the floating CompareBar) in sync
// with that URL in BOTH directions:
//   URL -> state: on first mount, seed the empty in-memory state from the slugs
//                 already resolved server-side (so the bar reflects a shared link).
//   state -> URL: when the user adds/removes via the bar, mirror the selection
//                 back into the address bar with router.replace (no scroll jump).
export default function CompareUrlSync({ seed }: { seed: CompareItem[] }) {
  const { items, add } = useCompare();
  const router = useRouter();
  const hydrated = useRef(false);

  // Seed once. Guarded so we never wipe an existing in-memory selection.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (items.length === 0) seed.forEach(add);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror selection changes into the URL so the address bar stays shareable.
  useEffect(() => {
    if (!hydrated.current) return;
    const slugs = items.map((i) => i.slug).join(",");
    const current = new URLSearchParams(window.location.search).get("retreats") || "";
    // Only write when we actually have a selection and it differs — this avoids
    // clobbering the shared URL with an empty param during the initial seed pass.
    if (slugs && slugs !== current) {
      router.replace(`/compare?retreats=${slugs}`, { scroll: false });
    }
  }, [items, router]);

  return null;
}
