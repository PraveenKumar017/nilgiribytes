import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { applyCoupon } from "@/lib/coupons";
import { getPool } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/order-email";
import { priceOrderItems, type OrderItemInput } from "@/lib/order-pricing";

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
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
  couponCode?: string;
  items?: OrderItemInput[];
}

interface RazorpayPayment {
  id: string;
  order_id: string;
  status: string;
  amount: number;
  currency: string;
  captured: boolean;
}

interface ExistingOrderRow extends RowDataPacket {
  id: number;
  orderNumber: string;
}

function razorpayAuthHeader(): string {
  return `Basic ${Buffer.from(
    `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
  ).toString("base64")}`;
}

function isValidSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expected = createHmac("sha256", RAZORPAY_KEY_SECRET as string)
    .update(`${orderId}|${paymentId}`)
    .digest();
  const received = Buffer.from(signature, "hex");

  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

async function findExistingOrder(
  paymentId: string,
  razorpayOrderId: string
): Promise<ExistingOrderRow | null> {
  const pool = getPool();
  if (!pool) return null;

  const [rows] = await pool.query<ExistingOrderRow[]>(
    `SELECT id, orderNumber
       FROM \`Order\`
      WHERE paymentId = ? OR razorpayOrderId = ?
      ORDER BY id ASC
      LIMIT 1`,
    [paymentId, razorpayOrderId]
  );

  return rows[0] ?? null;
}

export async function POST(request: NextRequest) {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.error("Missing Razorpay credentials");
    return Response.json(
      { error: "Payment gateway is not configured." },
      { status: 500 }
    );
  }

  const pool = getPool();
  if (!pool) {
    return Response.json(
      { error: "Order service is temporarily unavailable." },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as VerifyPaymentRequest;

    if (
      !body.razorpay_order_id ||
      !body.razorpay_payment_id ||
      !body.razorpay_signature
    ) {
      return Response.json(
        { error: "Missing payment verification data." },
        { status: 400 }
      );
    }

    if (!isValidSignature(
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature
    )) {
      console.warn("Invalid Razorpay signature", {
        orderId: body.razorpay_order_id,
        paymentId: body.razorpay_payment_id,
      });
      return Response.json(
        { error: "Payment verification failed." },
        { status: 400 }
      );
    }

    const existing = await findExistingOrder(
      body.razorpay_payment_id,
      body.razorpay_order_id
    );

    if (existing) {
      return Response.json({
        success: true,
        message: "Payment already verified",
        orderId: body.razorpay_order_id,
        paymentId: body.razorpay_payment_id,
        orderNumber: existing.orderNumber,
        databaseOrderId: existing.id,
      });
    }

    const { lines, subtotalPaise } = await priceOrderItems(body.items ?? []);

    const coupon = body.couponCode
      ? await applyCoupon(body.couponCode, subtotalPaise)
      : null;
    const discountPaise = coupon?.discountPaise ?? 0;
    const totalPaise = Math.max(0, subtotalPaise - discountPaise);

    const paymentResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(
        body.razorpay_payment_id
      )}`,
      {
        headers: {
          Authorization: razorpayAuthHeader(),
        },
      }
    );

    if (!paymentResponse.ok) {
      console.error("Unable to fetch Razorpay payment", paymentResponse.status);
      return Response.json(
        { error: "Unable to confirm payment with Razorpay." },
        { status: 502 }
      );
    }

    const payment = (await paymentResponse.json()) as RazorpayPayment;

    if (payment.order_id !== body.razorpay_order_id) {
      return Response.json(
        { error: "Payment does not match this order." },
        { status: 400 }
      );
    }

    if (Number(payment.amount) !== totalPaise) {
      console.error("Payment amount mismatch", {
        expected: totalPaise,
        received: Number(payment.amount),
      });
      return Response.json(
        { error: "Payment amount does not match the order total." },
        { status: 400 }
      );
    }

    if (payment.status === "authorized") {
      const captureResponse = await fetch(
        `https://api.razorpay.com/v1/payments/${encodeURIComponent(
          body.razorpay_payment_id
        )}/capture`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: razorpayAuthHeader(),
          },
          body: JSON.stringify({
            amount: totalPaise,
            currency: "INR",
          }),
        }
      );

      if (!captureResponse.ok) {
        console.error("Unable to capture Razorpay payment", captureResponse.status);
        return Response.json(
          { error: "Payment could not be captured. Please contact support." },
          { status: 502 }
        );
      }
    } else if (payment.status !== "captured") {
      return Response.json(
        { error: "Payment was not completed." },
        { status: 400 }
      );
    }

    const customerName = body.customerName?.trim();
    const customerPhone = body.customerPhone?.trim();

    if (!customerName || !customerPhone) {
      return Response.json(
        { error: "Customer name and phone are required." },
        { status: 400 }
      );
    }

    const fullAddress = [body.address, body.district, body.state, body.pincode]
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .filter(Boolean)
      .join(", ");

    const connection = await pool.getConnection();
    let orderNumber = "";
    let orderId = 0;

    try {
      await connection.beginTransaction();

      const temporaryNumber = `TMP${Date.now()}${Math.floor(
        Math.random() * 1000
      )}`;

      const [orderResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO \`Order\` (
          orderNumber,
          customerName,
          phone,
          email,
          address,
          subtotalPaise,
          totalPaise,
          channel,
          status,
          razorpayOrderId,
          paymentId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ONLINE', 'NEW', ?, ?)`,
        [
          temporaryNumber,
          customerName,
          customerPhone,
          body.customerEmail?.trim() || null,
          fullAddress || null,
          subtotalPaise,
          totalPaise,
          body.razorpay_order_id,
          body.razorpay_payment_id,
        ]
      );

      orderId = orderResult.insertId;
      orderNumber = `NB${10000 + orderId}`;

      await connection.execute(
        "UPDATE `Order` SET orderNumber = ? WHERE id = ?",
        [orderNumber, orderId]
      );

      for (const line of lines) {
        await connection.execute(
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
            line.productId,
            line.comboId,
            line.name,
            line.sizeLabel,
            line.unitPricePaise,
            line.quantity,
            line.lineTotalPaise,
          ]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();

      const code = (error as { code?: string }).code;
      if (code === "ER_DUP_ENTRY") {
        const duplicate = await findExistingOrder(
          body.razorpay_payment_id,
          body.razorpay_order_id
        );

        if (duplicate) {
          return Response.json({
            success: true,
            message: "Payment already verified",
            orderId: body.razorpay_order_id,
            paymentId: body.razorpay_payment_id,
            orderNumber: duplicate.orderNumber,
            databaseOrderId: duplicate.id,
          });
        }
      }

      throw error;
    } finally {
      connection.release();
    }

    try {
      await sendOrderConfirmationEmail({
        customerName,
        customerEmail: body.customerEmail,
        customerPhone,
        address: fullAddress || null,
        orderNumber,
        paymentId: body.razorpay_payment_id,
        razorpayOrderId: body.razorpay_order_id,
        lines,
        subtotalPaise: totalPaise,
      });
    } catch (error) {
      console.error("Order confirmation email failed:", error);
    }

    return Response.json({
      success: true,
      message: "Payment verified and order created",
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      orderNumber,
      databaseOrderId: orderId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Payment verification failed.";
    console.error("Payment verification error:", error);
    return Response.json({ error: message }, { status: 400 });
  }
}
