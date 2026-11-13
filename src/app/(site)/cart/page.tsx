import type { Metadata } from "next";
import { getAdminSettings } from "@/lib/admin";
import { CartView } from "./cart-view";

export const metadata: Metadata = {
  title: "Your Cart | Nilgiribytes",
  description: "Review your Nilgiribytes cart and place your order online.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/cart" },
};

export default async function CartPage() {
  const settings = await getAdminSettings();

  return (
    <main id="main-content">
      <section className="section" aria-labelledby="cart-title">
        <div className="container">
          <CartView
            offerBannerEnabled={settings.offerBannerEnabled}
            codEnabled={settings.codEnabled}
          />
        </div>
      </section>
    </main>
  );
}
