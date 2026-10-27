export type StoreSize = {
  label: string;
  grams: number | null;
  mrpPaise: number;
  discountPercent: number;
  pricePaise: number;
  imageUrl: string | null;
  images: string[];
};

export type StoreProduct = {
  kind: "product";
  id: string;
  sku: string | null;
  slug: string;
  name: string;
  category: string;
  description: string;
  image: string;
  poster: string;
  imageAlt: string;
  sizes: StoreSize[];
  sortOrder?: number;
};

export type ComboInclude = {
  productId: string | null;
  name: string;
  quantity: string;
};

export type StoreCombo = {
  kind: "combo";
  id: string;
  sku: string | null;
  slug: string;
  name: string;
  category: "Combos";
  description: string;
  image: string;
  images: string[];
  imageAlt: string;
  weight: string;
  pricePaise: number;
  mrpPaise: number;
  discountPercent: number;
  includes: ComboInclude[];
  sortOrder?: number;
};

export type StoreItem = StoreProduct | StoreCombo;

export type Catalog = {
  products: StoreProduct[];
  combos: StoreCombo[];
};

export type BlogBlock =
  | { type: "p" | "h2" | "h3"; text: string }
  | { type: "list" | "ul" | "ol"; items: string[] };

export type StorePost = {
  slug: string;
  title: string;
  category: string;
  author: string;
  date: string;
  readingTime: string;
  image: string;
  imageAlt: string;
  excerpt: string;
  content: BlogBlock[];
  status: "published";
};

export type CartLine = {
  key: string;
  id: string;
  kind: "product" | "combo";
  name: string;
  category: string;
  sizeLabel: string;
  pricePaise: number;
  qty: number;
  image: string;
};
