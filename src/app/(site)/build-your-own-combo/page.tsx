import type { Metadata } from "next";
import { getImageProps } from "next/image";
import Link from "next/link";
import { ComboBuilder, type ComboBuilderProduct } from "@/components/combo-builder";
import { pageMetadata } from "@/lib/seo";
import { getCatalog } from "@/lib/storefront";
import { CUSTOM_COMBO_PACK_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Build Your Own Combo | Nilgiribytes",
  description:
    "Create your own Nilgiribytes combo. Choose 4 to 8 varieties of Ooty Varkey and traditional biscuits, each 250g, and build a box that is uniquely yours.",
  keywords: [
    "build your own combo",
    "custom Ooty Varkey combo",
    "Nilgiribytes combo",
    "Ooty Varkey gift box",
    "traditional biscuit combo",
    "Nilgiri bakery hamper",
  ],
  path: "/build-your-own-combo",
  image: "/assets/build_combo.jpeg",
});

const heroImageCommon = { alt: "", sizes: "100vw" };

const {
  props: { srcSet: comboHeroMobileSrcSet },
} = getImageProps({
  ...heroImageCommon,
  src: "/assets/build_combo_mobile.jpg",
  width: 768,
  height: 1062,
});

const { props: comboHeroDesktopProps } = getImageProps({
  ...heroImageCommon,
  src: "/assets/build_combo.jpeg",
  width: 1376,
  height: 580,
});

export default async function BuildYourOwnComboPage() {
  const catalog = await getCatalog();

  const products: ComboBuilderProduct[] = catalog.products
    .map((product) => {
      const size = product.sizes.find(
        (entry) => entry.label === CUSTOM_COMBO_PACK_LABEL
      );
      if (!size) return null;
      return {
        slug: product.slug,
        name: product.name,
        image: size.imageUrl || product.image,
        label: size.label,
        pricePaise: size.pricePaise,
      };
    })
    .filter((product): product is ComboBuilderProduct => product !== null);

  return (
    <main id="main-content">
      <section className="page-hero page-hero--combo" aria-labelledby="combo-title">
        <div className="page-hero_media" aria-hidden="true">
          <picture>
            <source
              media="(max-width: 767.98px)"
              srcSet={comboHeroMobileSrcSet}
            />
            <img {...comboHeroDesktopProps} alt="" fetchPriority="high" />
          </picture>
        </div>
        <h1 className="sr-only" id="combo-title">
          Build Your Own Combo
        </h1>
      </section>

      <section className="section section--combo-builder" aria-labelledby="combo-builder-title">
        <div className="container container--fluid">
          <Link className="combo-builder_back" href="/shop">
            <span aria-hidden="true">&larr;</span> Back to shop
          </Link>
          <h2 className="sr-only" id="combo-builder-title">
            Build Your Own Combo
          </h2>
          <ComboBuilder products={products} />
        </div>
      </section>
    </main>
  );
}
