import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hash } from "bcryptjs";
import { PostStatus, Prisma, PrismaClient } from "@prisma/client";

type LegacySize = {
  label: string;
  grams?: number | null;
  price: number;
};

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

const prisma = new PrismaClient();

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

async function importCatalog(catalog: CatalogFile) {
  const usedProductSlugs = new Set<string>();
  const usedComboSlugs = new Set<string>();
  const categoryIds = new Map<string, number>();
  const productIdsBySku = new Map<string, number>();
  const productIdsByOldId = new Map<string, number>();

  let categoryOrder = 0;
  for (const product of catalog.products) {
    if (categoryIds.has(product.category)) continue;
    const category = await prisma.category.upsert({
      where: { slug: slugify(product.category) },
      update: { name: product.category },
      create: {
        slug: slugify(product.category),
        name: product.category,
        sortOrder: categoryOrder,
      },
    });
    categoryIds.set(product.category, category.id);
    categoryOrder += 1;
  }

  for (const [index, product] of catalog.products.entries()) {
    const categoryId = categoryIds.get(product.category);
    if (!categoryId) throw new Error(`Missing category for ${product.name}`);

    const slug = uniqueSlug(product.name, usedProductSlugs);
    const sizes = (product.sizes ?? []).map((size, sizeIndex) => ({
      label: size.label,
      grams: size.grams ?? null,
      pricePaise: Math.round(size.price * 100),
      imageUrl: product.sizeImages?.[size.label] ?? product.image ?? null,
      sortOrder: sizeIndex,
    }));

    const data = {
      slug,
      name: product.name,
      description: product.description ?? "",
      categoryId,
      posterUrl: product.poster ?? null,
      imageUrl: product.image ?? null,
      imageAlt: `${product.name} \u2014 ${product.category} from Nilgiribytes`,
      sortOrder: index,
      isActive: true,
    };

    const saved = await prisma.product.upsert({
      where: { sku: product.id },
      update: data,
      create: { ...data, sku: product.id },
    });

    await prisma.$transaction([
      prisma.productSize.deleteMany({ where: { productId: saved.id } }),
      prisma.productSize.createMany({
        data: sizes.map((size) => ({ ...size, productId: saved.id })),
      }),
    ]);

    productIdsBySku.set(product.id, saved.id);
    productIdsByOldId.set(product.id, saved.id);
    console.log(`  product ${saved.slug}`);
  }

  for (const [index, combo] of catalog.combos.entries()) {
    const slug = uniqueSlug(combo.name, usedComboSlugs);
    const items = (combo.includes ?? []).map((item, itemIndex) => ({
      productId: item.productId
        ? productIdsByOldId.get(item.productId) ?? null
        : null,
      nameSnapshot: item.name,
      quantityLabel: item.quantity,
      sortOrder: itemIndex,
    }));

    const data = {
      slug,
      name: combo.name,
      description: combo.description ?? "",
      imageUrl: combo.image ?? null,
      imageAlt: `${combo.name} \u2014 Nilgiribytes combo pack`,
      weightLabel: combo.weight ?? "1 kg total",
      pricePaise: Math.round(combo.price * 100),
      sortOrder: index,
      isActive: true,
    };

    const saved = await prisma.combo.upsert({
      where: { sku: combo.id },
      update: data,
      create: { ...data, sku: combo.id },
    });

    await prisma.$transaction([
      prisma.comboItem.deleteMany({ where: { comboId: saved.id } }),
      prisma.comboItem.createMany({
        data: items.map((item) => ({ ...item, comboId: saved.id })),
      }),
    ]);

    console.log(`  combo ${saved.slug}`);
  }

  return {
    categories: categoryIds.size,
    products: productIdsBySku.size,
    combos: usedComboSlugs.size,
  };
}

async function importPosts(posts: LegacyPost[]) {
  let imported = 0;

  for (const post of posts) {
    if (post.status !== "published") continue;

    const data = {
      title: post.title,
      category: post.category,
      author: post.author ?? "Nilgiribytes Team",
      date: new Date(`${post.date}T00:00:00`),
      coverImage: post.image ?? null,
      imageAlt: post.imageAlt ?? post.title,
      excerpt: post.excerpt ?? null,
      status: PostStatus.PUBLISHED,
      content: (post.content ?? []) as Prisma.InputJsonValue,
      readingTimeMin: readingTimeMinutes(post.readingTime),
    };

    const saved = await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: data,
      create: { ...data, slug: post.slug },
    });

    imported += 1;
    console.log(`  post ${saved.slug}`);
  }

  return imported;
}

async function importAdmin() {
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
  await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });

  console.log(`  admin ${username}`);
  return true;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to import data");
  }

  console.log("Importing bundled JSON into MySQL...");
  const catalogFile = readJson<CatalogFile>("src/data/catalog.json");
  const blogFile = readJson<BlogFile>("src/data/blog.json");

  const catalogResult = await importCatalog(catalogFile);
  const postCount = await importPosts(blogFile.posts);
  const admin = await importAdmin();

  console.log(
    `Done: ${catalogResult.categories} categories, ${catalogResult.products} products, ` +
      `${catalogResult.combos} combos, ${postCount} posts` +
      `${admin ? ", 1 admin user" : ""}.`
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
