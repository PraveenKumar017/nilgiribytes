"use server";

import type { RowDataPacket } from "mysql2";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  categorySchema,
  comboSchema,
  errorCode,
  firstIssue,
  formBool,
  formInt,
  formText,
  loginAdmin,
  logoutAdmin,
  orderStatusSchema,
  parseHidden,
  postSchema,
  postStatusSchema,
  productSchema,
  revalidateStorefront,
  requireAdmin,
  settingsSchema,
  type ActionState,
  type LoginState,
  type ProductInput,
} from "@/lib/admin";
import { getPool } from "@/lib/db";

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export async function loginAction(
  _previous: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = formText(formData, "username");
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Enter your username and password." };
  }

  const error = await loginAdmin(username, password);
  if (error) return { error };

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await logoutAdmin();
  redirect("/admin/login");
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                 */
/* -------------------------------------------------------------------------- */

function readCategory(formData: FormData) {
  return {
    name: formText(formData, "name"),
    sortOrder: formInt(formData, "sortOrder"),
  };
}

export async function createCategoryAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = categorySchema.safeParse(readCategory(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const pool = getPool();
  if (!pool) return { error: "Database is not configured." };

  try {
    await pool.execute(
      `INSERT INTO Category (name, sortOrder, updatedAt)
       VALUES (?, ?, NOW(3))`,
      [parsed.data.name, parsed.data.sortOrder]
    );
  } catch (error) {
    if (errorCode(error) === "ER_DUP_ENTRY") {
      return { error: "A category with that name already exists." };
    }
    throw error;
  }

  redirect("/admin/categories?created=1");
}

export async function updateCategoryAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const id = formInt(formData, "id");
  if (!id) return { error: "Category not found." };

  const parsed = categorySchema.safeParse(readCategory(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const pool = getPool();
  if (!pool) return { error: "Database is not configured." };

  try {
    await pool.execute(
      `UPDATE Category
          SET name = ?, sortOrder = ?, updatedAt = NOW(3)
        WHERE id = ?`,
      [parsed.data.name, parsed.data.sortOrder, id]
    );
  } catch (error) {
    if (errorCode(error) === "ER_DUP_ENTRY") {
      return { error: "A category with that name already exists." };
    }
    throw error;
  }

  redirect(`/admin/categories?id=${id}&updated=1`);
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const pool = getPool();
  if (!pool || !Number.isFinite(id) || id <= 0) {
    redirect("/admin/categories?error=not-found");
  }

  let blocked = false;
  try {
    await pool.execute("DELETE FROM Category WHERE id = ?", [id]);
  } catch (error) {
    if (errorCode(error) === "ER_ROW_IS_REFERENCED_2") {
      blocked = true;
    } else {
      throw error;
    }
  }

  redirect(blocked ? "/admin/categories?error=in-use" : "/admin/categories?deleted=1");
}

/* -------------------------------------------------------------------------- */
/* Products                                                                   */
/* -------------------------------------------------------------------------- */

type RawSize = {
  label?: unknown;
  grams?: unknown;
  mrpPaise?: unknown;
  pricePaise?: unknown;
  images?: unknown;
  imageUrl?: unknown;
};

function slugifyName(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product"
  );
}

async function uniqueProductSlug(base: string): Promise<string> {
  const pool = getPool();
  const normalized = base || "product";
  let candidate = normalized;
  let suffix = 2;

  if (!pool) return candidate;

  while (true) {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM Product WHERE slug = ? LIMIT 1",
      [candidate]
    );
    if (!rows.length) return candidate;
    candidate = `${normalized}-${suffix++}`;
  }
}

async function uniqueComboSlug(base: string): Promise<string> {
  const pool = getPool();
  const normalized = base || "combo";
  let candidate = normalized;
  let suffix = 2;

  if (!pool) return candidate;

  while (true) {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM Combo WHERE slug = ? LIMIT 1",
      [candidate]
    );
    if (!rows.length) return candidate;
    candidate = `${normalized}-${suffix++}`;
  }
}

