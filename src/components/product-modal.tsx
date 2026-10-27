"use client";

import { useEffect, useRef, useState } from "react";
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

type ProductModalProps = {
  item: StoreItem;
  onClose: () => void;
};

export function ProductModal({ item, onClose }: ProductModalProps) {
  const { add, changeQty, quantityOf } = useCart();
  const [sizeIndex, setSizeIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
  const activeImage = images[Math.min(imageIndex, images.length - 1)] ?? images[0];

  useEffect(() => {
    document.body.classList.add("is-locked");
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select'
        )
      ).filter((node) => node.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("is-locked");
    };
  }, [onClose]);

  return (
    <div
      className="modal is-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal_panel" ref={panelRef}>
        <button
          className="icon-btn modal_close"
          type="button"
          aria-label="Close product details"
          onClick={onClose}
          ref={closeRef}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="modal_grid">
          <div className="modal_media">
            <SafeImage
              src={activeImage}
              alt={`${item.name} \u2014 ${item.category}`}
              width={640}
              height={480}
            />
            {images.length > 1 ? (
              <div className="modal_thumbs" aria-label="Product images">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={`modal_thumbs_btn${
                      index === imageIndex ? " is-active" : ""
                    }`}
                    aria-label={`Show image ${index + 1}`}
                    aria-pressed={index === imageIndex}
                    onClick={() => setImageIndex(index)}
                  >
                    <SafeImage src={image} alt="" width={80} height={80} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="modal_body">
            <h2 className="modal_title" id="modal-title">
              {item.name}
            </h2>
            <div className="modal_pricing">
              <p className="modal_price">
                <span className="price-current">{formatINR(price)}</span>
                {hasDiscount ? (
                  <s className="price-mrp">{formatINR(mrp)}</s>
                ) : null}
                {hasDiscount ? (
                  <span className="discount-pill">{discount}% OFF</span>
                ) : null}
                <span className="modal_price-meta">
                  {item.kind === "combo"
                    ? item.weight
                    : itemSizeLabel(item, sizeIndex)}
                </span>
              </p>
              {hasDiscount ? (
                <p className="modal_saving">
                  You save {formatINR(mrp - price)}
                </p>
              ) : null}
            </div>

            {item.description.startsWith("TODO") ? (
              <p className="modal_desc">
                <span className="todo-note">Description: {item.description}</span>
              </p>
            ) : (
              <p className="modal_desc">{item.description}</p>
            )}

            {item.kind === "combo" ? (
              <div>
                <p className="modal_label">
                  What&apos;s included ({item.weight})
                </p>
                <ul className="modal_includes">
                  {item.includes.map((include, index) => (
                    <li key={`${include.name}-${index}`}>
                      {include.name} &mdash; {include.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="modal_availability">
              &#10003; In stock &mdash; baked fresh daily
            </p>

            {item.kind === "product" ? (
              <div>
                <p className="modal_label">Choose size</p>
                <div
                  className="size-select"
                  role="group"
                  aria-label="Choose size"
                >
                  {item.sizes.map((size, index) => (
                    <button
                      key={size.label}
                      type="button"
                      className="size-select_btn"
                      aria-pressed={index === sizeIndex}
                      onClick={() => {
                        setSizeIndex(index);
                        setImageIndex(0);
                      }}
                    >
                      {size.label} &middot; {formatINR(size.pricePaise)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="modal_actions">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
