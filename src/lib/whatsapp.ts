import type { CartLine } from "./types";
import { formatINR } from "./format";
import { WHATSAPP_NUMBER } from "./site";

export const DEFAULT_WHATSAPP_MESSAGE =
  "Hello Nilgiribytes! Can you send more details about your products?";

export function whatsappLink(message?: string): string {
  const text = message?.trim() ? message : DEFAULT_WHATSAPP_MESSAGE;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function buildOrderMessage(lines: CartLine[], orderNumber?: string): string {
  const total = lines.reduce((sum, line) => sum + line.pricePaise * line.qty, 0);
  const count = lines.reduce((sum, line) => sum + line.qty, 0);

  const itemLines = lines.map(
    (line, index) =>
      `${index + 1}. ${line.name} (${line.sizeLabel}) x${line.qty} \u2014 ${formatINR(
        line.pricePaise * line.qty
      )}`
  );

  return [
    "Hello Nilgiribytes! I would like to place an order:",
    orderNumber ? `Order: ${orderNumber}` : "",
    "",
    itemLines.join("\n"),
    "",
    `Total: ${formatINR(total)}`,
    "",
    `Items: ${count}`,
    "(Please confirm delivery/pickup details. \u2014 order from website)",
  ]
    .filter((line) => line !== "")
    .join("\n");
}
