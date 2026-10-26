import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { ShopBrowser } from "@/components/shop-browser";
import { pageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { getCatalog } from "@/lib/storefront";

export const metadata: Metadata = pageMetadata({
  title: "Shop | Nilgiribytes - Varkey, Biscuits & Combos",
  description:
    "Shop freshly baked varkey, biscuits and signature combos from Nilgiribytes. Choose your size and order on WhatsApp.",
  path: "/shop",
  image: "/assets/Fresh_Pastries.png",
});

type ShopPageProps = {
  searchParams: Promise<{ category?: string | string[] }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const [catalog, params] = await Promise.all([getCatalog(), searchParams]);
  const requested = Array.isArray(params.category)
    ? params.category[0]
    : params.category;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Nilgiribytes products",
    itemListElement: catalog.products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: `${SITE_URL}${product.image}`,
        category: product.category,
        offers: {
          "@type": "Offer",
          price: ((product.sizes[0]?.pricePaise ?? 0) / 100).toFixed(2),
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
        },
      },
    })),
  };

  return (
    <main id="main-content">
      <section className="page-hero page-hero--shop" aria-labelledby="shop-title">
        <div className="page-hero_media" aria-hidden="true">
          <img
            src="/assets/Fresh_Pastries.png"
            alt=""
            width={2000}
            height={1500}
            fetchPriority="high"
          />
        </div>
        <div className="page-hero_overlay" aria-hidden="true" />
        <div className="container page-hero_content">
          <span className="section-kicker">The bakery counter</span>
          <h1 className="page-hero_title" id="shop-title">
            Made Fresh, Shared with Love.
          </h1>
          <p className="page-hero_text">
            Varkey and biscuits sold by weight, plus fixed-price combos - baked
            fresh and packed the same day. Retail &amp; wholesale available, and
            pre-order cakes also available - contact us on WhatsApp.
          </p>
          <ul className="page-hero_pills">
            <li>Baked fresh daily</li>
            <li>Sold by weight</li>
            <li>WhatsApp ordering</li>
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="shop-grid-title">
        <div className="container">
          <h2 className="sr-only" id="shop-grid-title">
            Products
          </h2>
          <ShopBrowser catalog={catalog} initialCategory={requested} />
        </div>
      </section>

      <JsonLd data={itemList} />
    </main>
  );
}
