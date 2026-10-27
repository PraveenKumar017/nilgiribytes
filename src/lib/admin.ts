import { randomBytes } from "node:crypto";
import { compare } from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getPool } from "./db";
import type { BlogBlock } from "./types";

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                             */
/* -------------------------------------------------------------------------- */

export type ActionState = { error: string } | null;
export type LoginState = { error: string } | null;

export function formText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function formInt(formData: FormData, key: string, fallback = 0): number {
  const value = Number(formText(formData, key));
  return Number.isFinite(value) ? Math.trunc(value) : fallback;
}

export function formBool(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

export function parseHidden<T>(formData: FormData, key: string, fallback: T): T {
  const value = formData.get(key);
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

export function errorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

export function revalidateStorefront(): void {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

function optionalString(max: number) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(max).nullable()
  );
}

const slug = z
  .string()
  .trim()
  .min(1, "Slug is required.")
  .max(200)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and hyphens only."
  );

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  slug,
  sortOrder: z.number().int().min(0),
});

export const productSizeSchema = z
  .object({
    label: z.string().trim().min(1, "Size label is required.").max(60),
    grams: z.number().int().positive().nullable(),
    mrpPaise: z.number().int().min(0),
    pricePaise: z.number().int().min(0),
    images: z
      .array(z.string().trim().min(1).max(500))
      .max(3, "Add up to three images per size.")
      .default([]),
    imageUrl: optionalString(500),
  })
  .refine((size) => size.mrpPaise >= size.pricePaise, {
    message: "MRP must be greater than or equal to the selling price.",
    path: ["mrpPaise"],
  });

