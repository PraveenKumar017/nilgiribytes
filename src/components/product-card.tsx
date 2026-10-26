"use client";

import { useState } from "react";
import { cartLineKey, itemImage, itemPrice, itemSizeLabel } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import type { StoreItem } from "@/lib/types";
import { useCart } from "./cart-provider";
import { SafeImage } from "./safe-image";

type ProductCardProps = {
  item: StoreItem;
  onOpen: (item: StoreItem) => void;
  animate?: boolean;
  quick?: boolean;
};

export function ProductCard({
  item,
  onOpen,
  animate = true,
  quick = false,
}: ProductCardProps) {
  const { add, changeQty, quantityOf } = useCart();
  const [sizeIndex, setSizeIndex] = useState(0);

  const lineKey = cartLineKey(item.id, itemSizeLabel(item, sizeIndex));
  const qty = quantityOf(lineKey);
  const image = itemImage(item, sizeIndex);
  const price = itemPrice(item, sizeIndex);

  return (
    <article
      className={`product-card${animate ? " reveal" : ""}${quick ? " is-quick" : ""}`}
      data-item-id={item.id}
      data-reveal={animate ? "fade-up" : undefined}
    >
      <div className="product-card_media" onClick={() => onOpen(item)}>
        <SafeImage
          src={image}
          alt={`${item.name} \u2014 ${item.category} from Nilgiribytes`}
          width={480}
          height={360}
          loading="lazy"
        />
        <button
          type="button"
          className="product-card_view"
          aria-label={`View details for ${item.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpen(item);
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M15 3h6v6" />
            <path d="M9 21H3v-6" />
            <path d="M21 3l-7 7" />
            <path d="M3 21l7-7" />
          </svg>
        </button>
      </div>

      <div className="product-card_body">
        <div className="product-card_top">
          <h3 className="product-card_name">
            <button
              type="button"
              className="product-card_link-btn"
              onClick={() => onOpen(item)}
              aria-label={`View details for ${item.name}`}
            >
              {item.name}
            </button>
          </h3>
          <p className="product-card_price">
            {formatINR(price)}
            {item.kind === "combo"
              ? ""
              : ` / ${itemSizeLabel(item, sizeIndex)}`}
          </p>
        </div>

        {item.kind === "combo" ? (
          <p className="product-card_includes">
            Includes:{" "}
            {item.includes
              .map((include) => `${include.name} ${include.quantity}`)
              .join(" \u00b7 ")}
          </p>
        ) : null}

        <div className="product-card_footer">
          {item.kind === "product" ? (
            <div className="size-select_wrap">
              <span className="size-select_label">Size</span>
              <div
                className="size-select"
                role="group"
                aria-label={`Choose size for ${item.name}`}
              >
                {item.sizes.map((size, index) => (
                  <button
                    key={size.label}
                    type="button"
                    className="size-select_btn"
                    aria-pressed={index === sizeIndex}
                    onClick={() => setSizeIndex(index)}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
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
