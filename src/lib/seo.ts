import type { Metadata } from "next";
import {
  absoluteUrl,
  CONTACT_EMAIL,
  MAPS_URL,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_URL,
} from "./site";

type SeoInput = {
  title: string;
  description?: string;
  keywords?: string[];
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
  keywords = SITE_KEYWORDS,
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
    keywords,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
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

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: `${SITE_URL}/`,
    inLanguage: "en-IN",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/assets/nilgiribytes_header.png"),
      },
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
    logo: absoluteUrl("/assets/nilgiribytes_header.png"),
    email: CONTACT_EMAIL,
    telephone: "+91-93449-21647",
    hasMap: MAPS_URL,
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
