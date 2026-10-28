import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";
import type {
  BlogBlock,
  Catalog,
  ComboInclude,
  StoreCombo,
  StorePost,
  StoreProduct,
  StoreSize,
} from "./types";

type LegacySize = {
  label: string;
  grams?: number | null;
  mrp?: number;
  discountPercent?: number;
  price: number;
};

function legacySizePricing(size: LegacySize) {
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
  category?: string;
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
  content?: BlogBlock[];
};

type SizeJson = {
  label: string;
  grams: number | null;
  mrpPaise: number;
  discountPercent: number;
  pricePaise: number;
  imageUrl: string | null;
  images?: (string | null)[] | null;
};

type ComboItemJson = {
  productId: string | number | null;
  name: string;
  quantity: string;
};

type ProductRow = RowDataPacket & {
  id: number;
  sku: string | null;
  slug: string;
  name: string;
  description: string;
  categoryName: string;
  sizes: unknown;
  posterUrl: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
};

type ComboRow = RowDataPacket & {
  id: number;
  sku: string | null;
  slug: string;
  name: string;
  description: string;
  items: unknown;
  images: unknown;
  imageUrl: string | null;
  imageAlt: string | null;
  weightLabel: string | null;
  pricePaise: number;
  discountPercent: number;
};

type BlogPostRow = RowDataPacket & {
  slug: string;
  title: string;
  category: string;
  author: string | null;
  date: Date | string;
  coverImage: string | null;
  imageAlt: string | null;
  excerpt: string | null;
  content: unknown;
  readingTimeMin: number | null;
};

const IMAGE_FALLBACK = "/assets/placeholder.svg";

let databaseFailed = false;