export const productSchema = z.object({
  sku: optionalString(40),
  slug,
  name: z.string().trim().min(1, "Name is required.").max(160),
  description: z.string().trim().min(1, "Description is required.").max(5000),
  categoryId: z.number().int().positive("Choose a category."),
  sizes: z.array(productSizeSchema).min(1, "Add at least one size."),
  posterUrl: optionalString(500),
  imageUrl: optionalString(500),
  imageAlt: optionalString(240),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

export const comboItemSchema = z.object({
  productId: optionalString(40),
  name: z.string().trim().min(1, "Item name is required.").max(200),
  quantity: z.string().trim().min(1, "Quantity label is required.").max(60),
});

export const comboSchema = z.object({
  sku: optionalString(40),
  slug,
  name: z.string().trim().min(1, "Name is required.").max(160),
  description: z.string().trim().min(1, "Description is required.").max(5000),
  items: z.array(comboItemSchema).min(1, "Add at least one item."),
  images: z
    .array(z.string().trim().min(1).max(500))
    .max(3, "Add up to three images per combo.")
    .default([]),
  imageUrl: optionalString(500),
  imageAlt: optionalString(240),
  weightLabel: optionalString(60),
  pricePaise: z.number().int().positive("Price must be greater than zero."),
  discountPercent: z.number().int().min(0).max(100).default(0),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

const listBlock = z.object({
  type: z.enum(["list", "ul", "ol"]),
  items: z.array(z.string().trim().min(1)).min(1, "Add at least one item."),
});

export const blockSchema = z.union([
  z.object({ type: z.literal("p"), text: z.string().trim().min(1) }),
  z.object({ type: z.literal("h2"), text: z.string().trim().min(1) }),
  z.object({ type: z.literal("h3"), text: z.string().trim().min(1) }),
  listBlock,
]);

export const settingsSchema = z.object({
  codEnabled: z.boolean(),
  offerBannerEnabled: z.boolean(),
});

export type AdminSettings = {
  codEnabled: boolean;
  offerBannerEnabled: boolean;
};

export const DEFAULT_SETTINGS: AdminSettings = {
  codEnabled: false,
  offerBannerEnabled: false,
};

export const postStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);

export const postSchema = z.object({
  slug,
  title: z.string().trim().min(1, "Title is required.").max(240),
  category: z.string().trim().min(1, "Category is required.").max(80),
  author: optionalString(120),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date."),
  coverImage: optionalString(500),
  imageAlt: optionalString(240),
  excerpt: optionalString(2000),
  status: postStatusSchema,
  content: z.array(blockSchema).min(1, "Add at least one content block."),
  readingTimeMin: z.number().int().min(0).nullable(),
});

export const orderStatusSchema = z.enum([
  "NEW",
  "CONFIRMED",
  "PACKED",
  "DELIVERED",
  "CANCELLED",
]);

export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ComboInput = z.infer<typeof comboSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;

/* -------------------------------------------------------------------------- */
/* Authentication                                                             */
/* -------------------------------------------------------------------------- */

const COOKIE_NAME = "nb_admin";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;

type AdminRow = RowDataPacket & {
  id: number;
  username: string;
  passwordHash: string;
  role: "ADMIN" | "EDITOR";
};

const globalForAuth = globalThis as unknown as {
  adminLoginAttempts?: Map<string, { count: number; resetAt: number }>;
};

function attempts() {
  if (!globalForAuth.adminLoginAttempts) {
    globalForAuth.adminLoginAttempts = new Map();
  }
  return globalForAuth.adminLoginAttempts;
}

export type AdminSession = {
  id: number;
  username: string;
  role: "ADMIN" | "EDITOR";
  token: string;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const pool = getPool();
  if (!pool) return null;

  const [rows] = await pool.query<AdminRow[]>(
    `SELECT id, username, role
       FROM AdminUser
      WHERE sessionToken = ? AND sessionExpiresAt > NOW(3)
      LIMIT 1`,
    [token]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: Number(row.id),
    username: String(row.username),
    role: row.role,
    token,
  };
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function loginAdmin(
  username: string,
  password: string
): Promise<string | null> {
  const key = username.trim().toLowerCase();
  const record = attempts().get(key);
  const now = Date.now();

  if (record && record.resetAt > now && record.count >= MAX_ATTEMPTS) {
    return "Too many failed attempts. Try again in a few minutes.";
  }

  const pool = getPool();
  if (!pool) return "Database is not configured.";

  const [rows] = await pool.query<AdminRow[]>(
    `SELECT id, username, passwordHash, role
       FROM AdminUser
      WHERE username = ?
      LIMIT 1`,
    [username.trim()]
  );

  const user = rows[0];
  const valid = user ? await compare(password, user.passwordHash) : false;

  if (!user || !valid) {
    const next =
      record && record.resetAt > now
        ? { count: record.count + 1, resetAt: record.resetAt }
        : { count: 1, resetAt: now + ATTEMPT_WINDOW_MS };
    attempts().set(key, next);
    return "Invalid username or password.";
  }

  attempts().delete(key);

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_MS);

  await pool.execute(
    "UPDATE AdminUser SET sessionToken = ?, sessionExpiresAt = ? WHERE id = ?",
    [token, expires, user.id]
  );

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });

  return null;
}

export async function logoutAdmin(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;

  if (token) {
    const pool = getPool();
    if (pool) {
      await pool.execute(
        "UPDATE AdminUser SET sessionToken = NULL, sessionExpiresAt = NULL WHERE sessionToken = ?",
        [token]
      );
    }
  }

  store.delete(COOKIE_NAME);
}

/* -------------------------------------------------------------------------- */
/* Data access                                                                */
/* -------------------------------------------------------------------------- */

function pool() {
  const instance = getPool();
  if (!instance) throw new Error("Database is not configured.");
  return instance;
}

function json<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

export type AdminSize = {
  label: string;
  grams: number | null;
  mrpPaise: number;
  discountPercent: number;
  pricePaise: number;
  images: string[];
  imageUrl: string | null;
};

export type AdminProduct = {
  id: number;
  sku: string | null;
  slug: string;
  name: string;
  description: string;
  categoryId: number;
  categoryName: string;
  sizes: AdminSize[];
  posterUrl: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type AdminProductRow = {
  id: number;
  sku: string | null;
  slug: string;
  name: string;
  categoryName: string;
  sizes: { label: string; grams: number | null; pricePaise: number }[];
  isActive: boolean;
  sortOrder: number;
};

export type AdminCombo = {
  id: number;
  sku: string | null;
  slug: string;
  name: string;
  description: string;
  items: { productId: string | null; name: string; quantity: string }[];
  images: string[];
  imageUrl: string | null;
  imageAlt: string | null;
  weightLabel: string | null;
  pricePaise: number;
  discountPercent: number;
  sortOrder: number;
  isActive: boolean;
};

export type AdminComboRow = {
  id: number;
  sku: string | null;
  slug: string;
  name: string;
  items: { productId: string | null; name: string; quantity: string }[];
  pricePaise: number;
  discountPercent: number;
  isActive: boolean;
  sortOrder: number;
};

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  productCount: number;
};

export type AdminPost = {
  id: number;
  slug: string;
  title: string;
  category: string;
  author: string | null;
  date: string;
  coverImage: string | null;
  imageAlt: string | null;
  excerpt: string | null;
  status: "DRAFT" | "PUBLISHED";
  content: BlogBlock[];
  readingTimeMin: number | null;
};

export type AdminPostRow = {
  id: number;
  slug: string;
  title: string;
  category: string;
  author: string | null;
  date: string;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: Date;
};

export type AdminOrderRow = {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  totalPaise: number;
  channel: "WHATSAPP" | "ONLINE";
  status: "NEW" | "CONFIRMED" | "PACKED" | "DELIVERED" | "CANCELLED";
  createdAt: Date;
};

export type AdminOrder = AdminOrderRow & {
  email: string | null;
  address: string | null;
  notes: string | null;
  subtotalPaise: number;
  updatedAt: Date;
  items: {
    id: number;
    nameSnapshot: string;
    sizeLabel: string | null;
    unitPricePaise: number;
    quantity: number;
    lineTotalPaise: number;
  }[];
};

export type AdminDashboard = {
  products: number;
  combos: number;
  categories: number;
  posts: number;
  drafts: number;
  newOrders: number;
  recentOrders: AdminOrderRow[];
};

function dateOnly(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
}

export async function getDashboard(): Promise<AdminDashboard> {
  const [countRows] = await pool().query<RowDataPacket[]>(
    `SELECT
       (SELECT COUNT(*) FROM Product) AS products,
       (SELECT COUNT(*) FROM Combo) AS combos,
       (SELECT COUNT(*) FROM Category) AS categories,
       (SELECT COUNT(*) FROM BlogPost) AS posts,
       (SELECT COUNT(*) FROM BlogPost WHERE status = 'DRAFT') AS drafts,
       (SELECT COUNT(*) FROM \`Order\` WHERE status = 'NEW') AS newOrders`
  );

  const counts = countRows[0] ?? {};
  return {
    products: Number(counts.products ?? 0),
    combos: Number(counts.combos ?? 0),
    categories: Number(counts.categories ?? 0),
    posts: Number(counts.posts ?? 0),
    drafts: Number(counts.drafts ?? 0),
    newOrders: Number(counts.newOrders ?? 0),
    recentOrders: await listOrders(5),
  };
}

export async function listCategories(): Promise<AdminCategory[]> {
  const [rows] = await pool().query<RowDataPacket[]>(
    `SELECT c.id, c.name, c.slug, c.sortOrder,
            COUNT(p.id) AS productCount
       FROM Category c
       LEFT JOIN Product p ON p.categoryId = c.id
      GROUP BY c.id, c.name, c.slug, c.sortOrder
      ORDER BY c.sortOrder ASC, c.id ASC`
  );

  return rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    sortOrder: Number(row.sortOrder),
    productCount: Number(row.productCount),
  }));
}

