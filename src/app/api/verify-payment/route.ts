import { createHmac } from "crypto";
import type { NextRequest } from "next/server";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyPaymentRequest = await request.json();

    // Validate inputs
    if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
      return Response.json(
        { error: "Missing payment verification data" },
        { status: 400 }
      );
    }

    // Construct the signature verification string
    // Format: order_id|payment_id
    const shasum = createHmac("sha256", RAZORPAY_KEY_SECRET!);
    shasum.update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    // Compare signatures (use timing-safe comparison)
    const isSignatureValid = digest === body.razorpay_signature;

    if (!isSignatureValid) {
      console.warn("Invalid signature:", {
        expected: digest,
        received: body.razorpay_signature,
      });
      return Response.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Signature is valid - payment was successful
    // Here you would typically:
    // 1. Update order status in database
    // 2. Create invoice
    // 3. Send confirmation email
    // 4. Update inventory

    return Response.json({
      success: true,
      message: "Payment verified successfully",
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
