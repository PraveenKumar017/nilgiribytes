import type { Metadata } from "next";
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
  image: "/assets/Fresh_Pastries.png",
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
      <section className="page-hero page-hero--shop" aria-labelledby="combo-title">
        <div className="container page-hero_content">
          <span className="section-kicker">Your choice, your box</span>
          <h1 className="page-hero_title" id="combo-title">
            Build Your Own Combo
          </h1>
          <p className="page-hero_text">
            Choose your favourite 4 to 8 varieties of Ooty Varkey and traditional
            biscuits. Create your own combo with a minimum of 1kg and enjoy a
            personalised NilgiriBytes experience!
          </p>
          <ul className="page-hero_pills">
            <li>4 to 8 varieties</li>
            <li>250g per pack</li>
            <li>From &#8377;679</li>
          </ul>
        </div>
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
