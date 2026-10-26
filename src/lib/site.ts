export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.niligibytes.com";

export const SITE_NAME = "Nilgiribytes";

export const SITE_DESCRIPTION =
  "Nilgiribytes \u2014 traditional varkey, biscuits and signature combos baked fresh every day in Kotagiri.";

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
