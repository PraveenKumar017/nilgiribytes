import { NextResponse } from "next/server";
import { getAdminSession, listCoupons, ensureCouponTable } from "@/lib/admin";
import { getPool } from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await ensureCouponTable();
    const coupons = await listCoupons();
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("Failed to list coupons:", error);
    return NextResponse.json({ error: "Failed to fetch coupons from database." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pool = getPool();
  if (!pool) {
    return NextResponse.json({ error: "Database not connected." }, { status: 500 });
  }

  await ensureCouponTable();

  try {
    const body = await request.json();
    const code = String(body.code ?? "").trim().toUpperCase().replace(/\s+/g, "");
    const title = String(body.title ?? "").trim();
    const discountType = body.discountType === "percentage" ? "percentage" : "fixed";
    const discountValue = Math.max(1, Math.round(Number(body.discountValue) || 0));
    const minOrderPaise = Math.max(0, Math.round(Number(body.minOrderPaise) || 0));
    const maxDiscountPaise =
      discountType === "percentage" && body.maxDiscountPaise
        ? Math.max(0, Math.round(Number(body.maxDiscountPaise)))
        : null;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "Offer description is required." }, { status: 400 });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO \`Coupon\` (\`code\`, \`title\`, \`discountType\`, \`discountValue\`, \`minOrderPaise\`, \`maxDiscountPaise\`, \`isActive\`, \`updatedAt\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3))`,
      [code, title, discountType, discountValue, minOrderPaise, maxDiscountPaise, isActive]
    );

    const insertedId = result.insertId;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, code, title, discountType, discountValue, minOrderPaise, maxDiscountPaise, isActive, createdAt, updatedAt
         FROM \`Coupon\`
        WHERE id = ?`,
      [insertedId]
    );

    const coupon = rows[0];
    return NextResponse.json({
      success: true,
      coupon: {
        id: Number(coupon.id),
        code: String(coupon.code),
        title: String(coupon.title),
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        minOrderPaise: Number(coupon.minOrderPaise),
        maxDiscountPaise: coupon.maxDiscountPaise !== null ? Number(coupon.maxDiscountPaise) : null,
        isActive: Boolean(coupon.isActive),
        createdAt: coupon.createdAt,
        updatedAt: coupon.updatedAt,
      },
    });
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "A coupon with this code already exists." }, { status: 400 });
    }
    console.error("Failed to create coupon:", error);
    return NextResponse.json({ error: error?.message || "Failed to create coupon in database." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pool = getPool();
  if (!pool) {
    return NextResponse.json({ error: "Database not connected." }, { status: 500 });
  }

  await ensureCouponTable();

  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id || id <= 0) {
      return NextResponse.json({ error: "Invalid coupon ID." }, { status: 400 });
    }

    // Quick toggle active only
    if (body.toggleActive !== undefined) {
      const isActive = Boolean(body.isActive);
      await pool.execute(
        `UPDATE \`Coupon\` SET \`isActive\` = ?, \`updatedAt\` = NOW(3) WHERE id = ?`,
        [isActive, id]
      );
      return NextResponse.json({ success: true, id, isActive });
    }

    // Full update
    const code = String(body.code ?? "").trim().toUpperCase().replace(/\s+/g, "");
    const title = String(body.title ?? "").trim();
    const discountType = body.discountType === "percentage" ? "percentage" : "fixed";
    const discountValue = Math.max(1, Math.round(Number(body.discountValue) || 0));
    const minOrderPaise = Math.max(0, Math.round(Number(body.minOrderPaise) || 0));
    const maxDiscountPaise =
      discountType === "percentage" && body.maxDiscountPaise
        ? Math.max(0, Math.round(Number(body.maxDiscountPaise)))
        : null;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "Offer description is required." }, { status: 400 });
    }

    await pool.execute(
      `UPDATE \`Coupon\`
          SET \`code\` = ?,
              \`title\` = ?,
              \`discountType\` = ?,
              \`discountValue\` = ?,
              \`minOrderPaise\` = ?,
              \`maxDiscountPaise\` = ?,
              \`isActive\` = ?,
              \`updatedAt\` = NOW(3)
        WHERE id = ?`,
      [code, title, discountType, discountValue, minOrderPaise, maxDiscountPaise, isActive, id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Another coupon already uses this code." }, { status: 400 });
    }
    console.error("Failed to update coupon:", error);
    return NextResponse.json({ error: error?.message || "Failed to update coupon in database." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pool = getPool();
  if (!pool) {
    return NextResponse.json({ error: "Database not connected." }, { status: 500 });
  }

  await ensureCouponTable();

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id || id <= 0) {
      return NextResponse.json({ error: "Invalid coupon ID." }, { status: 400 });
    }

    await pool.execute("DELETE FROM `Coupon` WHERE id = ?", [id]);
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("Failed to delete coupon:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete coupon." }, { status: 500 });
  }
}

