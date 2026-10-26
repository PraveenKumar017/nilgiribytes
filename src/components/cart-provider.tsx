"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CART_STORAGE_KEY,
  cartCount,
  cartSubtotal,
  itemSizeLabel,
  readCart,
  toCartLine,
  writeCart,
} from "@/lib/cart";
import type { CartLine, StoreItem } from "@/lib/types";

type CartContextValue = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotal: number;
  announcement: string;
  add: (item: StoreItem, sizeIndex?: number, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  changeQty: (key: string, delta: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  quantityOf: (key: string) => number;
};

const CartContext = createContext<CartContextValue | null>(null);
const MAX_QTY = 20;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    setLines(readCart());
    setReady(true);

    function sync(event: StorageEvent) {
      if (event.key === CART_STORAGE_KEY) setLines(readCart());
    }

    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const commit = useCallback((next: CartLine[]) => {
    setLines(next);
    writeCart(next);
    const count = cartCount(next);
    setAnnouncement(
      count === 0
        ? "Cart is empty."
        : `${count} ${count === 1 ? "item" : "items"} in cart.`
    );
  }, []);

  const add = useCallback(
    (item: StoreItem, sizeIndex = 0, qty = 1) => {
      const line = toCartLine(item, sizeIndex, qty);
      const current = readCart();
      const existing = current.find((entry) => entry.key === line.key);
      const next = existing
        ? current.map((entry) =>
            entry.key === line.key
              ? { ...entry, qty: Math.min(MAX_QTY, entry.qty + qty) }
              : entry
          )
        : [...current, { ...line, qty: Math.min(MAX_QTY, qty) }];
      commit(next);
      setAnnouncement(`${item.name} (${itemSizeLabel(item, sizeIndex)}) added to cart.`);
    },
    [commit]
  );

  const setQty = useCallback(
    (key: string, qty: number) => {
      const current = readCart();
      const next =
        qty <= 0
          ? current.filter((entry) => entry.key !== key)
          : current.map((entry) =>
              entry.key === key
                ? { ...entry, qty: Math.min(MAX_QTY, Math.round(qty)) }
                : entry
            );
      commit(next);
    },
    [commit]
  );

  const changeQty = useCallback(
    (key: string, delta: number) => {
      const current = readCart();
      const line = current.find((entry) => entry.key === key);
      if (!line) return;
      setQty(key, line.qty + delta);
    },
    [setQty]
  );

  const remove = useCallback(
    (key: string) => {
      commit(readCart().filter((entry) => entry.key !== key));
    },
    [commit]
  );

  const clear = useCallback(() => commit([]), [commit]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      count: cartCount(lines),
      subtotal: cartSubtotal(lines),
      announcement,
      add,
      setQty,
      changeQty,
      remove,
      clear,
      quantityOf: (key) => lines.find((line) => line.key === key)?.qty ?? 0,
    }),
    [lines, ready, announcement, add, setQty, changeQty, remove, clear]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
