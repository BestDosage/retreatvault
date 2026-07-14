"use client";

import { useCompare } from "./CompareProvider";

type Variant = "pill" | "circle" | "secondary";

interface Props {
  retreat: {
    id: string;
    slug: string;
    name: string;
    hero_image_url: string;
    wrd_score: number;
  };
  variant?: Variant;
}

const PlusIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const CheckIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export default function AddToCompareButton({ retreat, variant = "pill" }: Props) {
  const { add, remove, isSelected } = useCompare();
  const selected = isSelected(retreat.id);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    selected ? remove(retreat.id) : add(retreat);
  };

  // Compact circular glyph — card image overlay. Card stays a server component;
  // this client leaf sits inside its <Link> and swallows the click so the card
  // link never fires.
  if (variant === "circle") {
    return (
      <button
        onClick={toggle}
        aria-label={selected ? "Remove from compare" : "Add to compare"}
        aria-pressed={selected}
        className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm ring-1 transition-colors duration-150 ease-out active:scale-[0.94] ${
          selected
            ? "bg-ink-900 text-cream-50 ring-ink-900"
            : "bg-cream-50/90 text-ink-700 ring-cream-200 hover:text-ink-900"
        }`}
      >
        {selected ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
      </button>
    );
  }

  // Larger ghost pill sized to sit beside the primary "Visit Site" CTA.
  if (variant === "secondary") {
    return (
      <button
        onClick={toggle}
        aria-pressed={selected}
        className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-150 ease-out active:scale-[0.97] ${
          selected
            ? "bg-ink-900 text-cream-50"
            : "text-ink-700 ring-1 ring-ink-900/20 hover:text-ink-900 hover:ring-ink-900/40"
        }`}
      >
        {selected ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
        {selected ? "Added to Compare" : "Add to Compare"}
      </button>
    );
  }

  // Default — ghost micro-pill.
  return (
    <button
      onClick={toggle}
      aria-pressed={selected}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] transition-all duration-150 ease-out active:scale-[0.97] ${
        selected
          ? "bg-ink-900 text-cream-50"
          : "text-ink-700 ring-1 ring-ink-900/20 hover:text-ink-900 hover:ring-ink-900/40"
      }`}
    >
      {selected ? <CheckIcon className="h-3 w-3" /> : <PlusIcon className="h-3 w-3" />}
      {selected ? "Added" : "Compare"}
    </button>
  );
}
