"use client";

import { useCompare } from "./CompareProvider";

interface Props {
  retreat: {
    id: string;
    slug: string;
    name: string;
    hero_image_url: string;
    wrd_score: number;
  };
}

export default function AddToCompareButton({ retreat }: Props) {
  const { add, remove, isSelected } = useCompare();
  const selected = isSelected(retreat.id);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        selected ? remove(retreat.id) : add(retreat);
      }}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] transition-all duration-300 ${
        selected
          ? "bg-gold-400 text-dark-950 shadow-[0_0_16px_rgba(212,175,55,0.2)]"
          : "border border-white/[0.08] text-dark-300 hover:border-gold-400/30 hover:text-white"
      }`}
    >
      {selected ? (
        <>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Added
        </>
      ) : (
        <>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Compare
        </>
      )}
    </button>
  );
}
