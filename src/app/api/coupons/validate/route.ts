import type { NextRequest } from "next/server";
import { applyCoupon } from "@/lib/coupons";
import { priceOrderItems, type OrderItemInput } from "@/lib/order-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ValidateCouponRequest {
  code?: string;
  items?: OrderItemInput[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ValidateCouponRequest;

    const { subtotalPaise } = await priceOrderItems(body.items ?? []);
    const coupon = await applyCoupon(body.code, subtotalPaise);

    return Response.json({
      success: true,
      coupon,
      subtotalPaise,
      discountPaise: coupon.discountPaise,
      totalPaise: Math.max(0, subtotalPaise - coupon.discountPaise),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not apply this coupon.";
    return Response.json({ error: message }, { status: 400 });
  }
}