export async function getCategory(id: number): Promise<AdminCategory | null> {
  const [rows] = await pool().query<RowDataPacket[]>(
    `SELECT c.id, c.name, c.slug, c.sortOrder,
            COUNT(p.id) AS productCount
       FROM Category c
       LEFT JOIN Product p ON p.categoryId = c.id
      WHERE c.id = ?
      GROUP BY c.id, c.name, c.slug, c.sortOrder
      LIMIT 1`,
    [id]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    sortOrder: Number(row.sortOrder),
    productCount: Number(row.productCount),
  };
}

export async function listProducts(): Promise<AdminProductRow[]> {
  const [rows] = await pool().query<RowDataPacket[]>(
    `SELECT p.id, p.sku, p.slug, p.name, p.isActive, p.sortOrder, p.sizes,
            c.name AS categoryName
       FROM Product p
       JOIN Category c ON c.id = p.categoryId
      ORDER BY p.sortOrder ASC, p.id ASC`
  );

  return rows.map((row) => ({
    id: Number(row.id),
    sku: row.sku ? String(row.sku) : null,
    slug: String(row.slug),
    name: String(row.name),
    categoryName: String(row.categoryName),
    sizes: json<{ label: string; grams: number | null; pricePaise: number }[]>(
      row.sizes,
      []
    ).map((size) => ({
      label: String(size.label),
      grams: size.grams == null ? null : Number(size.grams),
      pricePaise: Number(size.pricePaise),
    })),
    isActive: Boolean(row.isActive),
    sortOrder: Number(row.sortOrder),
  }));
}

