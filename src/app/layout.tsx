import type { Metadata, Viewport } from "next";
import { Inter, Lora, Playfair_Display } from "next/font/google";
import "./styles/variables.css";
import "./styles/style.css";
import "./styles/responsive.css";
import "./styles/animations.css";
import "./styles/hero.css";
import "./styles/site.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

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
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${lora.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
