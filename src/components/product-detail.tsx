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

type ProductDetailProps = {
  item: StoreItem;
};

export function ProductDetail({ item }: ProductDetailProps) {
  const { add, changeQty, quantityOf } = useCart();
  const [sizeIndex, setSizeIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);

  const lineKey = cartLineKey(item.id, itemSizeLabel(item, sizeIndex));
  const qty = quantityOf(lineKey);
  const price = itemPrice(item, sizeIndex);
  const mrp = itemMrp(item, sizeIndex);
  const discount = itemDiscountPercent(item, sizeIndex);
  const hasDiscount = discount > 0 && mrp > price;
  const sizeImages =
    item.kind === "product"
      ? item.sizes[sizeIndex]?.images?.filter(Boolean) ?? []
      : item.images?.filter(Boolean) ?? [];
  const images = sizeImages.length ? sizeImages : [itemImage(item, sizeIndex)];
  const activeIndex = Math.min(imageIndex, images.length - 1);
  const activeImage = images[activeIndex] ?? images[0];

  function moveImage(delta: number) {
    setImageIndex((current) => {
      const next = current + delta;
      return (next + images.length) % images.length;
    });
  }

  return (
    <article className="product-detail">
      <div className="product-detail_media">
        <div className="product-detail_stage">
          <SafeImage
            src={activeImage}
            alt={`${item.name} — ${item.category}`}
            width={900}
            height={900}
            loading="eager"
          />
          {hasDiscount ? (
            <span className="product-detail_badge">{discount}% OFF</span>
          ) : null}
          {images.length > 1 ? (
            <>
              <button
                type="button"
                className="product-detail_nav product-detail_nav--prev"
                aria-label="Show previous image"
                onClick={() => moveImage(-1)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                className="product-detail_nav product-detail_nav--next"
                aria-label="Show next image"
                onClick={() => moveImage(1)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </>
          ) : null}
        </div>

        {images.length > 1 ? (
          <div className="product-detail_thumbs" aria-label="Product images">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className={`product-detail_thumb${
                  index === activeIndex ? " is-active" : ""
                }`}
                aria-label={`Show image ${index + 1}`}
                aria-pressed={index === activeIndex}
                onClick={() => setImageIndex(index)}
              >
                <SafeImage src={image} alt="" width={80} height={80} />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="product-detail_body">
        <span className="product-detail_category">{item.category}</span>
        <h1 className="product-detail_title">{item.name}</h1>

        <div className="product-detail_pricing">
          <p className="product-detail_price">
            <span className="price-current">{formatINR(price)}</span>
            {hasDiscount ? (
              <s className="price-mrp">{formatINR(mrp)}</s>
            ) : null}
            {hasDiscount ? (
              <span className="discount-pill">{discount}% OFF</span>
            ) : null}
            {item.kind === "combo" ? (
              <span className="product-detail_price-meta">{item.weight}</span>
            ) : null}
          </p>
          {hasDiscount ? (
            <p className="product-detail_saving">
              You save {formatINR(mrp - price)}
            </p>
          ) : null}
        </div>

        {item.description.startsWith("TODO") ? (
          <p className="product-detail_desc">
            <span className="todo-note">Description: {item.description}</span>
          </p>
        ) : (
          <p className="product-detail_desc">{item.description}</p>
        )}

        {item.kind === "combo" ? (
          <div>
            <p className="product-detail_label">
              What&apos;s included ({item.weight})
            </p>
            <ul className="product-detail_includes">
              {item.includes.map((include, index) => (
                <li key={`${include.name}-${index}`}>
                  {include.name} &mdash; {include.quantity}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="product-detail_availability">
          &#10003; In stock &mdash; baked fresh daily
        </p>

        {item.kind === "product" && item.sizes.length > 1 ? (
          <div>
            <label className="product-detail_label" htmlFor="detail-size-select">
              Choose size
            </label>
            <select
              id="detail-size-select"
              className="size-select"
              aria-label="Choose size"
              value={sizeIndex}
              onChange={(event) => {
                setSizeIndex(Number(event.target.value));
                setImageIndex(0);
              }}
            >
              {item.sizes.map((size, index) => (
                <option key={size.label} value={index}>
                  {size.label} · {formatINR(size.pricePaise)}
                </option>
              ))}
            </select>
          </div>
        ) : item.kind === "product" && item.sizes.length === 1 ? (
          <div>
            <p className="product-detail_label">Size</p>
            <div className="size-select_static">
              {item.sizes[0].label} · {formatINR(item.sizes[0].pricePaise)}
            </div>
          </div>
        ) : null}

        <div className="product-detail_actions">
          {qty < 1 ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => add(item, sizeIndex, 1)}
            >
              Add to cart
            </button>
          ) : (
            <div className="qty-stepper" aria-label="Quantity in cart">
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
          {qty > 0 ? (
            <Link className="product-detail_cart-link" href="/cart">
              View cart &rarr;
            </Link>
          ) : null}
        </div>

        <p className="product-detail_note">
          Freshly packed the same day. Complete your order on WhatsApp at
          checkout.
        </p>
      </div>
    </article>
  );
}
