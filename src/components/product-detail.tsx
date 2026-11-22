"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const lineKey = cartLineKey(item, itemSizeLabel(item, sizeIndex));
  const qty = quantityOf(lineKey);
  const price = itemPrice(item, sizeIndex);
  const mrp = itemMrp(item, sizeIndex);
  const hasDiscount = mrp > price;
  const discount = hasDiscount
    ? itemDiscountPercent(item, sizeIndex) ||
      Math.round(((mrp - price) / mrp) * 100)
    : 0;
  const sizeImages =
    item.kind === "product"
      ? item.sizes[sizeIndex]?.images?.filter(Boolean) ?? []
      : item.images?.filter(Boolean) ?? [];
  const fallbackImages =
    item.kind === "product" ? item.images?.filter(Boolean) ?? [] : [];
  const images = sizeImages.length
    ? sizeImages
    : fallbackImages.length
      ? fallbackImages
      : [itemImage(item, sizeIndex)];
  const videoUrl = item.videoUrl ?? null;
  const mediaCount = images.length + (videoUrl ? 1 : 0);
  const activeIndex = Math.min(imageIndex, mediaCount - 1);
  const isVideoActive = Boolean(videoUrl) && activeIndex === images.length;
  const activeImage = images[Math.min(activeIndex, images.length - 1)] ?? images[0];
  const [taglineLine = "", ...descriptionLines] =
    item.description.split(/\r?\n/);
  const tagline = taglineLine.trim();
  const descriptionBody = descriptionLines
    .join("\n")
    .replace(/^\s*\n/, "")
    .trim();

  useEffect(() => {
    if (!lightboxOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxOpen]);

  useEffect(() => {
    if (mediaCount <= 1 || lightboxOpen || isVideoActive) return;

    const timer = setInterval(() => {
      setImageIndex((current) => (current + 1) % mediaCount);
    }, 3000);

    return () => clearInterval(timer);
  }, [mediaCount, lightboxOpen, isVideoActive, activeIndex]);

  function moveImage(delta: number) {
    setImageIndex((current) => {
      const next = current + delta;
      return (next + mediaCount) % mediaCount;
    });
  }

  const isHero =
    item.slug === "premium-special-varkey" ||
    (item.name.toLowerCase().includes("premium") &&
      item.name.toLowerCase().includes("varkey"));

  return (
    <article className="product-detail">
      <div className="product-detail_media">
        {isHero ? (
          <span className="product-detail_hero-badge">Hero Product</span>
        ) : null}
        <div className="product-detail_stage">
          {hasDiscount ? (
            <span className="product-detail_badge">{discount}% OFF</span>
          ) : null}
          {isVideoActive && videoUrl ? (
            <video
              src={videoUrl}
              poster={activeImage}
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <button
              type="button"
              className="product-detail_zoom"
              aria-label={`View ${item.name} full size`}
              onClick={() => setLightboxOpen(true)}
            >
              <SafeImage
                src={activeImage}
                alt={`${item.name} — ${item.category}`}
                width={900}
                height={900}
                loading="eager"
              />
            </button>
          )}
          {mediaCount > 1 ? (
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

        {mediaCount > 1 ? (
          <div className="product-detail_thumbs" aria-label="Product media">
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
            {videoUrl ? (
              <button
                type="button"
                className={`product-detail_thumb product-detail_thumb--video${
                  isVideoActive ? " is-active" : ""
                }`}
                aria-label="Play product video"
                aria-pressed={isVideoActive}
                onClick={() => setImageIndex(images.length)}
              >
                <SafeImage src={images[0]} alt="" width={80} height={80} />
                <svg
                  className="product-detail_thumb-play"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="product-detail_body">
        <div className="product-detail_kicker-row">
          <span className="product-detail_category">{item.category}</span>
          {isHero ? (
            <span className="product-detail_hero-tag">★ Hero Product</span>
          ) : null}
        </div>
        <h1 className="product-detail_title">{item.name}</h1>

        <div className="product-detail_reviews">
          <div
            className="product-detail_stars"
            aria-label={`${item.rating.toFixed(1)} out of 5 stars`}
          >
            {Array.from({ length: 5 }, (_, index) => (
              <span
                key={index}
                className={`product-detail_star ${
                  index < Math.round(item.rating) ? "is-filled" : "is-empty"
                }`}
                aria-hidden="true"
              >
                ★
              </span>
            ))}
          </div>
          <span className="product-detail_rating">{item.rating.toFixed(1)}</span>
        </div>

        {item.kind === "product" && item.sizes.length > 1 ? (
          <div className="product-detail_size-row">
            <span className="product-detail_label">Size</span>
            <div className="product-detail_size-pills" role="group" aria-label="Choose size">
              {item.sizes.map((size, index) => (
                <button
                  key={size.label}
                  type="button"
                  className="size-select_btn"
                  aria-pressed={sizeIndex === index}
                  onClick={() => {
                    setSizeIndex(index);
                    setImageIndex(0);
                  }}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>
        ) : item.kind === "product" && item.sizes.length === 1 ? (
          <div className="product-detail_size-row">
            <p className="product-detail_label">Size</p>
            <div className="size-select_static">
              {item.sizes[0].label} · {formatINR(item.sizes[0].pricePaise)}
            </div>
          </div>
        ) : null}

        <div className="product-detail_pricing">
          <p className="product-detail_price">
            <span className="price-current">{formatINR(price)}</span>
            {hasDiscount ? (
              <s className="price-mrp">{formatINR(mrp)}</s>
            ) : null}
            {hasDiscount ? (
              <span className="product-detail_saving">
                You save {formatINR(mrp - price)}
              </span>
            ) : null}
            {item.kind === "combo" ? (
              <span className="product-detail_price-meta">{item.weight}</span>
            ) : null}
          </p>
        </div>

        {item.description.startsWith("TODO") ? (
          <p className="product-detail_desc">
            <span className="todo-note">Description: {item.description}</span>
          </p>
        ) : (
          <p className="product-detail_desc">
            <strong className="product-detail_tagline">{tagline}</strong>
            {descriptionBody ? `\n${descriptionBody}` : null}
          </p>
        )}

        <details className="product-detail_facts-toggle">
          <summary className="product-detail_facts-summary">About</summary>
          <div className="product-detail_about-list">
            <p>Made in Ooty, The Nilgiris</p>
            <p>Made by Hand, Baked the Traditional Way</p>
            <p>Freshly Baked</p>
            <p>100% Vegetarian</p>
          </div>
        </details>

        {item.ingredients ? (
          <details className="product-detail_facts-toggle">
            <summary className="product-detail_facts-summary">Ingredients</summary>
            <dl className="product-detail_facts">
              <dd>{item.ingredients}</dd>
            </dl>
            <p className="product-detail_allergen">
              <strong>Allergen Information:-</strong> Contains Wheat (Gluten).
            </p>
          </details>
        ) : null}

        {item.shelfLife ? (
          <details className="product-detail_facts-toggle">
            <summary className="product-detail_facts-summary">Shelf life</summary>
            <div className="product-detail_about-list">
              <p>
                <strong>Shelf Life &amp; Storage:-</strong>
              </p>
              <p>Shelf life: {item.shelfLife} from date of manufacture.</p>
              <p>Store in a cool, dry place,away from direct sunlight.</p>
              <p>
                Once opened, keep in an airtight container to retain freshness and crunch.
              </p>
            </div>
          </details>
        ) : null}

        <details className="product-detail_facts-toggle">
          <summary className="product-detail_facts-summary">Shipping &amp; Delivery</summary>
          <div className="product-detail_about-list">
            <p>Carefully packed to protect products during transit.</p>
            <p>Dispatched from Kotagiri, in the Nilgiri hills.</p>
            <p>Delivery available across India.</p>
            <p>Estimated delivery time: 4&ndash;5 business days.</p>
            <p>
              Delivery timelines may vary depending on the destination and courier service.
            </p>
          </div>
        </details>

        <details className="product-detail_facts-toggle">
          <summary className="product-detail_facts-summary">Product Information</summary>
          <div className="product-detail_about-list">
            <p>Brand: NilgiriBytes</p>
            <p>Manufactured by: Vasu Ettan Bakery</p>
            <p>
              Manufacturing Location: Kotagiri, The Nilgiris, Tamil Nadu - 643217, India
            </p>
            <p>FSSAI License No: 22423223000163</p>
          </div>
        </details>

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
          Freshly packed the same day. Complete your order securely at checkout.
        </p>
      </div>

      {lightboxOpen ? (
        <div
          className="product-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${item.name} full size image`}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="product-lightbox_close"
            aria-label="Close full size image"
            onClick={() => setLightboxOpen(false)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <SafeImage
            className="product-lightbox_image"
            src={activeImage}
            alt={`${item.name} — ${item.category}`}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </article>
  );
}
