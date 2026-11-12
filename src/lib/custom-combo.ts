import {
  CUSTOM_COMBO_MAX_PACKS,
  CUSTOM_COMBO_MIN_PACKS,
} from "./types";

export const CUSTOM_COMBO_PACK_WEIGHT_GRAMS = 250;

export const CUSTOM_COMBO_PACK_COUNTS = Array.from(
  { length: CUSTOM_COMBO_MAX_PACKS - CUSTOM_COMBO_MIN_PACKS + 1 },
  (_, index) => CUSTOM_COMBO_MIN_PACKS + index
);

export const CUSTOM_COMBO_TIERS: Record<number, number> = {
  4: 67900,
  5: 84900,
  6: 102900,
  7: 119900,
  8: 134900,
};

export const CUSTOM_COMBO_MRP_TIERS: Record<number, number> = {
  4: 119600,
  5: 149500,
  6: 179400,
  7: 209300,
  8: 239200,
};

export function customComboPricePaise(packCount: number): number {
  return CUSTOM_COMBO_TIERS[packCount] ?? 0;
}

export function customComboMrpPaise(packCount: number): number {
  return CUSTOM_COMBO_MRP_TIERS[packCount] ?? 0;
}

export function customComboWeightLabel(packCount: number): string {
  const kg = (packCount * CUSTOM_COMBO_PACK_WEIGHT_GRAMS) / 1000;
  return `${kg}kg`;
}
