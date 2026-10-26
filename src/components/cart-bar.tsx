"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatINR } from "@/lib/format";
import { useCart } from "./cart-provider";

export function CartBar() {
  const pathname = usePathname();
  const { count, subtotal, ready } = useCart();
  const hidden = !ready || count === 0 || pathname === "/cart";

  return (
    <div
      className={`cart-bar${hidden ? "" : " is-visible"}`}
      data-cart-bar
      hidden={hidden}
    >
      <div className="cart-bar_info">
        <span className="cart-bar_count">
          {count} {count === 1 ? "item" : "items"}
        </span>
        <span className="cart-bar_total">{formatINR(subtotal)}</span>
      </div>
      <Link className="btn btn--primary cart-bar_btn" href="/cart">
        View Cart
      </Link>
    </div>
  );
}
