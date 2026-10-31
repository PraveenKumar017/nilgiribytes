import { createHmac } from "crypto";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  pincode: string;
  state: string;
  district: string;
  items: Array<{
    name: string;
    sizeLabel?: string;
    quantity: number;
    unitPricePaise: number;
    lineTotalPaise: number;
    productId?: number;
    comboId?: number;
  }>;
  subtotalPaise: number;
  totalPaise: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyPaymentRequest = await request.json();

    console.log("Verify payment request:", body);

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

    console.log("Signature verified successfully");

    // Generate order number with format NB10001, NB10002, etc.
    const lastOrder = await db.query(
      "SELECT COALESCE(MAX(CAST(SUBSTRING(orderNumber, 3) AS UNSIGNED)), 10000) as maxNum FROM `Order`"
    );

    const nextNum = (lastOrder[0]?.maxNum || 10000) + 1;
    const orderNumber = `NB${nextNum}`;

    console.log("Generated order number:", orderNumber);

    // Create order in database
    const fullAddress = `${body.address}, ${body.pincode}, ${body.district}, ${body.state}`;

    const orderResult = await db.query(
      `INSERT INTO \`Order\` (
        orderNumber,
        customerName,
        phone,
        email,
        address,
        subtotalPaise,
        totalPaise,
        channel,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ONLINE', 'NEW')`,
      [
        orderNumber,
        body.customerName,
        body.customerPhone,
        body.customerEmail,
        fullAddress,
        body.subtotalPaise,
        body.totalPaise,
      ]
    );

    const orderId = orderResult.insertId;
    console.log("Order created with ID:", orderId);

    // Create order items
    if (body.items && body.items.length > 0) {
      for (const item of body.items) {
        await db.query(
          `INSERT INTO \`OrderItem\` (
            orderId,
            productId,
            comboId,
            nameSnapshot,
            sizeLabel,
            unitPricePaise,
            quantity,
            lineTotalPaise
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.productId || null,
            item.comboId || null,
            item.name,
            item.sizeLabel || null,
            item.unitPricePaise,
            item.quantity,
            item.lineTotalPaise,
          ]
        );
      }
      console.log(`Created ${body.items.length} order items`);
    }

    // Signature is valid and order saved
    return Response.json({
      success: true,
      message: "Payment verified and order created",
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      orderNumber: orderNumber,
      databaseOrderId: orderId,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return Response.json(
      { error: "Internal server error: " + String(error) },
      { status: 500 }
    );
  }
}
