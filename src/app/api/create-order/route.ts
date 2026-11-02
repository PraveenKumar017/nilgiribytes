import type { NextRequest } from "next/server";
import { priceOrderItems, type OrderItemInput } from "@/lib/order-pricing";

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

interface CreateOrderRequest {
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
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
    const { subtotalPaise } = await priceOrderItems(body.items ?? []);

    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
        ).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: subtotalPaise,
        currency: "INR",
        receipt: `nb_${Date.now()}`,
        notes: {
          customer_name: body.customerName?.trim() || "Customer",
          customer_email: body.customerEmail?.trim() || "not_provided",
          customer_phone: body.customerPhone?.trim() || "not_provided",
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
      amount: subtotalPaise / 100,
      amountInPaise: subtotalPaise,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create order.";
    console.error("Order creation error:", error);
    return Response.json({ error: message }, { status: 400 });
  }
}
