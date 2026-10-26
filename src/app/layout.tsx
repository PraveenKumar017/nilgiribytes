import type { Metadata, Viewport } from "next";
import "./styles/variables.css";
import "./styles/style.css";
import "./styles/responsive.css";
import "./styles/animations.css";
import "./styles/hero.css";
import "./styles/site.css";
import { CartProvider } from "@/components/cart-provider";
import { CartBar } from "@/components/cart-bar";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SiteEffects } from "@/components/site-effects";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Nilgiribytes | Freshly Baked Varkey, Biscuits & Combos",
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: { canonical: SITE_URL },
  icons: {
    icon: [
      { url: "/assets/favicon.ico", sizes: "any" },
      { url: "/assets/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/assets/favicon-48x48.png", type: "image/png", sizes: "48x48" },
    ],
    apple: [{ url: "/assets/apple-touch-icon.png" }],
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    url: SITE_URL,
    title: "Nilgiribytes | Every Bite Tells a Story",
    description:
      "Discover the warmth of freshly baked favourites - varkey, biscuits and combos made for life's sweetest moments.",
    images: [
      {
        url: "/assets/hero_image_bg.png",
        alt: "Freshly baked varkey and biscuits at Nilgiribytes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nilgiribytes | Every Bite Tells a Story",
    description:
      "Freshly baked varkey, biscuits and combos - made for life's sweetest moments.",
    images: ["/assets/hero_image_bg.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#35170F",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;1,400;1,500&family=Outfit:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CartProvider>
          <SiteEffects />
          <Header />
          {children}
          <Footer />
          <CartBar />
          <FloatingWhatsApp />
        </CartProvider>
      </body>
    </html>
  );
}
