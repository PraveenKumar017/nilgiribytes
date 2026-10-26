import type { Metadata } from "next";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";

type SeoInput = {
  title: string;
  description?: string;
  path: string;
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  authors?: string[];
};

export function pageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path,
  image = "/assets/hero_image_bg.png",
  noIndex = false,
  type = "website",
  publishedTime,
  authors,
}: SeoInput): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = image.startsWith("http") ? image : absoluteUrl(image);

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type,
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_IN",
      images: [{ url: imageUrl, alt: title }],
      ...(type === "article" ? { publishedTime, authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function bakeryJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    "@id": `${SITE_URL}/#bakery`,
    name: SITE_NAME,
    description:
      "Authentic Ooty Varkey, biscuits and signature combos baked fresh every day in Kotagiri.",
    url: `${SITE_URL}/`,
    image: absoluteUrl("/assets/hero_image_bg.png"),
    telephone: "+91-93449-21647",
    priceRange: "$$",
    currenciesAccepted: "INR",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kotagiri",
      addressRegion: "Tamil Nadu",
      postalCode: "643217",
      addressCountry: "IN",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "08:00",
        closes: "21:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Sunday",
        opens: "09:00",
        closes: "20:00",
      },
    ],
    sameAs: ["https://www.instagram.com/nilgiri_bytes"],
  };
}
