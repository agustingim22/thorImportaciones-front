"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./auth";

export type CartItem = {
  lineId: string; // identifica esta línea (producto + personalización elegida)
  productId: number;
  team: string;
  price: number; // precio base del producto (sin el extra del parche)
  qty: number;
  imageUrl: string | null;
  colorCss: string;
  presetNumber: string | null; // para el placeholder cuando no hay foto
  size: string;
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
    a.size === b.size &&
    a.customName === b.customName &&
    a.customNumber === b.customNumber &&
    a.patchId === b.patchId
  );
}

/** Suma una línea a una lista existente, fusionando con una igual si ya está. */
function mergeLine(items: CartItem[], line: NewLine, qty: number): CartItem[] {
  const existing = items.find((i) => sameLine(i, line));
  if (existing) {
    return items.map((i) => (i.lineId === existing.lineId ? { ...i, qty: i.qty + qty } : i));
  }
  return [...items, { ...line, qty, lineId: makeLineId() }];
}

async function fetchServerCart(): Promise<(NewLine & { qty: number })[]> {
  const res = await fetch("/api/my/cart", { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

function saveServerCart(items: CartItem[]) {
  fetch("/api/my/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: items.map((i) => ({
        productId: i.productId,
        qty: i.qty,
        size: i.size,
        customName: i.customName,
        customNumber: i.customNumber,
        patchId: i.patchId,
      })),
    }),
  }).catch(() => {});
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { user } = useAuth();
  const mergedForUserId = useRef<number | null>(null);

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

  // Guardar en localStorage cuando cambia (siempre, esté logueado o no).
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  // Al loguearse, traemos el carrito guardado del servidor y lo fusionamos con
  // el local (por si venía comprando como invitado), una sola vez por sesión.
  useEffect(() => {
    if (!user) mergedForUserId.current = null; // al desloguear, forzamos un merge fresco la próxima vez
  }, [user]);

  useEffect(() => {
    if (!loaded || !user) return;
    if (mergedForUserId.current === user.id) return;
    mergedForUserId.current = user.id;
    fetchServerCart().then((serverItems) => {
      if (serverItems.length === 0) return;
      setItems((prev) => {
        let merged = prev;
        for (const line of serverItems) {
          const { qty, ...rest } = line;
          merged = mergeLine(merged, rest, qty);
        }
        return merged;
      });
    });
  }, [loaded, user]);

  // Mientras esté logueado, sincronizamos cada cambio al servidor (con un pequeño
  // debounce para no mandar un request por cada click de +/-).
  useEffect(() => {
    if (!loaded || !user) return;
    const t = setTimeout(() => saveServerCart(items), 800);
    return () => clearTimeout(t);
  }, [items, user, loaded]);

  const add: CartContextValue["add"] = (item, qty = 1) => {
    setItems((prev) => mergeLine(prev, item, qty));
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
