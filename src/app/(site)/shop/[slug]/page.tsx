import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { JsonLd } from "@/components/json-ld";
import { ProductCollection } from "@/components/product-collection";
import { ProductDetail } from "@/components/product-detail";
import { SafeImage } from "@/components/safe-image";
import { ShareIconButton } from "@/components/share-icon-button";
import {
  itemImage,
  itemMrp,
  itemPrice,
} from "@/lib/cart";
import { formatINR } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { getCatalog } from "@/lib/storefront";
import type { StoreItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const loadCatalog = cache(async () => getCatalog());

const loadItem = cache(async (slug: string): Promise<StoreItem | null> => {
  const catalog = await loadCatalog();
  return (
    [...catalog.products, ...catalog.combos].find(
      (entry) => entry.slug === slug
    ) ?? null
  );
});

function metaDescription(item: StoreItem): string {
  if (!item.description || item.description.startsWith("TODO")) {
    return `Buy ${item.name} from Nilgiribytes, freshly baked in Kotagiri and delivered across India.`;
  }
  return item.description.slice(0, 160);
}

function absoluteImage(src: string): string {
  return /^(https?:)?\/\//.test(src) ? src : absoluteUrl(src);
}

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await loadItem(slug);

  if (!item) {
    return {
      title: "Product not found | Nilgiribytes",
      robots: { index: false, follow: false },
    };
  }

  return pageMetadata({
    title: `${item.name} | Nilgiribytes`,
    description: metaDescription(item),
    keywords: [item.name, item.category, "Nilgiribytes", "Kotagiri bakery"],
    path: `/shop/${item.slug}`,
    image: itemImage(item, 0),
  });
}

function CreateYourOwnComboCard() {
  return (
    <Link
      href="/build-your-own-combo"
      className="product-card product-card--create-custom reveal"
      data-reveal="fade-up"
      aria-label="Create your own combo"
    >
      <div className="product-card_create-content">
        <div className="product-card_add-circle" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="32"
            height="32"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <h3 className="product-card_create-title">Create your own combo</h3>
        <p className="product-card_create-subtitle">Customize your perfect box</p>
      </div>
    </Link>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  if (slug === "build-your-own-combo" || slug === "create-your-own-combo") {
    redirect("/build-your-own-combo");
  }

  const [item, catalog] = await Promise.all([loadItem(slug), loadCatalog()]);

  if (!item) notFound();

  const allItems = [...catalog.products, ...catalog.combos];
  const sameCategory = allItems.filter(
    (entry) => entry.id !== item.id && entry.category === item.category
  );
  const maxRelated = item.kind === "combo" ? 3 : 4;
  const related = (
    sameCategory.length
      ? sameCategory
      : allItems.filter((entry) => entry.id !== item.id)
  ).slice(0, maxRelated);

  const price = itemPrice(item, 0);
  const mrp = itemMrp(item, 0);
  const galleryImages =
    item.kind === "product"
      ? item.sizes.flatMap((size) => size.images?.filter(Boolean) ?? [])
      : item.images?.filter(Boolean) ?? [];
  const productImages = Array.from(
    new Set([itemImage(item, 0), ...galleryImages])
  ).map(absoluteImage);
  const productUrl = absoluteUrl(`/shop/${item.slug}`);

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    description: metaDescription(item),
    image: productImages,
    sku: item.sku ?? item.id,
    category: item.category,
    brand: {
      "@type": "Brand",
      name: "Nilgiribytes",
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: (price / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Nilgiribytes",
      },
    },
    ...(mrp > price
      ? {
          additionalProperty: {
            "@type": "PropertyValue",
            name: "List price",
            value: (mrp / 100).toFixed(2),
            unitCode: "INR",
          },
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: absoluteUrl("/shop"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: item.name,
        item: productUrl,
      },
    ],
  };

  return (
    <main id="main-content">
      <section className="product-page">
        <div className="container">
          <div className="product-toolbar">
            <Link className="product-back" href="/shop">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
              </svg>
              Back to shop
            </Link>
            <ShareIconButton
              url={absoluteUrl(`/shop/${item.slug}`)}
              title={item.name}
              text={`Check out ${item.name} from Nilgiribytes`}
              label="Share product"
            />
          </div>
          <nav className="product-breadcrumb" aria-label="Breadcrumb">
            <ol>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/shop">Shop</Link>
              </li>
              <li aria-current="page">{item.name}</li>
            </ol>
          </nav>

          <ProductDetail item={item} />
        </div>
      </section>

      {related.length ? (
        <section
          className={`section section--alt product-related${
            item.kind === "combo" ? " section--combo-related" : ""
          }`}
          aria-labelledby="related-title"
        >
          <div className="container">
            <span className="section-kicker reveal" data-reveal="fade-up">
              You may also like
            </span>
            <h2
              className="section-heading reveal"
              data-reveal="fade-up"
              id="related-title"
            >
              More from {item.category}
            </h2>
            <div className="product-grid">
              <ProductCollection items={related} />
              {item.kind === "combo" ? <CreateYourOwnComboCard /> : null}
            </div>
          </div>
        </section>
      ) : null}

      <JsonLd data={productLd} />
      <JsonLd data={breadcrumbLd} />
    </main>
  );
}
