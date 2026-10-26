import type { Metadata } from "next";
import { CartView } from "./cart-view";

export const metadata: Metadata = {
  title: "Your Cart | Nilgiribytes",
  description: "Review your Nilgiribytes cart and place your order on WhatsApp.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/cart" },
};

export default function CartPage() {
  return (
    <main id="main-content">
      <section className="section" aria-labelledby="cart-title">
        <div className="container">
          <CartView />
        </div>
      </section>
    </main>
  );
}
