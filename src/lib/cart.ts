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

export function itemMrp(item: StoreItem, sizeIndex = 0): number {
  if (item.kind === "combo") return item.mrpPaise;
  return item.sizes[sizeIndex]?.mrpPaise ?? itemPrice(item, sizeIndex);
}

export function itemDiscountPercent(item: StoreItem, sizeIndex = 0): number {
  if (item.kind === "combo") {
    return item.mrpPaise > item.pricePaise ? item.discountPercent : 0;
  }
  const size = item.sizes[sizeIndex];
  if (!size || size.mrpPaise <= size.pricePaise) return 0;
  return size.discountPercent;
}

export function itemSaving(item: StoreItem, sizeIndex = 0): number {
  return Math.max(0, itemMrp(item, sizeIndex) - itemPrice(item, sizeIndex));
}

export function itemImage(item: StoreItem, sizeIndex = 0): string {
  if (item.kind === "combo") return item.images[0] || item.image;
  const size: StoreSize | undefined = item.sizes[sizeIndex];
  return size?.imageUrl || item.image;
}

export function cartLineKey(
  item: { kind: string; name: string },
  sizeLabel: string
): string {
  const name = item.name.trim().toLowerCase().replace(/\s+/g, " ");
  const size = sizeLabel.trim().toLowerCase().replace(/\s+/g, " ");
  return `${item.kind}::${name}::${size}`;
}

export function toCartLine(item: StoreItem, sizeIndex = 0, qty = 1): CartLine {
  const sizeLabel = itemSizeLabel(item, sizeIndex);
  return {
    key: cartLineKey(item, sizeLabel),
    id: item.id,
    kind: item.kind,
    slug: item.slug,
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
    if (!Array.isArray(parsed)) return [];

    const merged = new Map<string, CartLine>();
    for (const value of parsed as CartLine[]) {
      if (
        !value ||
        typeof value.name !== "string" ||
        typeof value.sizeLabel !== "string" ||
        typeof value.qty !== "number"
      ) {
        continue;
      }

      const qty = Math.max(0, Math.round(value.qty));
      if (!qty) continue;

      const key = cartLineKey(value, value.sizeLabel);
      const existing = merged.get(key);
      if (existing) {
        existing.qty += qty;
      } else {
        merged.set(key, { ...value, key, qty });
      }
    }

    return Array.from(merged.values());
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