function assetUrl(value: string | undefined | null): string {
  if (!value) return IMAGE_FALLBACK;
  if (/^(https?:)?\/\//.test(value) || value.startsWith("data:")) return value;
  return value.startsWith("/") ? value : `/${value}`;
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

function legacyProducts(): StoreProduct[] {
  const used = new Set<string>();
  return ([] as LegacyProduct[]).map((product, index) => {
    const slug = uniqueSlug(product.name, used);
    const sizes: StoreSize[] = (product.sizes ?? []).map((size) => {
      const imageUrl = assetUrl(product.sizeImages?.[size.label] ?? product.image);
      return {
        label: size.label,
        grams: size.grams ?? null,
        ...legacySizePricing(size),
        imageUrl,
        images: [imageUrl],
      };
    });

    return {
      kind: "product",
      id: product.id,
      sku: product.id,
      slug,
      name: product.name,
      category: product.category,
      description: product.description ?? "",
      image: assetUrl(product.image || product.poster),
      poster: product.poster ? assetUrl(product.poster) : "",
      imageAlt: `${product.name} \u2014 ${product.category} from Nilgiribytes`,
      sizes,
      sortOrder: index,
    };
  });
}

function legacyCombos(): StoreCombo[] {
  const used = new Set<string>();
  return ([] as LegacyCombo[]).map((combo, index) => {
    const slug = uniqueSlug(combo.name, used);
    return {
      kind: "combo",
      id: combo.id,
      sku: combo.id,
      slug,
      name: combo.name,
      category: "Combos",
      description: combo.description ?? "",
      image: assetUrl(combo.image),
      images: [assetUrl(combo.image)],
      imageAlt: `${combo.name} \u2014 Nilgiribytes combo pack`,
      weight: combo.weight ?? "1 kg total",
      pricePaise: Math.round(combo.price * 100),
      mrpPaise: Math.round(combo.price * 100),
      discountPercent: 0,
      includes: (combo.includes ?? []).map((item) => ({
        productId: item.productId ?? null,
        name: item.name,
        quantity: item.quantity,
      })),
      sortOrder: index,
    };
  });
}

function legacyCatalog(): Catalog {
  return {
    products: legacyProducts(),
    combos: legacyCombos(),
  };
}

function legacyPosts(): StorePost[] {
  return [];
}

function sanitizeBlocks(blocks: unknown): BlogBlock[] {
  if (!Array.isArray(blocks)) return [];
  return blocks.filter((block): block is BlogBlock => {
    if (!block || typeof block !== "object") return false;
    const candidate = block as Record<string, unknown>;
    return typeof candidate.type === "string";
  });
}

function parseContent(value: unknown): BlogBlock[] {
  if (typeof value === "string") {
    try {
      return sanitizeBlocks(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return sanitizeBlocks(value);
}

function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function wordCount(blocks: BlogBlock[]): number {
  let words = 0;
  for (const block of blocks) {
    if ("text" in block) {
      words += block.text.trim().split(/\s+/).filter(Boolean).length;
    }
    if ("items" in block) {
      for (const item of block.items) {
        words += String(item).trim().split(/\s+/).filter(Boolean).length;
      }
    }
  }
  return words;
}

export function readingTime(blocks: BlogBlock[]): string {
  const minutes = Math.max(1, Math.round(wordCount(blocks) / 200));
  return `${minutes} min read`;
}

export function excerptFromBlocks(blocks: BlogBlock[], maxLength = 160): string {
  for (const block of blocks) {
    if (block.type === "p" && block.text) {
      const text = block.text.trim();
      return text.length <= maxLength ? text : `${text.slice(0, maxLength).trim()}...`;
    }
  }
  return "";
}

export async function getCatalog(): Promise<Catalog> {
  const pool = getPool();
  if (!pool) {
    throw new Error("Database connection not available");
  }

  try {
    const [productRows, comboRows] = await Promise.all([
      pool.query<ProductRow[]>(
        `SELECT p.id, p.name, p.description, p.sizes,
                c.name AS categoryName, p.posterUrl, p.imageUrl
           FROM Product p
           JOIN Category c ON c.id = p.categoryId
          ORDER BY p.sortOrder ASC, p.id ASC`
      ),
      pool.query<ComboRow[]>(
        `SELECT id, name, description, items, imageUrl,
                weightLabel, pricePaise, discountPercent
           FROM Combo
          ORDER BY sortOrder ASC, id ASC`
      ),
    ]);

    return {
      products: productRows[0].map((product, index) => ({
        kind: "product" as const,
        id: `p-${product.id}-${index}`,
        sku: null,
        slug: null,
        name: product.name,
        category: product.categoryName,
        description: product.description,
        image: assetUrl(product.imageUrl || product.posterUrl),
        poster: product.posterUrl ? assetUrl(product.posterUrl) : "",
        imageAlt: `${product.name} from Nilgiribytes`,
        sizes: parseJsonArray<SizeJson>(product.sizes).map((size) => {
          const images = (size.images ?? [])
            .filter(
              (image): image is string =>
                typeof image === "string" && image.trim() !== ""
            )
            .map(assetUrl);

          if (!images.length) {
            images.push(assetUrl(size.imageUrl ?? product.imageUrl));
          }

          return {
            label: size.label,
            grams: size.grams,
            mrpPaise: size.mrpPaise,
            discountPercent: size.discountPercent,
            pricePaise: size.pricePaise,
            imageUrl: images[0] ?? null,
            images,
          };
        }),
      })),
      combos: comboRows[0].map((combo, index) => {
        const mrpPaise = Number(combo.pricePaise);
        const discountPercent = Math.min(
          100,
          Math.max(0, Number(combo.discountPercent ?? 0))
        );
        const images = parseJsonArray<string>(combo.images)
          .filter((image) => typeof image === "string" && image.trim() !== "")
          .map(assetUrl);
        const image = assetUrl(combo.imageUrl);
        if (!images.length) images.push(image);

        return {
          kind: "combo" as const,
          id: `c-${combo.id}-${index}`,
          sku: null,
          slug: null,
          name: combo.name,
          category: "Combos" as const,
          description: combo.description,
          image: images[0] ?? image,
          images,
          imageAlt: `${combo.name} from Nilgiribytes`,
          weight: combo.weightLabel ?? "1 kg total",
          pricePaise: Math.round((mrpPaise * (100 - discountPercent)) / 100),
          mrpPaise,
          discountPercent,
          includes: parseJsonArray<ComboItemJson>(combo.items).map((item) => ({
            productId: item.productId ? String(item.productId) : null,
            name: item.name,
            quantity: item.quantity,
          })),
        };
      }),
    };
  } catch (error) {
    throw error;
  }
}

export async function getPublishedPosts(): Promise<StorePost[]> {
  const pool = getPool();
  if (!pool) {
    throw new Error("Database connection not available");
  }

  try {
    const [rows] = await pool.query<BlogPostRow[]>(
      `SELECT id, title, category, author, \`date\`, coverImage,
              excerpt, content, readingTimeMin
         FROM BlogPost
        WHERE status = 'PUBLISHED'
        ORDER BY \`date\` DESC, id DESC`
    );

    return rows.map((post) => {
      const blocks = parseContent(post.content);
      const date = post.date instanceof Date ? post.date : new Date(post.date);
      return {
        slug: String(post.id),
        title: post.title,
        category: post.category,
        author: post.author || "Nilgiribytes Team",
        date: date.toISOString().slice(0, 10),
        readingTime: post.readingTimeMin
          ? `${post.readingTimeMin} min read`
          : readingTime(blocks),
        image: assetUrl(post.coverImage),
        imageAlt: post.title,
        excerpt: post.excerpt || excerptFromBlocks(blocks),
        content: blocks,
        status: "published" as const,
      };
    });
  } catch (error) {
    throw error;
  }
}

export async function getPostBySlug(slug: string): Promise<StorePost | null> {
  const posts = await getPublishedPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export function includesText(includes: ComboInclude[]): string {
  return includes.map((item) => `${item.name} ${item.quantity}`).join(" \u00b7 ");
}
