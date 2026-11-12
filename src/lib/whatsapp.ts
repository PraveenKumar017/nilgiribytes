import { WHATSAPP_NUMBER } from "./site";

export const DEFAULT_WHATSAPP_MESSAGE =
  "Hello Nilgiribytes! Can you send more details about your products?";

export function whatsappLink(message?: string): string {
  const text = message?.trim() ? message : DEFAULT_WHATSAPP_MESSAGE;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
