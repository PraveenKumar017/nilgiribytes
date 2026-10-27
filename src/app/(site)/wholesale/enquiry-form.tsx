"use client";

import { useState } from "react";
import { whatsappLink } from "@/lib/whatsapp";

const ENQUIRY_TYPES = [
  "Wholesale supply",
  "Distributor partnership",
  "Cafe / restaurant supply",
  "Bulk order",
  "Corporate gifting",
  "Other",
];

function formText(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function WholesaleEnquiryForm() {
  const [status, setStatus] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = formText(data, "name");
    const business = formText(data, "business");
    const phone = formText(data, "phone");
    const email = formText(data, "email");
    const city = formText(data, "city");
    const enquiryType = formText(data, "enquiryType");
    const quantity = formText(data, "quantity");
    const timeline = formText(data, "timeline");
    const message = formText(data, "message");

    const lines = [
      "Hello Nilgiribytes! I would like to make a business enquiry.",
      "",
      `Enquiry type: ${enquiryType}`,
      `Name: ${name}`,
      business ? `Business: ${business}` : "",
      `Phone: ${phone}`,
      email ? `Email: ${email}` : "",
      `City: ${city}`,
      quantity ? `Estimated quantity: ${quantity}` : "",
      timeline ? `Required by: ${timeline}` : "",
      "",
      `Details: ${message}`,
      "",
      "(Wholesale / bulk enquiry from the website)",
    ].filter(Boolean);

    setStatus("Opening WhatsApp with your enquiry...");
    window.location.href = whatsappLink(lines.join("\n"));
  }

  return (
    <form
      className="contact-form contact-form--compact"
      onSubmit={handleSubmit}
    >
      <h2 className="contact-card_title">Send an enquiry</h2>
      <p className="form-hint">
        Share your requirement and we will confirm availability, pricing and
        delivery details.
      </p>

      <div className="contact-form_split">
        <div className="contact-form_row">
          <label htmlFor="wholesale-name">Your name *</label>
          <input
            className="input"
            id="wholesale-name"
            name="name"
            type="text"
            placeholder="Your full name"
            autoComplete="name"
            required
          />
        </div>
        <div className="contact-form_row">
          <label htmlFor="wholesale-business">Business name</label>
          <input
            className="input"
            id="wholesale-business"
            name="business"
            type="text"
            placeholder="Business or shop name"
            autoComplete="organization"
          />
        </div>
      </div>

      <div className="contact-form_split">
        <div className="contact-form_row">
          <label htmlFor="wholesale-phone">Phone / WhatsApp *</label>
          <input
            className="input"
            id="wholesale-phone"
            name="phone"
            type="tel"
            placeholder="Phone or WhatsApp number"
            inputMode="tel"
            autoComplete="tel"
            required
          />
        </div>
        <div className="contact-form_row">
          <label htmlFor="wholesale-email">Email</label>
          <input
            className="input"
            id="wholesale-email"
            name="email"
            type="email"
            placeholder="you@business.com"
            autoComplete="email"
          />
        </div>
      </div>

      <div className="contact-form_split">
        <div className="contact-form_row">
          <label htmlFor="wholesale-city">City / delivery location *</label>
          <input
            className="input"
            id="wholesale-city"
            name="city"
            type="text"
            placeholder="City or delivery location"
            autoComplete="address-level2"
            required
          />
        </div>
        <div className="contact-form_row">
          <label htmlFor="wholesale-type">Enquiry type *</label>
          <select
            className="select"
            id="wholesale-type"
            name="enquiryType"
            defaultValue=""
            required
          >
            <option value="" disabled>
              Select an option
            </option>
            {ENQUIRY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="contact-form_split">
        <div className="contact-form_row">
          <label htmlFor="wholesale-quantity">Estimated quantity</label>
          <input
            className="input"
            id="wholesale-quantity"
            name="quantity"
            type="text"
            placeholder="Example: 50 kg per month"
          />
        </div>
        <div className="contact-form_row">
          <label htmlFor="wholesale-timeline">Required by</label>
          <input
            className="input"
            id="wholesale-timeline"
            name="timeline"
            type="text"
            placeholder="Example: Within 2 weeks"
          />
        </div>
      </div>

      <div className="contact-form_row">
        <label htmlFor="wholesale-message">Your requirement *</label>
        <textarea
          className="textarea"
          id="wholesale-message"
          name="message"
          required
          placeholder="Tell us about the products, quantities, packaging or gifting requirements."
        />
      </div>

      <div className="contact-actions">
        <button className="btn btn--primary" type="submit">
          Enquire
        </button>
      </div>

      <p className="contact-status" role="status">
        {status}
      </p>
      <p className="form-hint">
        This opens WhatsApp with your details filled in. We will reach out to
        you within 12 hours.
      </p>
    </form>
  );
}
