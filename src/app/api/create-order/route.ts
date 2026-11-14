import type { NextRequest } from "next/server";
import { applyCoupon } from "@/lib/coupons";
import { ensureOrderShippingColumns } from "@/lib/order-shipping";
import { priceOrderItems, type OrderItemInput } from "@/lib/order-pricing";
import { getShippingQuote } from "@/lib/shipping";

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

interface CreateOrderRequest {
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  state?: string;
  couponCode?: string;
  items?: OrderItemInput[];
}

interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error("Missing Razorpay credentials");
      return Response.json(
        { error: "Payment gateway is not configured." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as CreateOrderRequest;
    await ensureOrderShippingColumns();

    const { lines, subtotalPaise } = await priceOrderItems(body.items ?? []);

    const shipping = getShippingQuote(body.state, subtotalPaise, lines);
    if (!shipping) {
      return Response.json(
        { error: "Select a valid delivery state to calculate shipping." },
        { status: 400 }
      );
    }

    const coupon = body.couponCode
      ? await applyCoupon(body.couponCode, subtotalPaise)
      : null;
    const discountPaise = coupon?.discountPaise ?? 0;
    const totalPaise =
      Math.max(0, subtotalPaise - discountPaise) + shipping.shippingPaise;

    if (totalPaise < 100) {
      return Response.json(
        { error: "Order total must be at least \u20b91 after discount." },
        { status: 400 }
      );
    }

    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
        ).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: totalPaise,
        currency: "INR",
        receipt: `nb_${Date.now()}`,
        notes: {
          customer_name: body.customerName?.trim() || "Customer",
          customer_email: body.customerEmail?.trim() || "not_provided",
          customer_phone: body.customerPhone?.trim() || "not_provided",
          coupon_code: coupon?.code || "not_applied",
        },
      }),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.json().catch(() => null);
      console.error("Razorpay order creation failed:", error);
      return Response.json(
        { error: "Unable to start payment. Please try again." },
        { status: 502 }
      );
    }

    const order = (await orderResponse.json()) as RazorpayOrderResponse;

    return Response.json({
      success: true,
      orderId: order.id,
      amount: totalPaise / 100,
      amountInPaise: totalPaise,
      subtotalPaise,
      discountPaise,
      shippingPaise: shipping.shippingPaise,
      shippingDiscountPaise: shipping.shippingDiscountPaise,
      couponCode: coupon?.code ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create order.";
    console.error("Order creation error:", error);
    return Response.json({ error: message }, { status: 400 });
  }
}
