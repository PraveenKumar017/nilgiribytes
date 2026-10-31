import { createHmac } from "crypto";
import type { NextRequest } from "next/server";

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

interface CreateOrderRequest {
  amount: number; // in rupees (will be converted to paise)
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string | null;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Create order request body:", body);

    // Validate input - relaxed for testing
    if (!body.amount || body.amount <= 0) {
      return Response.json(
        { error: "Invalid amount: " + body.amount },
        { status: 400 }
      );
    }

    // Log environment variables to debug
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error("Missing Razorpay credentials");
      return Response.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Convert rupees to paise (multiply by 100)
    const amountInPaise = Math.round(body.amount * 100);

    console.log("Creating Razorpay order with amount:", amountInPaise, "paise");

    // Create order via Razorpay API
    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
        ).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `order_${Date.now()}`,
        description: body.description || "Nilgiribytes Order",
        notes: {
          customer_name: body.customerName || "Customer",
          customer_email: body.customerEmail || "not_provided",
        },
      }),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.json();
      console.error("Razorpay API error:", error);
      return Response.json(
        { error: "Failed to create order: " + JSON.stringify(error) },
        { status: 500 }
      );
    }

    const order: RazorpayOrderResponse = await orderResponse.json();

    console.log("Order created successfully:", order.id);

    return Response.json({
      success: true,
      orderId: order.id,
      amount: body.amount,
      amountInPaise: amountInPaise,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return Response.json(
      { error: "Internal server error: " + String(error) },
      { status: 500 }
    );
  }
}
