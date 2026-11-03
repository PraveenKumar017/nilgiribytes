import { formatINR } from "./format";
import type { PricedOrderLine } from "./order-pricing";
import {
  CONTACT_EMAIL,
  absoluteUrl,
  PHONE_DISPLAY,
} from "./site";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDER =
  process.env.ORDER_FROM_EMAIL ||
  process.env.WHOLESALE_FROM_EMAIL ||
  "Nilgiribytes <onboarding@resend.dev>";
const STORE_EMAIL =
  process.env.ORDER_NOTIFICATION_EMAIL ||
  process.env.WHOLESALE_ENQUIRY_EMAIL ||
  CONTACT_EMAIL;

export type OrderConfirmationEmail = {
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  address?: string | null;
  orderNumber: string;
  paymentId: string;
  razorpayOrderId: string;
  lines: PricedOrderLine[];
  subtotalPaise: number;
  paidAt?: Date;
};

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character
  );
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function buildHtml(
  data: OrderConfirmationEmail,
  orderUrl: string,
  trackUrl: string
): string {
  const paidAt = data.paidAt ?? new Date();
  const itemRows = data.lines
    .map((line) => {
      const size = line.sizeLabel
        ? `<span style="display:block;color:#6e6258;font-size:12px;margin-top:2px;">${escapeHtml(
            line.sizeLabel
          )}</span>`
        : "";
      return `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #efe3cd;color:#35170f;font-size:14px;vertical-align:top;">
            ${escapeHtml(line.name)}${size}
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #efe3cd;color:#35170f;font-size:14px;text-align:center;vertical-align:top;white-space:nowrap;">
            ${line.quantity}
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #efe3cd;color:#6e6258;font-size:14px;text-align:right;vertical-align:top;white-space:nowrap;">
            ${escapeHtml(formatINR(line.unitPricePaise))}
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #efe3cd;color:#35170f;font-size:14px;text-align:right;vertical-align:top;white-space:nowrap;">
            ${escapeHtml(formatINR(line.lineTotalPaise))}
          </td>
        </tr>`;
    })
    .join("");

  const detailRow = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 14px;color:#6e6258;font-size:13px;width:36%;vertical-align:top;">${escapeHtml(
        label
      )}</td>
      <td style="padding:8px 14px;color:#35170f;font-size:14px;vertical-align:top;">${escapeHtml(
        value
      )}</td>
    </tr>`;

  const detailRows = [
    detailRow("Order ID", data.orderNumber),
    detailRow("Razorpay order ID", data.razorpayOrderId),
    detailRow("Payment ID", data.paymentId),
    detailRow("Order date", formatDateTime(paidAt)),
    detailRow("Payment status", "Paid"),
    data.address ? detailRow("Delivery address", data.address) : "",
    detailRow("Name", data.customerName),
    detailRow("Phone", data.customerPhone),
    data.customerEmail ? detailRow("Email", data.customerEmail) : "",
  ].join("");

  return `
  <div style="margin:0;padding:24px;background:#fbf7ef;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e4d7c1;border-radius:14px;overflow:hidden;">
      <div style="padding:22px 26px;background:#35170f;color:#f2e4c5;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#c79a42;">Nilgiribytes</p>
        <h1 style="margin:0;font-size:22px;line-height:1.3;color:#f2e4c5;">Order confirmed</h1>
      </div>
      <div style="padding:22px 26px 8px;">
        <p style="margin:0;color:#35170f;font-size:15px;line-height:1.6;">
          Hi ${escapeHtml(data.customerName)}, thank you for your order. Your payment was successful and we are preparing your items fresh.
        </p>
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
        ${detailRows}
      </table>
      <div style="padding:20px 26px 4px;">
        <h2 style="margin:0 0 10px;color:#35170f;font-size:16px;">Items ordered</h2>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th align="left" style="padding:10px 14px;background:#fbf7ef;border-bottom:1px solid #e4d7c1;color:#6e6258;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Item</th>
              <th align="center" style="padding:10px 14px;background:#fbf7ef;border-bottom:1px solid #e4d7c1;color:#6e6258;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Qty</th>
              <th align="right" style="padding:10px 14px;background:#fbf7ef;border-bottom:1px solid #e4d7c1;color:#6e6258;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Price</th>
              <th align="right" style="padding:10px 14px;background:#fbf7ef;border-bottom:1px solid #e4d7c1;color:#6e6258;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" align="right" style="padding:14px;color:#35170f;font-size:14px;font-weight:600;">Total paid</td>
              <td align="right" style="padding:14px;color:#35170f;font-size:16px;font-weight:700;white-space:nowrap;">${escapeHtml(
                formatINR(data.subtotalPaise)
              )}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div style="padding:16px 26px 24px;">
        <a href="${escapeHtml(
          orderUrl
        )}" style="display:inline-block;padding:11px 22px;background:#6b4423;color:#fbf7ef;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">View order details</a>
        <a href="${escapeHtml(
          trackUrl
        )}" style="display:inline-block;margin-left:10px;padding:10px 20px;background:#ffffff;color:#6b4423;text-decoration:none;border:1px solid #6b4423;border-radius:8px;font-size:14px;font-weight:600;">Track your order</a>
      </div>
      <div style="padding:16px 26px;background:#fbf7ef;color:#6e6258;font-size:12px;line-height:1.7;">
        Need help with your order? Reply to this email or WhatsApp us at ${escapeHtml(
          PHONE_DISPLAY
        )}.<br />
        Nilgiribytes, Kotagiri, Tamil Nadu 643217
      </div>
    </div>
  </div>`;
}

function buildText(
  data: OrderConfirmationEmail,
  orderUrl: string,
  trackUrl: string
): string {
  const paidAt = data.paidAt ?? new Date();
  const items = data.lines.map(
    (line) =>
      `- ${line.name}${line.sizeLabel ? ` (${line.sizeLabel})` : ""} x ${
        line.quantity
      } - ${formatINR(line.lineTotalPaise)}`
  );

  return [
    "Order confirmed",
    "",
    `Hi ${data.customerName}, thank you for your order. Your payment was successful.`,
    "",
    `Order ID: ${data.orderNumber}`,
    `Razorpay order ID: ${data.razorpayOrderId}`,
    `Payment ID: ${data.paymentId}`,
    `Order date: ${formatDateTime(paidAt)}`,
    `Payment status: Paid`,
    data.address ? `Delivery address: ${data.address}` : "",
    `Phone: ${data.customerPhone}`,
    data.customerEmail ? `Email: ${data.customerEmail}` : "",
    "",
    "Items ordered:",
    ...items,
    "",
    `Total paid: ${formatINR(data.subtotalPaise)}`,
    "",
    `View order details: ${orderUrl}`,
    `Track your order: ${trackUrl}`,
    "",
    `Need help? WhatsApp us at ${PHONE_DISPLAY}.`,
    "Nilgiribytes, Kotagiri, Tamil Nadu 643217",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export async function sendOrderConfirmationEmail(
  data: OrderConfirmationEmail
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error("Order confirmation email skipped: RESEND_API_KEY is not set.");
    return false;
  }

  const customerEmail = data.customerEmail?.trim();
  const recipients = customerEmail ? [customerEmail] : [STORE_EMAIL];
  const bcc =
    customerEmail && STORE_EMAIL && STORE_EMAIL !== customerEmail
      ? [STORE_EMAIL]
      : undefined;

  if (!recipients.length || !recipients[0]) {
    console.error("Order confirmation email skipped: no recipient available.");
    return false;
  }

  const orderUrl = absoluteUrl(
    `/order-confirmation?order=${encodeURIComponent(
      data.orderNumber
    )}&payment=${encodeURIComponent(data.paymentId)}`
  );
  const trackUrl = absoluteUrl(
    `/track-order?order=${encodeURIComponent(data.orderNumber)}`
  );

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: SENDER,
        to: recipients,
        bcc,
        subject: `Order ${data.orderNumber} confirmed - Nilgiribytes`,
        html: buildHtml(data, orderUrl, trackUrl),
        text: buildText(data, orderUrl, trackUrl),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Order confirmation email failed", response.status, detail);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Order confirmation email request failed", error);
    return false;
  }
}
