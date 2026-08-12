"use client";

import { useState } from "react";
import { useCart, type NewLine } from "@/lib/cart";

export function AddToCartButton({ item }: { item: NewLine }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    add(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="rounded-lg bg-thor-ink px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-cream transition-colors hover:bg-thor-ink-soft"
    >
      {added ? "✓ Agregado" : "Agregar"}
    </button>
  );
}
