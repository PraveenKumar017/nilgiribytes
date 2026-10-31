"use client";

import Link from "next/link";
import { useState } from "react";
import {
  cartLineKey,
  itemDiscountPercent,
  itemImage,
  itemMrp,
  itemPrice,
  itemSizeLabel,
} from "@/lib/cart";
import { formatINR } from "@/lib/format";
import type { StoreItem } from "@/lib/types";
import { useCart } from "./cart-provider";
import { SafeImage } from "./safe-image";

type ProductCardProps = {
  item: StoreItem;
  animate?: boolean;
  quick?: boolean;
};

export function ProductCard({
  item,
  animate = true,
  quick = false,
}: ProductCardProps) {
  const { add, changeQty, quantityOf } = useCart();
  const [sizeIndex, setSizeIndex] = useState(0);

  const lineKey = cartLineKey(item.id, itemSizeLabel(item, sizeIndex));
  const qty = quantityOf(lineKey);
  const image = itemImage(item, sizeIndex);
  const price = itemPrice(item, sizeIndex);
  const mrp = itemMrp(item, sizeIndex);
  const discount = itemDiscountPercent(item, sizeIndex);
  const hasDiscount = discount > 0 && mrp > price;
  const href = `/shop/${item.slug}`;

  return (
    <article
      className={`product-card${animate ? " reveal" : ""}${quick ? " is-quick" : ""}`}
      data-item-id={item.id}
      data-reveal={animate ? "fade-up" : undefined}
    >
      <Link
        className="product-card_media"
        href={href}
        aria-label={`View details for ${item.name}`}
      >
        <SafeImage
          src={image}
          alt={`${item.name} \u2014 ${item.category} from Nilgiribytes`}
          width={480}
          height={360}
          loading="lazy"
        />
        {hasDiscount ? (
          <span className="product-card_badge">{discount}% OFF</span>
        ) : null}
      </Link>

      <div className="product-card_body">
        <div className="product-card_top">
          <h3 className="product-card_name">
            <Link
              className="product-card_link-btn"
              href={href}
              aria-label={`View details for ${item.name}`}
            >
              {item.name}
            </Link>
          </h3>
          <p className="product-card_price">
            {hasDiscount ? (
              <span className="price-offer">
                <s className="price-mrp">{formatINR(mrp)}</s>
                <span className="price-current">{formatINR(price)}</span>
              </span>
            ) : (
              <span className="price-offer">
                <span className="price-current">{formatINR(price)}</span>
              </span>
            )}
          </p>
        </div>

        <div className="product-card_reviews">
          <span className="product-card_rating">{item.rating.toFixed(1)}</span>
          <span className="product-card_stars" aria-hidden="true">
            ★
          </span>
        </div>

        {item.kind === "combo" && item.includes.length > 0 ? (
          <p className="product-card_includes">
            Includes:{" "}
            {item.includes
              .map((include) => `${include.name} ${include.quantity}`)
              .join(" \u00b7 ")}
          </p>
        ) : null}

        <div className="product-card_footer">
          {item.kind === "product" && item.sizes.length > 1 ? (
            <div className="size-select_wrap">
              <select
                id={`size-${item.id}`}
                className="size-select"
                aria-label={`Choose size for ${item.name}`}
                value={sizeIndex}
                onChange={(event) => setSizeIndex(Number(event.target.value))}
              >
                {item.sizes.map((size, index) => (
                  <option key={size.label} value={index}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>
          ) : item.kind === "product" && item.sizes.length === 1 ? (
            <div className="size-select_wrap">
              <span className="size-select_label">Size</span>
              <div className="size-select_static">{item.sizes[0].label}</div>
            </div>
          ) : null}

          <div className="product-card_action">
            {qty < 1 ? (
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => add(item, sizeIndex, 1)}
              >
                Add to cart
              </button>
            ) : (
              <div className="qty-stepper qty-stepper--card" aria-label="Quantity in cart">
                <button
                  type="button"
                  onClick={() => changeQty(lineKey, -1)}
                  aria-label="Decrease quantity"
                >
                  &minus;
                </button>
                <span aria-live="polite">{qty}</span>
                <button
                  type="button"
                  onClick={() => changeQty(lineKey, 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
