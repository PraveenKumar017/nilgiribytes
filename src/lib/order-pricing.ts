import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";
import {
  customComboPricePaise,
  CUSTOM_COMBO_PACK_WEIGHT_GRAMS,
} from "./custom-combo";
import {
  packedWeightForPackGrams,
  packedWeightFromLabel,
  parseWeightGrams,
} from "./shipping";
import {
  CUSTOM_COMBO_MAX_PACKS,
  CUSTOM_COMBO_MIN_PACKS,
  CUSTOM_COMBO_PACK_LABEL,
  CUSTOM_COMBO_SLUG,
} from "./types";

export type OrderItemInput = {
  kind?: string;
  slug?: string;
  sizeLabel?: string | null;
  quantity: number;
  picks?: { slug?: string }[] | null;
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
  packedWeightGrams: number;
};

export type PricedOrder = {
  lines: PricedOrderLine[];
  subtotalPaise: number;
};

type ProductPriceRow = RowDataPacket & {
  id: number;
  slug: string;
  name: string;
  sizes: unknown;
};

type ComboPriceRow = RowDataPacket & {
  id: number;
  name: string;
  mrpPaise?: number | null;
  pricePaise: number;
  discountPercent: number;
  weightLabel: string | null;
  items: unknown;
};

type ComboItemJson = {
  quantity?: string;
};

type SizeJson = {
  label?: string;
  grams?: number | null;
  pricePaise?: number;
};

const KNOWN_COMBO_PRICE_PAISE: Record<string, number> = {
  "trial-combo": 26900,
  "tea-time-combo": 64900,
  "family-combo": 69900,
  "ooty-duo-combo": 34900,
};

function packedWeightForCombo(
  items: unknown,
  weightLabel: string | null
): number {
  const fromItems = parseJsonArray<ComboItemJson>(items).reduce(
    (sum, item) => {
      const grams = parseWeightGrams(item.quantity);
      return grams ? sum + packedWeightForPackGrams(grams) : sum;
    },
    0
  );

  return fromItems || packedWeightFromLabel(weightLabel);
}

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
  let customComboCount = 0;

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

    if (kind === "combo" && slug === CUSTOM_COMBO_SLUG) {
      customComboCount += quantity;
      if (customComboCount > 1) {
        throw new Error("Only 1 Build Your Own Combo is allowed per order.");
      }

      const pickSlugs = (Array.isArray(item.picks) ? item.picks : [])
        .map((pick) =>
          typeof pick?.slug === "string" ? pick.slug.trim() : ""
        )
        .filter(Boolean);

      if (
        pickSlugs.length < CUSTOM_COMBO_MIN_PACKS ||
        pickSlugs.length > CUSTOM_COMBO_MAX_PACKS
      ) {
        throw new Error(
          `Choose ${CUSTOM_COMBO_MIN_PACKS} to ${CUSTOM_COMBO_MAX_PACKS} varieties for your custom combo.`
        );
      }

      const uniqueSlugs = [...new Set(pickSlugs)];
      const [productRows] = await pool.query<ProductPriceRow[]>(
        `SELECT id, slug, name, sizes
           FROM Product
          WHERE slug IN (?)`,
        [uniqueSlugs]
      );

      const productsBySlug = new Map(
        productRows.map((row) => [String(row.slug), row])
      );

      let unitPricePaise = customComboPricePaise(pickSlugs.length);

      for (const pickSlug of pickSlugs) {
        const product = productsBySlug.get(pickSlug);
        if (!product) {
          throw new Error(
            "A product in your custom combo is no longer available."
          );
        }

        const sizes = parseJsonArray<SizeJson>(product.sizes);
        const size = sizes.find(
          (entry) => String(entry.label) === CUSTOM_COMBO_PACK_LABEL
        );

        if (!size) {
          throw new Error(
            `${String(product.name)} (${CUSTOM_COMBO_PACK_LABEL}) is no longer available.`
          );
        }
      }

      if (!unitPricePaise) {
        throw new Error("This combo size is not available.");
      }

      lines.push({
        kind: "combo",
        productId: null,
        comboId: null,
        name: "Build Your Own Combo",
        sizeLabel: `${pickSlugs.length} \u00d7 ${CUSTOM_COMBO_PACK_LABEL}`,
        unitPricePaise,
        quantity,
        lineTotalPaise: unitPricePaise * quantity,
        packedWeightGrams:
          pickSlugs.length *
          packedWeightForPackGrams(CUSTOM_COMBO_PACK_WEIGHT_GRAMS),
      });
      continue;
    }

    if (kind === "combo") {
      const [rows] = await pool.query<ComboPriceRow[]>(
        `SELECT *
           FROM Combo
          WHERE slug = ?
          LIMIT 1`,
        [slug]
      );

      const combo = rows[0];
      if (!combo) {
        throw new Error("A combo in your cart is no longer available.");
      }

      let unitPricePaise: number;
      if (combo.mrpPaise && Number(combo.mrpPaise) > Number(combo.pricePaise)) {
        unitPricePaise = Number(combo.pricePaise);
      } else if (slug && KNOWN_COMBO_PRICE_PAISE[slug]) {
        unitPricePaise = KNOWN_COMBO_PRICE_PAISE[slug];
      } else {
        const mrpPaise = toPositiveInteger(combo.pricePaise, "combo price");
        const discount = Math.min(
          100,
          Math.max(0, Number(combo.discountPercent ?? 0))
        );
        unitPricePaise = Math.round((mrpPaise * (100 - discount)) / 100);
      }

      lines.push({
        kind: "combo",
        productId: null,
        comboId: Number(combo.id),
        name: String(combo.name),
        sizeLabel: combo.weightLabel ?? sizeLabel,
        unitPricePaise,
        quantity,
        lineTotalPaise: unitPricePaise * quantity,
        packedWeightGrams: packedWeightForCombo(
          combo.items,
          combo.weightLabel
        ),
      });
      continue;
    }

    const [rows] = await pool.query<ProductPriceRow[]>(
      `SELECT id, slug, name, sizes
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
    const sizeGrams = size.grams ?? parseWeightGrams(size.label);

    lines.push({
      kind: "product",
      productId: Number(product.id),
      comboId: null,
      name: String(product.name),
      sizeLabel: size.label ? String(size.label) : sizeLabel,
      unitPricePaise,
      quantity,
      lineTotalPaise: unitPricePaise * quantity,
      packedWeightGrams: packedWeightForPackGrams(sizeGrams),
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
