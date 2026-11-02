import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";

export type OrderItemInput = {
  kind?: string;
  slug?: string;
  sizeLabel?: string | null;
  quantity: number;
};

export type PricedOrderLine = {
  kind: "product" | "combo";
  productId: number | null;
  comboId: number | null;
  name: string;
  sizeLabel: string | null;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
};

export type PricedOrder = {
  lines: PricedOrderLine[];
  subtotalPaise: number;
};

type ProductPriceRow = RowDataPacket & {
  id: number;
  name: string;
  sizes: unknown;
};

type ComboPriceRow = RowDataPacket & {
  id: number;
  name: string;
  pricePaise: number;
  discountPercent: number;
  weightLabel: string | null;
};

type SizeJson = {
  label?: string;
  pricePaise?: number;
};

const MAX_LINES = 50;

function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toPositiveInteger(value: unknown, label: string): number {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`Invalid ${label}.`);
  }
  return number;
}

export async function priceOrderItems(
  items: OrderItemInput[]
): Promise<PricedOrder> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  if (items.length > MAX_LINES) {
    throw new Error("Too many items in the cart.");
  }

  const pool = getPool();
  if (!pool) {
    throw new Error("Order service is temporarily unavailable.");
  }

  const lines: PricedOrderLine[] = [];

  for (const item of items) {
    const kind = item.kind;
    const slug = typeof item.slug === "string" ? item.slug.trim() : "";

    if (kind !== "product" && kind !== "combo") {
      throw new Error("Invalid cart item.");
    }

    if (!slug) {
      throw new Error("Your cart is out of date. Please add the item again.");
    }

    const quantity = toPositiveInteger(item.quantity, "quantity");

    const sizeLabel =
      typeof item.sizeLabel === "string" && item.sizeLabel.trim()
        ? item.sizeLabel.trim()
        : null;

    if (kind === "combo") {
      const [rows] = await pool.query<ComboPriceRow[]>(
        `SELECT id, name, pricePaise, discountPercent, weightLabel
           FROM Combo
          WHERE slug = ?
          LIMIT 1`,
        [slug]
      );

      const combo = rows[0];
      if (!combo) {
        throw new Error("A combo in your cart is no longer available.");
      }

      const mrpPaise = toPositiveInteger(combo.pricePaise, "combo price");
      const discount = Math.min(
        100,
        Math.max(0, Number(combo.discountPercent ?? 0))
      );
      const unitPricePaise = Math.round((mrpPaise * (100 - discount)) / 100);

      lines.push({
        kind: "combo",
        productId: null,
        comboId: Number(combo.id),
        name: String(combo.name),
        sizeLabel: combo.weightLabel ?? sizeLabel,
        unitPricePaise,
        quantity,
        lineTotalPaise: unitPricePaise * quantity,
      });
      continue;
    }

    const [rows] = await pool.query<ProductPriceRow[]>(
      `SELECT id, name, sizes
         FROM Product
        WHERE slug = ?
        LIMIT 1`,
      [slug]
    );

    const product = rows[0];
    if (!product) {
      throw new Error("A product in your cart is no longer available.");
    }

    const sizes = parseJsonArray<SizeJson>(product.sizes);
    const size = sizeLabel
      ? sizes.find((entry) => String(entry.label) === sizeLabel)
      : sizes[0];

    if (!size) {
      throw new Error(
        "A selected size in your cart is no longer available. Please choose it again."
      );
    }

    const unitPricePaise = toPositiveInteger(size.pricePaise, "product price");

    lines.push({
      kind: "product",
      productId: Number(product.id),
      comboId: null,
      name: String(product.name),
      sizeLabel: size.label ? String(size.label) : sizeLabel,
      unitPricePaise,
      quantity,
      lineTotalPaise: unitPricePaise * quantity,
    });
  }

  const subtotalPaise = lines.reduce(
    (sum, line) => sum + line.lineTotalPaise,
    0
  );

  if (subtotalPaise <= 0) {
    throw new Error("Order total must be greater than zero.");
  }

  return { lines, subtotalPaise };
}
