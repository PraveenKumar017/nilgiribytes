import type { CartLine, StoreItem, StoreSize } from "./types";

export const CART_STORAGE_KEY = "veb_cart";

export function itemPrice(item: StoreItem, sizeIndex = 0): number {
  if (item.kind === "combo") return item.pricePaise;
  return item.sizes[sizeIndex]?.pricePaise ?? 0;
}

export function itemSizeLabel(item: StoreItem, sizeIndex = 0): string {
  if (item.kind === "combo") return item.weight || "1 kg total";
  return item.sizes[sizeIndex]?.label ?? "";
}

export function itemImage(item: StoreItem, sizeIndex = 0): string {
  if (item.kind === "combo") return item.image;
  const size: StoreSize | undefined = item.sizes[sizeIndex];
  return size?.imageUrl || item.image;
}

export function cartLineKey(itemId: string, sizeLabel: string): string {
  return `${itemId}::${sizeLabel}`;
}

export function toCartLine(item: StoreItem, sizeIndex = 0, qty = 1): CartLine {
  const sizeLabel = itemSizeLabel(item, sizeIndex);
  return {
    key: cartLineKey(item.id, sizeLabel),
    id: item.id,
    kind: item.kind,
    name: item.name,
    category: item.category,
    sizeLabel,
    pricePaise: itemPrice(item, sizeIndex),
    qty,
    image: itemImage(item, sizeIndex),
  };
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.pricePaise * line.qty, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    window.dispatchEvent(new CustomEvent("veb:cart-updated"));
  } catch {
    /* Storage unavailable (private mode) — fail silently. */
  }
}
