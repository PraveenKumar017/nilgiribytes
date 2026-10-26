"use client";

import Link from "next/link";
import { formatINR } from "@/lib/format";
import { buildOrderMessage, whatsappLink } from "@/lib/whatsapp";
import { useCart } from "@/components/cart-provider";
import { SafeImage } from "@/components/safe-image";

export function CartView() {
  const { lines, ready, count, subtotal, changeQty } = useCart();

  if (!ready) {
    return (
      <div className="cart-page_head">
        <div>
          <span className="section-kicker">Your order</span>
          <h1 className="section-heading cart-page_title" id="cart-title">
            Shopping Cart
          </h1>
        </div>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <>
        <div
          className="cart-page_head reveal"
          data-reveal="fade-up"
        >
          <div>
            <span className="section-kicker">Your order</span>
            <h1 className="section-heading cart-page_title" id="cart-title">
              Shopping Cart
            </h1>
          </div>
          <Link className="cart-page_continue" href="/shop">
            &larr; Continue shopping
          </Link>
        </div>

        <div
          className="empty-state cart-page_empty reveal"
          data-reveal="fade-up"
        >
          <svg className="cart-page_empty-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6h15l-1.5 9h-12z" />
            <path d="M6 6 5 3H2" />
            <circle cx="9" cy="20" r="1" />
            <circle cx="18" cy="20" r="1" />
          </svg>
          <p className="cart-page_empty-title">Your cart is empty</p>
          <p className="cart-page_empty-text">
            Fresh varkey and biscuits are waiting at the shop.
          </p>
          <Link
            className="btn btn--primary"
            href="/shop"
            style={{
              padding: "0.5rem 1.4rem",
              fontSize: "0.86rem",
              lineHeight: 1.2,
            }}
          >
            Browse Products
          </Link>
        </div>
      </>
    );
  }

  const orderHref = whatsappLink(buildOrderMessage(lines));

  return (
    <>
      <div className="cart-page_head reveal" data-reveal="fade-up">
        <div>
          <span className="section-kicker">Your order</span>
          <h1 className="section-heading cart-page_title" id="cart-title">
            Shopping Cart
          </h1>
        </div>
        <Link className="cart-page_continue" href="/shop">
          &larr; Continue shopping
        </Link>
      </div>

      <div className="cart-page_grid">
        <div className="cart-page_lines">
          {lines.map((line) => (
            <div className="cart-line" key={line.key}>
              <div className="cart-line_media">
                <SafeImage
                  className="cart-line_img"
                  src={line.image}
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                />
              </div>
              <div className="cart-line_info">
                <div className="cart-line_row">
                  <p className="cart-line_name">{line.name}</p>
                  <div className="qty-stepper">
                    <button
                      type="button"
                      onClick={() => changeQty(line.key, -1)}
                      aria-label={`Decrease quantity of ${line.name}`}
                    >
                      &minus;
                    </button>
                    <span aria-live="polite">{line.qty}</span>
                    <button
                      type="button"
                      onClick={() => changeQty(line.key, 1)}
                      aria-label={`Increase quantity of ${line.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="cart-line_row">
                  <p className="cart-line_meta">
                    {line.sizeLabel} &middot; {formatINR(line.pricePaise)} each
                  </p>
                  <p className="cart-line_price">
                    {formatINR(line.pricePaise * line.qty)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="cart-page_summary" aria-label="Order summary">
          <h2 className="cart-page_summary-title">Order Summary</h2>
          <div className="cart-summary">
            <span>Items</span>
            <span>
              {count} {count === 1 ? "item" : "items"}
            </span>
          </div>
          <hr className="cart-page_summary-rule" />
          <div className="cart-summary cart-summary--total">
            <span>Subtotal</span>
            <span className="cart-summary_total">{formatINR(subtotal)}</span>
          </div>
          <p className="cart-page_delivery-note">
            Delivery or pickup charges, if any, are confirmed on WhatsApp.
          </p>
          <a
            className="btn btn--whatsapp cart-page_order-btn"
            href={orderHref}
            target="_blank"
            rel="noopener"
            style={{
              padding: "0.5rem 1.4rem",
              fontSize: "0.86rem",
              lineHeight: 1.2,
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="cart-page_wa-icon">
              <path d="M12 2a9.9 9.9 0 0 0-8.5 15.1L2 22l5-1.4A9.9 9.9 0 1 0 12 2Zm0 1.8a8.1 8.1 0 0 1 6.6 12.9 8.1 8.1 0 0 1-11.2 2.2l-.4-.2-3 .8.8-2.9-.2-.4A8.1 8.1 0 0 1 12 3.8Zm-3.3 4c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.4 3.8 2.2.9 2.6.7 3.1.7s1.5-.6 1.7-1.2c.2-.6.2-1.1.1-1.2l-.6-.3-1.6-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.8-1.9c-.2-.4-.4-.4-.6-.4h-.5Z" />
            </svg>
            Order on WhatsApp
          </a>
          <p className="cart-note">
            Your order summary opens in WhatsApp - confirm quantity and delivery
            with us directly.
          </p>
        </aside>
      </div>
    </>
  );
}
