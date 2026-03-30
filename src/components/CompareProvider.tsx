"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface CompareItem {
  id: string;
  slug: string;
  name: string;
  hero_image_url: string;
  wrd_score: number;
}

interface CompareContextType {
  items: CompareItem[];
  add: (item: CompareItem) => void;
  remove: (id: string) => void;
  isSelected: (id: string) => boolean;
  clear: () => void;
}

const CompareContext = createContext<CompareContextType>({
  items: [],
  add: () => {},
  remove: () => {},
  isSelected: () => false,
  clear: () => {},
});

export function useCompare() {
  return useContext(CompareContext);
}

export default function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);

  const add = useCallback((item: CompareItem) => {
    setItems((prev) => {
      if (prev.length >= 3 || prev.find((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const isSelected = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const clear = useCallback(() => setItems([]), []);

  return (
    <CompareContext.Provider value={{ items, add, remove, isSelected, clear }}>
      {children}
    </CompareContext.Provider>
  );
}
