"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type CartItem = {
  lineId: string; // identifica esta línea (producto + personalización elegida)
  productId: number;
  team: string;
  price: number; // precio base del producto (sin el extra del parche)
  qty: number;
  imageUrl: string | null;
  colorCss: string;
  presetNumber: string | null; // para el placeholder cuando no hay foto
  customName: string | null;
  customNumber: string | null;
  patchId: number | null;
  patchLabel: string | null;
  patchExtraPrice: number;
};

export type NewLine = Omit<CartItem, "lineId" | "qty">;

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: NewLine, qty?: number) => void;
  setQty: (lineId: string, qty: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "thor-cart";

function makeLineId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Dos líneas son "la misma" si son el mismo producto con la misma personalización. */
function sameLine(a: CartItem, b: NewLine): boolean {
  return (
    a.productId === b.productId &&
    a.customName === b.customName &&
    a.customNumber === b.customNumber &&
    a.patchId === b.patchId
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Cargar desde localStorage al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* carrito vacío */
    }
    setLoaded(true);
  }, []);

  // Guardar en localStorage cuando cambia
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const add: CartContextValue["add"] = (item, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, item));
      if (existing) {
        return prev.map((i) =>
          i.lineId === existing.lineId ? { ...i, qty: i.qty + qty } : i,
        );
      }
      return [...prev, { ...item, qty, lineId: makeLineId() }];
    });
  };

  const setQty: CartContextValue["setQty"] = (lineId, qty) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.lineId !== lineId)
        : prev.map((i) => (i.lineId === lineId ? { ...i, qty } : i)),
    );
  };

  const remove: CartContextValue["remove"] = (lineId) =>
    setItems((prev) => prev.filter((i) => i.lineId !== lineId));

  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + (i.price + i.patchExtraPrice) * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, count, total, add, setQty, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