function readProduct(formData: FormData) {
  const rawSizes = parseHidden<RawSize[]>(formData, "sizes", []);
  const rawImages = parseHidden<(string | null)[]>(formData, "images", []);
  const name = formText(formData, "name");
  const ratingRaw = formText(formData, "rating");
  const rating = ratingRaw === "" ? 4.3 : Number(ratingRaw);
  const images = rawImages.filter(
    (image): image is string => typeof image === "string" && image.trim() !== ""
  );

  return {
    slug: formText(formData, "slug") || slugifyName(name),
    name,
    description: formText(formData, "description"),
    ingredients: formText(formData, "ingredients") || null,
    shelfLife: formText(formData, "shelfLife") || null,
    categoryId: formInt(formData, "categoryId"),
    sizes: rawSizes.map((size) => {
      const sizeImages = Array.isArray(size.images)
        ? size.images.filter(
            (image): image is string =>
              typeof image === "string" && image.trim() !== ""
          )
        : [];
      const legacyImage =
        typeof size.imageUrl === "string" && size.imageUrl.trim() !== ""
          ? size.imageUrl
          : null;

      if (!sizeImages.length && legacyImage) sizeImages.push(legacyImage);

      return {
        label: typeof size.label === "string" ? size.label : "",
        grams:
          size.grams == null || size.grams === "" ? null : Number(size.grams),
        mrpPaise: Number(size.mrpPaise ?? 0),
        pricePaise: Number(size.pricePaise ?? 0),
        images: sizeImages.slice(0, 3),
        imageUrl: sizeImages[0] ?? null,
      };
    }),
    images,
    sortOrder: formInt(formData, "sortOrder"),
    rating: Number.isFinite(rating) ? rating : 4.3,
  };
}

function sizesForStorage(data: ProductInput) {
  return data.sizes.map((size) => ({
    label: size.label,
    grams: size.grams,
    mrpPaise: size.mrpPaise,
    discountPercent:
      size.mrpPaise > size.pricePaise && size.mrpPaise > 0
        ? Math.round(((size.mrpPaise - size.pricePaise) / size.mrpPaise) * 100)
        : 0,
    pricePaise: size.pricePaise,
    images: size.images,
    imageUrl: size.images[0] ?? null,
  }));
}

