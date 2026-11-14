import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";
import { formatINR } from "./format";
import type { AppliedCoupon } from "./types";

type CouponRow = RowDataPacket & {
  id: number;
  code: string;
  title: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  minOrderPaise: number;
  maxDiscountPaise: number | null;
  isActive: number | boolean;
};

export function normalizeCouponCode(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function couponDiscountPaise(
  coupon: Pick<
    CouponRow,
    "discountType" | "discountValue" | "maxDiscountPaise"
  >,
  subtotalPaise: number
): number {
  if (subtotalPaise <= 0) return 0;

  const value = Math.max(0, Math.round(Number(coupon.discountValue) || 0));

  const rawDiscount =
    coupon.discountType === "percentage"
      ? Math.round((subtotalPaise * value) / 100)
      : value * 100;

  const capped =
    coupon.discountType === "percentage" &&
    coupon.maxDiscountPaise !== null &&
    coupon.maxDiscountPaise !== undefined
      ? Math.min(rawDiscount, Math.max(0, Number(coupon.maxDiscountPaise)))
      : rawDiscount;

  return Math.min(subtotalPaise, Math.max(0, capped));
}

export async function applyCoupon(
  code: unknown,
  subtotalPaise: number
): Promise<AppliedCoupon> {
  const normalized = normalizeCouponCode(code);
  if (!normalized) {
    throw new Error("Enter a coupon code.");
  }

  const pool = getPool();
  if (!pool) {
    throw new Error("Coupon service is temporarily unavailable.");
  }

  const [rows] = await pool.query<CouponRow[]>(
    `SELECT id, code, title, discountType, discountValue, minOrderPaise, maxDiscountPaise, isActive
       FROM \`Coupon\`
      WHERE code = ?
      LIMIT 1`,
    [normalized]
  );

  const coupon = rows[0];
  if (!coupon || !Boolean(coupon.isActive)) {
    throw new Error("Invalid or expired coupon code.");
  }

  const minOrderPaise = Math.max(0, Number(coupon.minOrderPaise) || 0);
  if (subtotalPaise < minOrderPaise) {
    const shortfall = minOrderPaise - subtotalPaise;
    throw new Error(
      `This coupon needs a minimum order of ${formatINR(
        minOrderPaise
      )}. Add ${formatINR(shortfall)} more to use it.`
    );
  }

  const discountPaise = couponDiscountPaise(coupon, subtotalPaise);
  if (discountPaise <= 0) {
    throw new Error("This coupon cannot be applied to your order.");
  }

  return {
    code: String(coupon.code),
    title: String(coupon.title),
    discountType: coupon.discountType === "percentage" ? "percentage" : "fixed",
    discountValue: Number(coupon.discountValue),
    minOrderPaise,
    maxDiscountPaise:
      coupon.maxDiscountPaise !== null ? Number(coupon.maxDiscountPaise) : null,
    discountPaise,
  };
}