export async function getProduct(id: number): Promise<AdminProduct | null> {
  const [rows] = await pool().query<RowDataPacket[]>(
    `SELECT p.*, c.name AS categoryName
       FROM Product p
       JOIN Category c ON c.id = p.categoryId
      WHERE p.id = ?
      LIMIT 1`,
    [id]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: Number(row.id),
    sku: row.sku ? String(row.sku) : null,
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description),
    categoryId: Number(row.categoryId),
    categoryName: String(row.categoryName),
    sizes: json<(AdminSize & { images?: string[] | null })[]>(row.sizes, []).map(
      (size) => {
        const images = Array.isArray(size.images)
          ? size.images.filter(
              (image): image is string =>
                typeof image === "string" && image.trim() !== ""
            )
          : [];
        if (!images.length && size.imageUrl) images.push(size.imageUrl);
        return { ...size, images, imageUrl: images[0] ?? null };
      }
    ),
    posterUrl: row.posterUrl ? String(row.posterUrl) : null,
    imageUrl: row.imageUrl ? String(row.imageUrl) : null,
    imageAlt: row.imageAlt ? String(row.imageAlt) : null,
    sortOrder: Number(row.sortOrder),
    isActive: Boolean(row.isActive),
  };
}

export async function listCombos(): Promise<AdminComboRow[]> {
  const [rows] = await pool().query<RowDataPacket[]>(
    `SELECT id, sku, slug, name, items, pricePaise, discountPercent, isActive, sortOrder
       FROM Combo
      ORDER BY sortOrder ASC, id ASC`
  );

  return rows.map((row) => ({
    id: Number(row.id),
    sku: row.sku ? String(row.sku) : null,
    slug: String(row.slug),
    name: String(row.name),
    items: json<AdminComboRow["items"]>(row.items, []),
    pricePaise: Number(row.pricePaise),
    discountPercent: Number(row.discountPercent ?? 0),
    isActive: Boolean(row.isActive),
    sortOrder: Number(row.sortOrder),
  }));
}

export async function getCombo(id: number): Promise<AdminCombo | null> {
  const [rows] = await pool().query<RowDataPacket[]>(
    "SELECT * FROM Combo WHERE id = ? LIMIT 1",
    [id]
  );

  const row = rows[0];
  if (!row) return null;

  const images = json<(string | null)[]>(row.images, []).filter(
    (image): image is string => typeof image === "string" && image.trim() !== ""
  );
  if (!images.length && row.imageUrl) images.push(String(row.imageUrl));

  return {
    id: Number(row.id),
    sku: row.sku ? String(row.sku) : null,
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description),
    items: json<AdminCombo["items"]>(row.items, []),
    images,
    imageUrl: images[0] ?? null,
    imageAlt: row.imageAlt ? String(row.imageAlt) : null,
    weightLabel: row.weightLabel ? String(row.weightLabel) : null,
    pricePaise: Number(row.pricePaise),
    discountPercent: Number(row.discountPercent ?? 0),
    sortOrder: Number(row.sortOrder),
    isActive: Boolean(row.isActive),
  };
}

export async function listProductOptions(): Promise<
  { id: number; sku: string | null; name: string }[]
