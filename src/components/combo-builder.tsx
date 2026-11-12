"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatINR } from "@/lib/format";
import {
  CUSTOM_COMBO_PACK_COUNTS,
  customComboMrpPaise,
  customComboPricePaise,
  customComboWeightLabel,
} from "@/lib/custom-combo";
import {
  CUSTOM_COMBO_MAX_PACKS,
  CUSTOM_COMBO_MIN_PACKS,
  type CustomComboPick,
} from "@/lib/types";
import { useCart } from "./cart-provider";
import { SafeImage } from "./safe-image";

export type ComboBuilderProduct = {
  slug: string;
  name: string;
  image: string;
  label: string;
  pricePaise: number;
};

export function ComboBuilder({
  products,
}: {
  products: ComboBuilderProduct[];
}) {
  const { addCustomCombo } = useCart();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [added, setAdded] = useState(false);

  const picks = useMemo<CustomComboPick[]>(() => {
    const list: CustomComboPick[] = [];
    for (const product of products) {
      const qty = quantities[product.slug] ?? 0;
      for (let index = 0; index < qty; index += 1) {
        list.push({
          slug: product.slug,
          name: product.name,
          label: product.label,
          pricePaise: product.pricePaise,
          image: product.image,
        });
      }
    }
    return list;
  }, [products, quantities]);

  const summaryItems = products
    .map((product) => ({ ...product, qty: quantities[product.slug] ?? 0 }))
    .filter((item) => item.qty > 0);

  const totalPacks = picks.length;
  const totalPaise = customComboPricePaise(totalPacks);
  const totalMrpPaise = customComboMrpPaise(totalPacks);
  const totalWeight = totalPacks ? customComboWeightLabel(totalPacks) : "0kg";
  const isValid =
    totalPacks >= CUSTOM_COMBO_MIN_PACKS &&
    totalPacks <= CUSTOM_COMBO_MAX_PACKS;
  const remaining = Math.max(0, CUSTOM_COMBO_MIN_PACKS - totalPacks);
  const progress = Math.min(
    100,
    (totalPacks / CUSTOM_COMBO_MAX_PACKS) * 100
  );
  const savingsPaise = Math.max(0, totalMrpPaise - totalPaise);

  function change(product: ComboBuilderProduct, delta: number) {
    setAdded(false);
    setQuantities((current) => {
      const next = Math.max(0, (current[product.slug] ?? 0) + delta);
      return { ...current, [product.slug]: next };
    });
  }

  function removeItem(product: ComboBuilderProduct) {
    setAdded(false);
    setQuantities((current) => ({ ...current, [product.slug]: 0 }));
  }

  function clearAll() {
    setAdded(false);
    setQuantities({});
  }

  function handleAdd() {
    if (!isValid) return;
    addCustomCombo(picks);
    setAdded(true);
  }

  return (
    <div className="combo-builder">
      <div className="combo-builder_layout">
        <section className="combo-panel" aria-labelledby="combo-choose-title">
          <header className="combo-panel_head">
            <div>
              <h2 className="combo-panel_title" id="combo-choose-title">
                Choose your varieties
              </h2>
              <p className="combo-panel_text">
                Every pick is a 250g pack. Choose {CUSTOM_COMBO_MIN_PACKS} to{" "}
                {CUSTOM_COMBO_MAX_PACKS} varieties and repeat your favourites.
              </p>
            </div>
            <span
              className={`combo-panel_count${isValid ? " is-valid" : ""}`}
              aria-live="polite"
            >
              {totalPacks}/{CUSTOM_COMBO_MAX_PACKS} in box
            </span>
          </header>

          <div className="combo-tier-head">
            <h3 className="combo-tier-title">Combo price guide</h3>
            <span className="combo-tier-note">Updates as you choose</span>
          </div>
          <div className="combo-tier-grid" aria-label="Combo price guide">
            {CUSTOM_COMBO_PACK_COUNTS.map((count) => {
              const price = customComboPricePaise(count);
              const mrp = customComboMrpPaise(count);
              const discount = Math.round(((mrp - price) / mrp) * 100);
              return (
                <div
                  key={count}
                  className={`combo-tier${totalPacks === count ? " is-active" : ""}`}
                >
                  <span className="combo-tier_count">{count} varieties</span>
                  <span className="combo-tier_weight">
                    {customComboWeightLabel(count)}
                  </span>
                  <div className="combo-tier_prices">
                    <span className="combo-tier_mrp-wrap">
                      MRP <del>{formatINR(mrp)}</del>
                    </span>
                    <strong className="combo-tier_price">
                      {formatINR(price)}
                    </strong>
                  </div>
                  <span className="combo-tier_discount">{discount}% OFF</span>
                </div>
              );
            })}
          </div>

          <div className="combo-builder_list">
            {products.map((product) => {
              const qty = quantities[product.slug] ?? 0;
              return (
                <article
                  key={product.slug}
                  className={`combo-option${qty > 0 ? " is-selected" : ""}`}
                >
                  <div className="combo-option_media">
                    <SafeImage
                      src={product.image}
                      alt={product.name}
                      width={180}
                      height={180}
                      loading="lazy"
                    />
                    {qty > 0 ? (
                      <span className="combo-option_badge">{qty} in box</span>
                    ) : null}
                  </div>
                  <div className="combo-option_body">
                    <div className="combo-option_info">
                      <h3 className="combo-option_name">{product.name}</h3>
                      <p className="combo-option_meta">{product.label} pack</p>
                    </div>

                    {qty === 0 ? (
                      <button
                        type="button"
                        className="combo-option_add"
                        onClick={() => change(product, 1)}
                        disabled={totalPacks >= CUSTOM_COMBO_MAX_PACKS}
                      >
                        Add to box
                      </button>
                    ) : (
                      <div className="qty-stepper combo-option_stepper">
                        <button
                          type="button"
                          onClick={() => change(product, -1)}
                          aria-label={`Remove one ${product.name}`}
                        >
                          &minus;
                        </button>
                        <span aria-live="polite">{qty}</span>
                        <button
                          type="button"
                          onClick={() => change(product, 1)}
                          aria-label={`Add one ${product.name}`}
                          disabled={totalPacks >= CUSTOM_COMBO_MAX_PACKS}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="combo-summary" aria-label="Your combo summary">
          <div className="combo-summary_head">
            <div>
              <h2 className="combo-summary_title">Your box</h2>
            </div>
            {totalPacks > 0 ? (
              <button
                type="button"
                className="combo-summary_clear"
                onClick={clearAll}
              >
                Clear
              </button>
            ) : null}
          </div>

          <div className="combo-progress">
            <div
              className="combo-progress_track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={CUSTOM_COMBO_MAX_PACKS}
              aria-valuenow={totalPacks}
              aria-label="Varieties selected"
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className="combo-progress_meta">
              <span>
                {totalPacks} of {CUSTOM_COMBO_MAX_PACKS} varieties
              </span>
              <span>{totalWeight}</span>
            </div>
          </div>

          {summaryItems.length > 0 ? (
            <ul className="combo-summary_items">
              {summaryItems.map((item) => (
                <li key={item.slug}>
                  <span className="combo-summary_thumb">
                    <SafeImage
                      src={item.image}
                      alt=""
                      width={44}
                      height={44}
                      loading="lazy"
                    />
                  </span>
                  <span className="combo-summary_iteminfo">
                    <span className="combo-summary_itemname">{item.name}</span>
                    <span className="combo-summary_itemmeta">
                      {item.qty} &times; {item.label}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="combo-summary_remove"
                    onClick={() => removeItem(item)}
                    aria-label={`Remove ${item.name} from combo`}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="combo-summary_empty">
              <span className="combo-summary_emptyicon" aria-hidden="true">
                +
              </span>
              <p className="combo-summary_emptytitle">Your box is empty</p>
              <p className="combo-summary_emptytext">
                Pick at least {CUSTOM_COMBO_MIN_PACKS} varieties to see your
                combo price.
              </p>
            </div>
          )}

          <div className="combo-summary_total">
            <div className="combo-summary_total-meta">
              <span>Combo price</span>
              {isValid && totalMrpPaise > totalPaise ? (
                <span className="combo-summary_mrp-wrap">
                  MRP <del>{formatINR(totalMrpPaise)}</del>
                </span>
              ) : null}
            </div>
            <strong>{isValid ? formatINR(totalPaise) : "\u2014"}</strong>
          </div>

          {isValid && savingsPaise > 0 ? (
            <div className="combo-summary_saving-badge">
              You save {formatINR(savingsPaise)} ({Math.round((savingsPaise / totalMrpPaise) * 100)}% OFF)
            </div>
          ) : null}

          <button
            type="button"
            className="btn btn--primary combo-builder_add"
            onClick={handleAdd}
            disabled={!isValid}
          >
            Add combo to cart
          </button>

          {!isValid ? (
            <p className="combo-builder_hint" role="status">
              Add {remaining} more pack{remaining === 1 ? "" : "s"} to continue.
            </p>
          ) : null}

          {added ? (
            <p className="combo-builder_success" role="status">
              Combo added. <Link href="/cart">View cart &rarr;</Link>
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
