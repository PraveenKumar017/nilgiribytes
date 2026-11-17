import { AnnouncementBar } from "@/components/announcement-bar";
import { CartBar } from "@/components/cart-bar";
import { CartProvider } from "@/components/cart-provider";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SiteEffects } from "@/components/site-effects";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <CartProvider>
      <SiteEffects />
      <div className="site-shell">
        <AnnouncementBar />
        <Header />
        {children}
        <Footer />
      </div>
      <CartBar />
      <FloatingWhatsApp />
    </CartProvider>
  );
}
