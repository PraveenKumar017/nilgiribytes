export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.niligibytes.com";

export const SITE_NAME = "Nilgiribytes";

export const SITE_DESCRIPTION =
  "Nilgiribytes \u2014 traditional varkey, biscuits and signature combos baked fresh every day in Kotagiri.";

export const SITE_KEYWORDS = [
  "Nilgiribytes",
  "Ooty Varkey",
  "Original Ooty Varkey",
  "Ooty Varkey biscuit",
  "Crispy Ooty Varkey",
  "Traditional Ooty Varkey",
  "Nilgiris Varkey",
  "buy Ooty Varkey online",
  "order Ooty Varkey",
  "Ooty Varkey online delivery",
  "best Ooty Varkey brand",
  "Ooty Varkey price",
  "homemade Ooty snacks online",
  "Ooty famous snacks",
  "Nilgiri bakery products",
  "Ooty GI tag varkey",
  "Tamil Nadu traditional snacks",
  "Ooty local food specialties",
  "firewood baked varkey",
  "tea time snacks varkey",
  "crispy bakery biscuits",
  "wheat Ooty varkey",
  "Kotagiri bakery",
  "Ooty bakery",
  "Nilgiris bakery",
  "Varkey biscuits",
  "premium Varkey",
  "mini Varkey",
  "Varkey flakes",
  "salt biscuits",
  "sweet biscuits",
  "bakery combos",
  "wholesale bakery Nilgiris",
  "freshly baked biscuits",
];

export const PHONE_DISPLAY = "+91 93449 21647";
export const PHONE_TEL = "+919344921647";
export const WHATSAPP_NUMBER = "919344921647";
export const CONTACT_EMAIL = "nilgiribytes.info@gmail.com";

export const ADDRESS = {
  locality: "Kotagiri",
  region: "Tamil Nadu",
  postalCode: "643217",
  country: "IN",
};

export const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Nilgiribytes%2C%20Kotagiri%2C%20Tamil%20Nadu%20643217";

export const MAPS_EMBED_URL =
  "https://maps.google.com/maps?q=Nilgiribytes%2C%20Kotagiri%2C%20Tamil%20Nadu%20643217&t=&z=14&ie=UTF8&iwloc=&output=embed";

export const INSTAGRAM_URL = "https://www.instagram.com/nilgiri_bytes";

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
