import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const enquirySchema = z.object({
  name: z.string().trim().min(1).max(120),
  business: z.string().trim().max(160).optional().default(""),
  phone: z.string().trim().min(3).max(40),
  email: z.string().trim().max(160).optional().default(""),
  city: z.string().trim().min(1).max(120),
  enquiryType: z.string().trim().min(1).max(80),
  quantity: z.string().trim().max(120).optional().default(""),
  timeline: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().min(1).max(4000),
});

const RECIPIENT =
  process.env.WHOLESALE_ENQUIRY_EMAIL || "praveenkumarsaravanan17@gmail.com";
const SENDER =
  process.env.WHOLESALE_FROM_EMAIL ||
  "Nilgiribytes Website <onboarding@resend.dev>";

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
      })[character] ?? character,
  );
}

function row(label: string, value: string): string {
  if (!value) {
    return "";
  }
  return `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #efe3cd;color:#6e6258;font-size:13px;width:36%;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #efe3cd;color:#35170f;font-size:14px;vertical-align:top;">${escapeHtml(value)}</td>
    </tr>`;
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Email service is not configured." },
      { status: 500 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = enquirySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the enquiry details and try again." },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const rows = [
    row("Enquiry type", data.enquiryType),
    row("Name", data.name),
    row("Business", data.business),
    row("Phone / WhatsApp", data.phone),
    row("Email", data.email),
    row("City / delivery location", data.city),
    row("Estimated quantity", data.quantity),
    row("Required by", data.timeline),
    row("Requirement", data.message),
  ].join("");

  const html = `
  <div style="margin:0;padding:24px;background:#fbf7ef;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e4d7c1;border-radius:14px;overflow:hidden;">
      <div style="padding:22px 26px;background:#35170f;color:#f2e4c5;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#c79a42;">Nilgiribytes wholesale</p>
        <h1 style="margin:0;font-size:22px;line-height:1.3;color:#f2e4c5;">New wholesale enquiry</h1>
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
        ${rows}
      </table>
      <div style="padding:16px 26px;background:#fbf7ef;color:#6e6258;font-size:12px;">
        Sent from the Nilgiribytes website wholesale enquiry form.
      </div>
    </div>
  </div>`;

  const text = [
    "New wholesale enquiry",
    "",
    `Enquiry type: ${data.enquiryType}`,
    `Name: ${data.name}`,
    data.business ? `Business: ${data.business}` : "",
    `Phone / WhatsApp: ${data.phone}`,
    data.email ? `Email: ${data.email}` : "",
    `City / delivery location: ${data.city}`,
    data.quantity ? `Estimated quantity: ${data.quantity}` : "",
    data.timeline ? `Required by: ${data.timeline}` : "",
    "",
    `Requirement: ${data.message}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: SENDER,
        to: [RECIPIENT],
        reply_to: data.email || undefined,
        subject: `${data.enquiryType} - regarding wholesale`,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Resend email failed", response.status, detail);
      return NextResponse.json(
        { error: "Unable to send the email right now." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Resend request failed", error);
    return NextResponse.json(
      { error: "Unable to send the email right now." },
      { status: 502 },
    );
  }
}