> {
  const [rows] = await pool().query<RowDataPacket[]>(
    "SELECT id, sku, name FROM Product ORDER BY sortOrder ASC, id ASC"
  );

  return rows.map((row) => ({
    id: Number(row.id),
    sku: row.sku ? String(row.sku) : null,
    name: String(row.name),
  }));
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const pool = getPool();
  if (!pool) return DEFAULT_SETTINGS;

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT `key`, value FROM Settings"
  );
  const settings = new Map(
    rows.map((row) => [String(row.key), String(row.value)])
  );

  return {
    codEnabled: settings.get("cod_enabled") === "true",
    offerBannerEnabled: settings.get("offer_banner_enabled") === "true",
  };
}

export async function listPosts(): Promise<AdminPostRow[]> {
  const [rows] = await pool().query<RowDataPacket[]>(
    `SELECT id, slug, title, category, author, \`date\`, status, updatedAt
       FROM BlogPost
      ORDER BY \`date\` DESC, id DESC`
  );

  return rows.map((row) => ({
    id: Number(row.id),
    slug: String(row.slug),
    title: String(row.title),
    category: String(row.category),
    author: row.author ? String(row.author) : null,
    date: dateOnly(row.date as Date | string),
    status: row.status,
    updatedAt: row.updatedAt as Date,
  }));
}

export async function getPost(id: number): Promise<AdminPost | null> {
  const [rows] = await pool().query<RowDataPacket[]>(
    "SELECT * FROM BlogPost WHERE id = ? LIMIT 1",
    [id]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: Number(row.id),
    slug: String(row.slug),
    title: String(row.title),
    category: String(row.category),
    author: row.author ? String(row.author) : null,
    date: dateOnly(row.date as Date | string),
    coverImage: row.coverImage ? String(row.coverImage) : null,
    imageAlt: row.imageAlt ? String(row.imageAlt) : null,
    excerpt: row.excerpt ? String(row.excerpt) : null,
    status: row.status,
    content: json<BlogBlock[]>(row.content, []),
    readingTimeMin: row.readingTimeMin == null ? null : Number(row.readingTimeMin),
  };
}

export async function listOrders(limit?: number): Promise<AdminOrderRow[]> {
  const [rows] = await pool().query<RowDataPacket[]>(
    `SELECT id, orderNumber, customerName, phone, totalPaise, channel, status, createdAt
       FROM \`Order\`
      ORDER BY createdAt DESC, id DESC
      ${limit ? "LIMIT ?" : ""}`,
    limit ? [limit] : []
  );

  return rows.map((row) => ({
    id: Number(row.id),
    orderNumber: String(row.orderNumber),
    customerName: String(row.customerName),
    phone: String(row.phone),
    totalPaise: Number(row.totalPaise),
    channel: row.channel,
    status: row.status,
    createdAt: row.createdAt as Date,
  }));
}

export async function getOrder(id: number): Promise<AdminOrder | null> {
  const [rows] = await pool().query<RowDataPacket[]>(
    "SELECT * FROM `Order` WHERE id = ? LIMIT 1",
    [id]
  );

  const row = rows[0];
  if (!row) return null;

  const [itemRows] = await pool().query<RowDataPacket[]>(
    `SELECT id, nameSnapshot, sizeLabel, unitPricePaise, quantity, lineTotalPaise
       FROM OrderItem
      WHERE orderId = ?
      ORDER BY id ASC`,
    [id]
  );

  return {
    id: Number(row.id),
    orderNumber: String(row.orderNumber),
    customerName: String(row.customerName),
    phone: String(row.phone),
    email: row.email ? String(row.email) : null,
    address: row.address ? String(row.address) : null,
    notes: row.notes ? String(row.notes) : null,
    subtotalPaise: Number(row.subtotalPaise),
    totalPaise: Number(row.totalPaise),
    channel: row.channel,
    status: row.status,
    createdAt: row.createdAt as Date,
    updatedAt: row.updatedAt as Date,
    items: itemRows.map((item) => ({
      id: Number(item.id),
      nameSnapshot: String(item.nameSnapshot),
      sizeLabel: item.sizeLabel ? String(item.sizeLabel) : null,
      unitPricePaise: Number(item.unitPricePaise),
      quantity: Number(item.quantity),
      lineTotalPaise: Number(item.lineTotalPaise),
    })),
  };
}
