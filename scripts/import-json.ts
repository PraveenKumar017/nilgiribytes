import "./load-env";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hash } from "bcryptjs";
import {
  createConnection,
  type Connection,
  type RowDataPacket,
} from "mysql2/promise";
import { databaseConfig } from "./db";

type LegacySize = {
  label: string;
  grams?: number | null;
  mrp?: number;
  discountPercent?: number;
  price: number;
};

function sizePricing(size: LegacySize) {
  const pricePaise = Math.round(size.price * 100);
  const mrpPaise = Math.max(
    pricePaise,
    Math.round((size.mrp ?? size.price) * 100)
  );
  const discountPercent =
    size.discountPercent ??
    (mrpPaise > pricePaise
      ? Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100)
      : 0);

  return { mrpPaise, discountPercent, pricePaise };
}

type LegacyProduct = {
  id: string;
  name: string;
  category: string;
  description?: string;
  poster?: string;
  image?: string;
  sizeImages?: Record<string, string>;
  sizes?: LegacySize[];
};

type LegacyCombo = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  weight?: string;
  price: number;
  includes?: { productId?: string; name: string; quantity: string }[];
};

type LegacyPost = {
  slug: string;
  status: string;
  title: string;
  category: string;
  author?: string;
  date: string;
  readingTime?: string;
  image?: string;
  imageAlt?: string;
  excerpt?: string;
  content?: unknown;
};

type CatalogFile = { products: LegacyProduct[]; combos: LegacyCombo[] };
type BlogFile = { posts: LegacyPost[] };

function readJson<T>(relativePath: string): T {
  const file = readFileSync(join(process.cwd(), relativePath), "utf8");
  return JSON.parse(file) as T;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueSlug(base: string, used: Set<string>): string {
  const root = slugify(base) || "item";
  let candidate = root;
  let index = 2;
  while (used.has(candidate)) {
    candidate = `${root}-${index}`;
    index += 1;
  }
  used.add(candidate);
  return candidate;
}

function readingTimeMinutes(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
}

async function upsertCategory(
  connection: Connection,
  name: string,
  sortOrder: number
): Promise<number> {
  const slug = slugify(name);

  await connection.execute(
    `INSERT INTO \`Category\` (\`slug\`, \`name\`, \`sortOrder\`, \`updatedAt\`)
     VALUES (?, ?, ?, NOW(3))
     ON DUPLICATE KEY UPDATE
       \`name\` = VALUES(\`name\`),
       \`sortOrder\` = VALUES(\`sortOrder\`),
       \`updatedAt\` = NOW(3)`,
    [slug, name, sortOrder]
  );

  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT `id` FROM `Category` WHERE `slug` = ? LIMIT 1",
    [slug]
  );

  return Number(rows[0].id);
}

async function importCatalog(connection: Connection, catalog: CatalogFile) {
  const usedProductSlugs = new Set<string>();
  const usedComboSlugs = new Set<string>();
  const categoryIds = new Map<string, number>();

  let categoryOrder = 0;
  for (const product of catalog.products) {
    if (categoryIds.has(product.category)) continue;
    const categoryId = await upsertCategory(
      connection,
      product.category,
      categoryOrder
    );
    categoryIds.set(product.category, categoryId);
    categoryOrder += 1;
  }

  for (const [index, product] of catalog.products.entries()) {
    const categoryId = categoryIds.get(product.category);
    if (!categoryId) throw new Error(`Missing category for ${product.name}`);

    const slug = uniqueSlug(product.name, usedProductSlugs);
    const imageAlt = `${product.name} \u2014 ${product.category} from Nilgiribytes`;

    const sizes = (product.sizes ?? []).map((size) => {
      const pricing = sizePricing(size);
      return {
        label: size.label,
        grams: size.grams ?? null,
        mrpPaise: pricing.mrpPaise,
        discountPercent: pricing.discountPercent,
        pricePaise: pricing.pricePaise,
        imageUrl: product.sizeImages?.[size.label] ?? product.image ?? null,
      };
    });

    await connection.execute(
      `INSERT INTO \`Product\`
         (\`sku\`, \`slug\`, \`name\`, \`description\`, \`categoryId\`, \`sizes\`,
          \`posterUrl\`, \`imageUrl\`, \`imageAlt\`, \`sortOrder\`, \`isActive\`, \`updatedAt\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(3))
       ON DUPLICATE KEY UPDATE
         \`slug\` = VALUES(\`slug\`),
         \`name\` = VALUES(\`name\`),
         \`description\` = VALUES(\`description\`),
         \`categoryId\` = VALUES(\`categoryId\`),
         \`sizes\` = VALUES(\`sizes\`),
         \`posterUrl\` = VALUES(\`posterUrl\`),
         \`imageUrl\` = VALUES(\`imageUrl\`),
         \`imageAlt\` = VALUES(\`imageAlt\`),
         \`sortOrder\` = VALUES(\`sortOrder\`),
         \`isActive\` = 1,
         \`updatedAt\` = NOW(3)`,
      [
        product.id,
        slug,
        product.name,
        product.description ?? "",
        categoryId,
        JSON.stringify(sizes),
        product.poster ?? null,
        product.image ?? null,
        imageAlt,
        index,
      ]
    );

    console.log(`  product ${slug}`);
  }

  for (const [index, combo] of catalog.combos.entries()) {
    const slug = uniqueSlug(combo.name, usedComboSlugs);
    const imageAlt = `${combo.name} \u2014 Nilgiribytes combo pack`;

    const items = (combo.includes ?? []).map((item) => ({
      productId: item.productId ?? null,
      name: item.name,
      quantity: item.quantity,
    }));

    await connection.execute(
      `INSERT INTO \`Combo\`
         (\`sku\`, \`slug\`, \`name\`, \`description\`, \`items\`, \`imageUrl\`,
          \`imageAlt\`, \`weightLabel\`, \`pricePaise\`, \`sortOrder\`, \`isActive\`, \`updatedAt\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(3))
       ON DUPLICATE KEY UPDATE
         \`slug\` = VALUES(\`slug\`),
         \`name\` = VALUES(\`name\`),
         \`description\` = VALUES(\`description\`),
         \`items\` = VALUES(\`items\`),
         \`imageUrl\` = VALUES(\`imageUrl\`),
         \`imageAlt\` = VALUES(\`imageAlt\`),
         \`weightLabel\` = VALUES(\`weightLabel\`),
         \`pricePaise\` = VALUES(\`pricePaise\`),
         \`sortOrder\` = VALUES(\`sortOrder\`),
         \`isActive\` = 1,
         \`updatedAt\` = NOW(3)`,
      [
        combo.id,
        slug,
        combo.name,
        combo.description ?? "",
        JSON.stringify(items),
        combo.image ?? null,
        imageAlt,
        combo.weight ?? "1 kg total",
        Math.round(combo.price * 100),
        index,
      ]
    );

    console.log(`  combo ${slug}`);
  }

  return {
    categories: categoryIds.size,
    products: usedProductSlugs.size,
    combos: usedComboSlugs.size,
  };
}

