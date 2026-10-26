import catalogJson from "@/data/catalog.json";
import blogJson from "@/data/blog.json";
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
  return (catalogJson.products as LegacyProduct[]).map((product, index) => {
    const slug = uniqueSlug(product.name, used);
    const sizes: StoreSize[] = (product.sizes ?? []).map((size) => ({
      label: size.label,
      grams: size.grams ?? null,
      pricePaise: Math.round(size.price * 100),
      imageUrl: assetUrl(product.sizeImages?.[size.label] ?? product.image),
    }));

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
  return (catalogJson.combos as LegacyCombo[]).map((combo, index) => {
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
      imageAlt: `${combo.name} \u2014 Nilgiribytes combo pack`,
      weight: combo.weight ?? "1 kg total",
      pricePaise: Math.round(combo.price * 100),
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
  return (blogJson.posts as LegacyPost[])
    .filter((post) => post.status === "published")
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      category: post.category,
      author: post.author || "Nilgiribytes Team",
      date: post.date,
      readingTime: post.readingTime || readingTime(post.content ?? []),
      image: assetUrl(post.image),
      imageAlt: post.imageAlt || post.title,
      excerpt: post.excerpt || excerptFromBlocks(post.content ?? []),
      content: sanitizeBlocks(post.content ?? []),
      status: "published" as const,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function sanitizeBlocks(blocks: unknown): BlogBlock[] {
  if (!Array.isArray(blocks)) return [];
  return blocks.filter((block): block is BlogBlock => {
    if (!block || typeof block !== "object") return false;
    const candidate = block as Record<string, unknown>;
    return typeof candidate.type === "string";
  });
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
  if (process.env.DATABASE_URL && !databaseFailed) {
    try {
      const { prisma } = await import("./prisma");
      const [products, combos] = await Promise.all([
        prisma.product.findMany({
          where: { isActive: true },
          include: {
            category: true,
            sizes: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
          },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        }),
        prisma.combo.findMany({
          where: { isActive: true },
          include: {
            items: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
          },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        }),
      ]);

      return {
        products: products.map((product) => ({
          kind: "product" as const,
          id: product.sku ?? product.slug,
          sku: product.sku,
          slug: product.slug,
          name: product.name,
          category: product.category.name,
          description: product.description,
          image: assetUrl(product.imageUrl || product.posterUrl),
          poster: product.posterUrl ? assetUrl(product.posterUrl) : "",
          imageAlt: product.imageAlt || `${product.name} from Nilgiribytes`,
          sizes: product.sizes.map((size) => ({
            label: size.label,
            grams: size.grams,
            pricePaise: size.pricePaise,
            imageUrl: assetUrl(size.imageUrl ?? product.imageUrl),
          })),
        })),
        combos: combos.map((combo) => ({
          kind: "combo" as const,
          id: combo.sku ?? combo.slug,
          sku: combo.sku,
          slug: combo.slug,
          name: combo.name,
          category: "Combos" as const,
          description: combo.description,
          image: assetUrl(combo.imageUrl),
          imageAlt: combo.imageAlt || `${combo.name} from Nilgiribytes`,
          weight: combo.weightLabel ?? "1 kg total",
          pricePaise: combo.pricePaise,
          includes: combo.items.map((item) => ({
            productId: item.productId ? String(item.productId) : null,
            name: item.nameSnapshot,
            quantity: item.quantityLabel,
          })),
        })),
      };
    } catch (error) {
      databaseFailed = true;
      console.warn(
        "[storefront] Database unavailable, using bundled JSON fallback:",
        error instanceof Error ? error.message : error
      );
    }
  }

  return legacyCatalog();
}

export async function getPublishedPosts(): Promise<StorePost[]> {
  if (process.env.DATABASE_URL && !databaseFailed) {
    try {
      const { prisma } = await import("./prisma");
      const posts = await prisma.blogPost.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ date: "desc" }, { id: "desc" }],
      });

      return posts.map((post) => {
        const blocks = sanitizeBlocks(post.content);
        return {
          slug: post.slug,
          title: post.title,
          category: post.category,
          author: post.author || "Nilgiribytes Team",
          date: post.date.toISOString().slice(0, 10),
          readingTime: post.readingTimeMin
            ? `${post.readingTimeMin} min read`
            : readingTime(blocks),
          image: assetUrl(post.coverImage),
          imageAlt: post.imageAlt || post.title,
          excerpt: post.excerpt || excerptFromBlocks(blocks),
          content: blocks,
          status: "published" as const,
        };
      });
    } catch (error) {
      databaseFailed = true;
      console.warn(
        "[storefront] Database unavailable, using bundled JSON fallback:",
        error instanceof Error ? error.message : error
      );
    }
  }

  return legacyPosts();
}

export async function getPostBySlug(slug: string): Promise<StorePost | null> {
  const posts = await getPublishedPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export function includesText(includes: ComboInclude[]): string {
  return includes.map((item) => `${item.name} ${item.quantity}`).join(" \u00b7 ");
}
