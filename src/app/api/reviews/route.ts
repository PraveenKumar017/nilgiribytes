import type { RowDataPacket } from "mysql2";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPool } from "@/lib/db";
import { CUSTOM_COMBO_SLUG } from "@/lib/types";

export const runtime = "nodejs";

const reviewSchema = z.object({
  itemSlug: z.string().trim().min(1).max(200),
  rating: z.number().int().min(1).max(5),
  authorName: z.string().trim().min(2).max(160),
  location: z.string().trim().min(2).max(160),
  reviewText: z.string().trim().min(10).max(2000),
  website: z.string().max(200).optional().default(""),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check your review details and try again." },
      { status: 400 },
    );
  }

  const review = parsed.data;
  if (review.website) {
    return NextResponse.json({ ok: true });
  }

  const pool = getPool();
  if (!pool) {
    return NextResponse.json(
      { error: "Reviews are unavailable right now. Please try again later." },
      { status: 503 },
    );
  }

  try {
    if (review.itemSlug !== CUSTOM_COMBO_SLUG) {
      const [itemRows] = await pool.query<RowDataPacket[]>(
        "SELECT slug FROM Product WHERE slug = ? UNION SELECT slug FROM Combo WHERE slug = ? LIMIT 1",
        [review.itemSlug, review.itemSlug],
      );
      if (itemRows.length === 0) {
        return NextResponse.json(
          { error: "Invalid item selected." },
          { status: 400 },
        );
      }
    }

    const [sortRows] = await pool.query<RowDataPacket[]>(
      "SELECT COALESCE(MIN(sortOrder), 0) AS minSortOrder FROM ProductReview"
    );
    const sortOrder = Number(sortRows[0]?.minSortOrder ?? 0) - 1;

    await pool.execute(
      `INSERT INTO ProductReview
          (itemSlug, rating, authorName, location, reviewText, isVisible, sortOrder, updatedAt)
       VALUES (?, ?, ?, ?, ?, FALSE, ?, NOW(3))`,
      [
        review.itemSlug,
        review.rating,
        review.authorName,
        review.location || null,
        review.reviewText,
        sortOrder,
      ],
    );
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;
    if (code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "You have already submitted a review for this item." },
        { status: 409 },
      );
    }
    console.error("Failed to submit review", error);
    return NextResponse.json(
      { error: "We could not save your review. Please try again." },
      { status: 500 },
    );
  }

  revalidatePath("/");
  revalidatePath("/shop");

  return NextResponse.json({ ok: true });
}
