import { randomBytes } from "crypto";
import type { NextRequest } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { getAdminSettings } from "@/lib/admin";
import { getPool } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/order-email";
import { priceOrderItems, type OrderItemInput } from "@/lib/order-pricing";

interface CodOrderRequest {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  address?: string;
  pincode?: string;
  state?: string;
  district?: string;
  items?: OrderItemInput[];
}

export async function POST(request: NextRequest) {
  const settings = await getAdminSettings();
  if (!settings.codEnabled) {
    return Response.json(
      { error: "Cash on delivery is not available." },
      { status: 403 }
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
    const body = (await request.json()) as CodOrderRequest;
    const customerName = body.customerName?.trim();
    const customerPhone = body.customerPhone?.trim();

    if (!customerName || !customerPhone) {
      return Response.json(
        { error: "Customer name and phone are required." },
        { status: 400 }
      );
    }

    const { lines, subtotalPaise } = await priceOrderItems(body.items ?? []);

    const fullAddress = [body.address, body.district, body.state, body.pincode]
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .filter(Boolean)
      .join(", ");

    const paymentId = `COD-${Date.now()}-${randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ONLINE', 'NEW', NULL, ?)`,
        [
          temporaryNumber,
          customerName,
          customerPhone,
          body.customerEmail?.trim() || null,
          fullAddress || null,
          subtotalPaise,
          subtotalPaise,
          paymentId,
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
        paymentId,
        razorpayOrderId: "",
        paymentMethod: "COD",
        lines,
        subtotalPaise,
      });
    } catch (error) {
      console.error("COD order confirmation email failed:", error);
    }

    return Response.json({
      success: true,
      message: "COD order placed",
      orderId: paymentId,
      paymentId,
      orderNumber,
      databaseOrderId: orderId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not place the order.";
    console.error("COD order creation error:", error);
    return Response.json({ error: message }, { status: 400 });
  }
}
