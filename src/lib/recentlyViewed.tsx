"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "thor-recently-viewed";
const MAX_ITEMS = 12;

type RecentlyViewedContextValue = {
  ids: number[];
  addView: (id: number) => void;
};

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(null);

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch {
      /* sin historial guardado */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids, loaded]);

  function addView(id: number) {
    setIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, MAX_ITEMS));
  }

  return (
    <RecentlyViewedContext.Provider value={{ ids, addView }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) throw new Error("useRecentlyViewed debe usarse dentro de <RecentlyViewedProvider>");
  return ctx;
}