export async function createProductAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const requestedSlug = formText(formData, "slug");
  const parsed = productSchema.safeParse(readProduct(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const pool = getPool();
  if (!pool) return { error: "Database is not configured." };

  const data = parsed.data;
  if (!requestedSlug) {
    data.slug = await uniqueProductSlug(data.slug);
  }

  try {
    await pool.execute(
      `INSERT INTO Product
         (slug, name, description, ingredients, shelfLife, categoryId, sizes, imageUrl, sortOrder, rating, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
      [
        data.slug,
        data.name,
        data.description,
        data.ingredients,
        data.shelfLife,
        data.categoryId,
        JSON.stringify(sizesForStorage(data)),
        JSON.stringify(data.images),
        data.sortOrder,
        data.rating,
      ]
    );
  } catch (error) {
    if (errorCode(error) === "ER_DUP_ENTRY") {
      return { error: "A product with that slug already exists." };
    }
    throw error;
  }

  revalidateStorefront();
  redirect("/admin/products?created=1");
}

export async function updateProductAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const id = formInt(formData, "id");
  if (!id) return { error: "Product not found." };

  const parsed = productSchema.safeParse(readProduct(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const pool = getPool();
  if (!pool) return { error: "Database is not configured." };

  const data = parsed.data;

  try {
    await pool.execute(
      `UPDATE Product
          SET slug = ?, name = ?, description = ?, ingredients = ?, shelfLife = ?, categoryId = ?,
              sizes = ?, imageUrl = ?, sortOrder = ?, rating = ?, updatedAt = NOW(3)
        WHERE id = ?`,
      [
        data.slug,
        data.name,
        data.description,
        data.ingredients,
        data.shelfLife,
        data.categoryId,
        JSON.stringify(sizesForStorage(data)),
        JSON.stringify(data.images),
        data.sortOrder,
        data.rating,
        id,
      ]
    );
  } catch (error) {
    if (errorCode(error) === "ER_DUP_ENTRY") {
      return { error: "A product with that slug already exists." };
    }
    throw error;
  }

  revalidateStorefront();
  redirect(`/admin/products?id=${id}&updated=1`);
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const pool = getPool();
  if (!pool || !Number.isFinite(id) || id <= 0) {
    redirect("/admin/products?error=not-found");
  }

  await pool.execute("DELETE FROM Product WHERE id = ?", [id]);

  revalidateStorefront();
  redirect("/admin/products?deleted=1");
}

/* -------------------------------------------------------------------------- */
/* Combos                                                                     */
/* -------------------------------------------------------------------------- */

type RawItem = {
  productId?: unknown;
  name?: unknown;
  quantity?: unknown;
};

function readCombo(formData: FormData) {
  const rawItems = parseHidden<RawItem[]>(formData, "items", []);
  const rawImages = parseHidden<(string | null)[]>(formData, "images", []);
  const price = Number(formText(formData, "price"));
  const name = formText(formData, "name");
  const ratingRaw = formText(formData, "rating");
  const rating = ratingRaw === "" ? 4.3 : Number(ratingRaw);
  const images = rawImages.filter(
    (image): image is string => typeof image === "string" && image.trim() !== ""
  );

  return {
    slug: formText(formData, "slug") || slugifyName(name),
    name,
    description: formText(formData, "description"),
    ingredients: formText(formData, "ingredients") || null,
    shelfLife: formText(formData, "shelfLife") || null,
    items: rawItems.map((item) => ({
      productId:
        typeof item.productId === "string" && item.productId.trim() !== ""
          ? item.productId
          : null,
      name: typeof item.name === "string" ? item.name : "",
      quantity: typeof item.quantity === "string" ? item.quantity : "",
    })),
    images,
    weightLabel: formText(formData, "weightLabel") || null,
    pricePaise: Number.isFinite(price) ? Math.round(price * 100) : 0,
    discountPercent: formInt(formData, "discountPercent"),
    sortOrder: formInt(formData, "sortOrder"),
    rating: Number.isFinite(rating) ? rating : 4.3,
  };
}

export async function createComboAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const requestedSlug = formText(formData, "slug");
  const parsed = comboSchema.safeParse(readCombo(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const pool = getPool();
  if (!pool) return { error: "Database is not configured." };

  const data = parsed.data;
  if (!requestedSlug) {
    data.slug = await uniqueComboSlug(data.slug);
  }

  try {
    await pool.execute(
      `INSERT INTO Combo
         (slug, name, description, ingredients, shelfLife, items, imageUrl, weightLabel,
          pricePaise, discountPercent, sortOrder, rating, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
      [
        data.slug,
        data.name,
        data.description,
        data.ingredients,
        data.shelfLife,
        JSON.stringify(data.items),
        JSON.stringify(data.images),
        data.weightLabel,
        data.pricePaise,
        data.discountPercent,
        data.sortOrder,
        data.rating,
      ]
    );
  } catch (error) {
    if (errorCode(error) === "ER_DUP_ENTRY") {
      return { error: "A combo with that slug already exists." };
    }
    throw error;
  }

  revalidateStorefront();
  redirect("/admin/combos?created=1");
}

export async function updateComboAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const id = formInt(formData, "id");
  if (!id) return { error: "Combo not found." };

  const parsed = comboSchema.safeParse(readCombo(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const pool = getPool();
  if (!pool) return { error: "Database is not configured." };

  const data = parsed.data;

  try {
    await pool.execute(
      `UPDATE Combo
          SET slug = ?, name = ?, description = ?, ingredients = ?, shelfLife = ?, items = ?,
              imageUrl = ?, weightLabel = ?, pricePaise = ?,
              discountPercent = ?, sortOrder = ?, rating = ?, updatedAt = NOW(3)
        WHERE id = ?`,
      [
        data.slug,
        data.name,
        data.description,
        data.ingredients,
        data.shelfLife,
        JSON.stringify(data.items),
        JSON.stringify(data.images),
        data.weightLabel,
        data.pricePaise,
        data.discountPercent,
        data.sortOrder,
        data.rating,
        id,
      ]
    );
  } catch (error) {
    if (errorCode(error) === "ER_DUP_ENTRY") {
      return { error: "A combo with that slug already exists." };
    }
    throw error;
  }

  revalidateStorefront();
  redirect(`/admin/combos?id=${id}&updated=1`);
}

export async function deleteComboAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const pool = getPool();
  if (!pool || !Number.isFinite(id) || id <= 0) {
    redirect("/admin/combos?error=not-found");
  }

  await pool.execute("DELETE FROM Combo WHERE id = ?", [id]);

  revalidateStorefront();
  redirect("/admin/combos?deleted=1");
}

/* -------------------------------------------------------------------------- */
/* Blog                                                                       */
/* -------------------------------------------------------------------------- */

function readPost(formData: FormData) {
  const readingTime = formText(formData, "readingTimeMin");

  return {
    title: formText(formData, "title"),
    category: formText(formData, "category"),
    author: formText(formData, "author"),
    date: formText(formData, "date"),
    coverImage: formText(formData, "coverImage"),
    excerpt: formText(formData, "excerpt"),
    status: formText(formData, "status"),
    content: parseHidden<unknown[]>(formData, "content", []),
    readingTimeMin:
      readingTime === ""
        ? null
        : Number.isFinite(Number(readingTime))
          ? Math.trunc(Number(readingTime))
          : null,
  };
}

export async function createPostAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = postSchema.safeParse(readPost(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const pool = getPool();
  if (!pool) return { error: "Database is not configured." };

  const data = parsed.data;

  try {
    const [result] = await pool.execute<RowDataPacket[] & { insertId: number }>(
      `INSERT INTO BlogPost
         (title, category, author, \`date\`, coverImage, excerpt,
          status, content, readingTimeMin, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
      [
        data.title,
        data.category,
        data.author,
        new Date(`${data.date}T00:00:00`),
        data.coverImage,
        data.excerpt,
        data.status,
        JSON.stringify(data.content),
        data.readingTimeMin,
      ]
    );

    revalidateStorefront();
    revalidatePath(`/blog/${(result as any).insertId}`);
    redirect("/admin/blog?created=1");
  } catch (error) {
    throw error;
  }
}

export async function updatePostAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const id = formInt(formData, "id");
  if (!id) return { error: "Post not found." };

  const parsed = postSchema.safeParse(readPost(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const pool = getPool();
  if (!pool) return { error: "Database is not configured." };

  const data = parsed.data;

  try {
    await pool.execute(
      `UPDATE BlogPost
          SET title = ?, category = ?, author = ?, \`date\` = ?,
              coverImage = ?, excerpt = ?, status = ?,
              content = ?, readingTimeMin = ?, updatedAt = NOW(3)
        WHERE id = ?`,
      [
        data.title,
        data.category,
        data.author,
        new Date(`${data.date}T00:00:00`),
        data.coverImage,
        data.excerpt,
        data.status,
        JSON.stringify(data.content),
        data.readingTimeMin,
        id,
      ]
    );
  } catch (error) {
    throw error;
  }

  revalidateStorefront();
  revalidatePath(`/blog/${id}`);
  redirect(`/admin/blog?id=${id}&updated=1`);
}

export async function updatePostStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formInt(formData, "id");
  if (!id) redirect("/admin/blog?error=not-found");

  const parsed = postStatusSchema.safeParse(formText(formData, "status"));
  if (!parsed.success) redirect("/admin/blog?error=invalid-status");

  const pool = getPool();
  if (!pool) redirect("/admin/blog?error=database");

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT slug FROM BlogPost WHERE id = ? LIMIT 1",
    [id]
  );
  const slug = rows[0]?.slug ? String(rows[0].slug) : null;
  if (!slug) redirect("/admin/blog?error=not-found");

  await pool.execute(
    "UPDATE BlogPost SET status = ?, updatedAt = NOW(3) WHERE id = ?",
    [parsed.data, id]
  );

  revalidateStorefront();
  revalidatePath(`/blog/${slug}`);
  redirect("/admin/blog?status=1");
}

export async function deletePostAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const pool = getPool();
  if (!pool || !Number.isFinite(id) || id <= 0) {
    redirect("/admin/blog?error=not-found");
  }

  await pool.execute("DELETE FROM BlogPost WHERE id = ?", [id]);

  revalidateStorefront();
  redirect("/admin/blog?deleted=1");
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

export async function updateSettingsAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = settingsSchema.safeParse({
    codEnabled: formBool(formData, "codEnabled"),
    offerBannerEnabled: formBool(formData, "offerBannerEnabled"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const pool = getPool();
  if (!pool) return { error: "Database is not configured." };

  const settings = [
    ["cod_enabled", parsed.data.codEnabled ? "true" : "false"],
    [
      "offer_banner_enabled",
      parsed.data.offerBannerEnabled ? "true" : "false",
    ],
  ];

  for (const [key, value] of settings) {
    await pool.execute(
      "INSERT INTO Settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)",
      [key, value]
    );
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/policies/store");
  redirect("/admin/settings?saved=1");
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

export async function updateOrderStatusAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const id = formInt(formData, "id");
  if (!id) return { error: "Order not found." };

  const parsed = orderStatusSchema.safeParse(formText(formData, "status"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const pool = getPool();
  if (!pool) return { error: "Database is not configured." };

  await pool.execute(
    "UPDATE `Order` SET status = ?, updatedAt = NOW(3) WHERE id = ?",
    [parsed.data, id]
  );

  redirect(`/admin/orders?id=${id}&saved=1`);
}