async function importPosts(connection: Connection, posts: LegacyPost[]) {
  let imported = 0;

  for (const post of posts) {
    if (post.status !== "published") continue;

    await connection.execute(
      `INSERT INTO \`BlogPost\`
         (\`slug\`, \`title\`, \`category\`, \`author\`, \`date\`, \`coverImage\`,
          \`imageAlt\`, \`excerpt\`, \`status\`, \`content\`, \`readingTimeMin\`, \`updatedAt\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, ?, NOW(3))
       ON DUPLICATE KEY UPDATE
         \`title\` = VALUES(\`title\`),
         \`category\` = VALUES(\`category\`),
         \`author\` = VALUES(\`author\`),
         \`date\` = VALUES(\`date\`),
         \`coverImage\` = VALUES(\`coverImage\`),
         \`imageAlt\` = VALUES(\`imageAlt\`),
         \`excerpt\` = VALUES(\`excerpt\`),
         \`status\` = 'PUBLISHED',
         \`content\` = VALUES(\`content\`),
         \`readingTimeMin\` = VALUES(\`readingTimeMin\`),
         \`updatedAt\` = NOW(3)`,
      [
        post.slug,
        post.title,
        post.category,
        post.author ?? "Nilgiribytes Team",
        new Date(`${post.date}T00:00:00`),
        post.image ?? null,
        post.imageAlt ?? post.title,
        post.excerpt ?? null,
        JSON.stringify(post.content ?? []),
        readingTimeMinutes(post.readingTime),
      ]
    );

    imported += 1;
    console.log(`  post ${post.slug}`);
  }

  return imported;
}

async function importAdmin(connection: Connection) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password || password === "change-me-before-seeding") {
    console.log("  skipped admin user (set ADMIN_USERNAME and ADMIN_PASSWORD)");
    return false;
  }

  if (password.length < 10) {
    throw new Error("ADMIN_PASSWORD must be at least 10 characters");
  }

  const passwordHash = await hash(password, 12);

  await connection.execute(
    `INSERT INTO \`AdminUser\` (\`username\`, \`passwordHash\`, \`role\`)
     VALUES (?, ?, 'ADMIN')
     ON DUPLICATE KEY UPDATE \`passwordHash\` = VALUES(\`passwordHash\`)`,
    [username, passwordHash]
  );

  console.log(`  admin ${username}`);
  return true;
}

async function main() {
  const connection = await createConnection(databaseConfig());

  try {
    await connection.beginTransaction();

    console.log("Importing bundled JSON into MySQL...");
    const catalogFile = readJson<CatalogFile>("src/data/catalog.json");
    const blogFile = readJson<BlogFile>("src/data/blog.json");

    const catalogResult = await importCatalog(connection, catalogFile);
    const postCount = await importPosts(connection, blogFile.posts);
    const admin = await importAdmin(connection);

    await connection.commit();

    console.log(
      `Done: ${catalogResult.categories} categories, ${catalogResult.products} products, ` +
        `${catalogResult.combos} combos, ${postCount} posts` +
        `${admin ? ", 1 admin user" : ""}.`
    );
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
