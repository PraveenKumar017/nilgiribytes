"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { whatsappLink } from "@/lib/whatsapp";

const ENQUIRY_TYPES = [
  "Wholesale supply",
  "Distributor partnership",
  "Cafe / restaurant supply",
  "Bulk order",
  "Corporate gifting",
  "Other",
];

type EnquiryDetails = {
  name: string;
  business: string;
  phone: string;
  email: string;
  city: string;
  enquiryType: string;
  quantity: string;
  timeline: string;
  message: string;
};

type Channel = "whatsapp" | "email";

const CHANNEL_OPTIONS: { value: Channel; title: string; text: string }[] = [
  {
    value: "whatsapp",
    title: "WhatsApp",
    text: "Open WhatsApp with your enquiry details filled in.",
  },
  {
    value: "email",
    title: "Email",
    text: "Send the same details to our wholesale team by email.",
  },
];

function formText(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildWhatsAppMessage(details: EnquiryDetails): string {
  const lines = [
    "Hello Nilgiribytes! I would like to make a business enquiry.",
    "",
    `Enquiry type: ${details.enquiryType}`,
    `Name: ${details.name}`,
    details.business ? `Business: ${details.business}` : "",
    `Phone: ${details.phone}`,
    details.email ? `Email: ${details.email}` : "",
    `City: ${details.city}`,
    details.quantity ? `Estimated quantity: ${details.quantity}` : "",
    details.timeline ? `Required by: ${details.timeline}` : "",
    "",
    `Details: ${details.message}`,
    "",
    "(Wholesale / bulk enquiry from the website)",
  ].filter(Boolean);

  return lines.join("\n");
}

export function WholesaleEnquiryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("");
  const [enquiryType, setEnquiryType] = useState("");
  const [pending, setPending] = useState<EnquiryDetails | null>(null);
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    // Function to handle hash changes and scroll
    const handleHashChange = () => {
      const hash = window.location.hash;
      const match = hash.match(/type=([^&]*)/);
      if (match) {
        const type = decodeURIComponent(match[1]);

        if (ENQUIRY_TYPES.includes(type)) {
          setEnquiryType(type);
          // Scroll to the form smoothly
          setTimeout(() => {
            const formElement = document.getElementById("wholesale-enquiry");
            if (formElement) {
              formElement.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }, 50);
        }
      }
    };

    // Handle initial load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (!pending) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => dialogRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !sending) {
        setPending(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pending, sending]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setSendError("");
    setStatus("");
    setChannel("whatsapp");
    setPending({
      name: formText(data, "name"),
      business: formText(data, "business"),
      phone: formText(data, "phone"),
      email: formText(data, "email"),
      city: formText(data, "city"),
      enquiryType: formText(data, "enquiryType"),
      quantity: formText(data, "quantity"),
      timeline: formText(data, "timeline"),
      message: formText(data, "message"),
    });
  }

  function closeModal() {
    if (!sending) {
      setPending(null);
    }
  }

  async function handleProceed() {
    if (!pending) {
      return;
    }

    if (channel === "whatsapp") {
      const message = buildWhatsAppMessage(pending);
      setStatus("Opening WhatsApp with your enquiry...");
      setPending(null);
      window.location.href = whatsappLink(message);
      return;
    }

    setSending(true);
    setSendError("");

    try {
      const response = await fetch("/api/wholesale-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending),
      });

      if (!response.ok) {
        throw new Error("Unable to send email");
      }

      formRef.current?.reset();
      setEnquiryType("");
      setPending(null);
      setStatus(
        "Your enquiry has been emailed to us. We will get back to you within 12 hours.",
      );
    } catch {
      setSendError(
        "We could not send the email just now. Please try again or continue with WhatsApp.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <form
        className="contact-form contact-form--compact"
        onSubmit={handleSubmit}
        ref={formRef}
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
              value={enquiryType}
              onChange={(e) => setEnquiryType(e.target.value)}
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
          Choose WhatsApp or email after you press Enquire. We will reach out to
          you within 12 hours.
        </p>
      </form>

      {pending ? (
        <div
          className="enquiry-modal"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="enquiry-modal_dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="enquiry-channel-title"
            tabIndex={-1}
            ref={dialogRef}
          >
            <button
              className="enquiry-modal_close"
              type="button"
              aria-label="Close"
              onClick={closeModal}
              disabled={sending}
            >
              &times;
            </button>

            <span className="enquiry-modal_kicker">Send your enquiry</span>
            <h2 className="enquiry-modal_title" id="enquiry-channel-title">
              Choose how to send
            </h2>
            <p className="enquiry-modal_text">
              We will send the details you filled in using the method you pick.
            </p>
            <p className="enquiry-modal_summary">
              {pending.name} &middot; {pending.enquiryType}
            </p>

            <div
              className="enquiry-modal_options"
              role="radiogroup"
              aria-label="Delivery method"
            >
              {CHANNEL_OPTIONS.map((option) => (
                <label
                  className={`enquiry-modal_option${
                    channel === option.value ? " is-selected" : ""
                  }`}
                  key={option.value}
                >
                  <input
                    type="radio"
                    name="enquiry-channel"
                    value={option.value}
                    checked={channel === option.value}
                    onChange={() => setChannel(option.value)}
                  />
                  <span
                    className={`enquiry-modal_option-icon enquiry-modal_option-icon--${option.value}`}
                    aria-hidden="true"
                  >
                    {option.value === "whatsapp" ? (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.04 2a9.9 9.9 0 0 0-8.4 15.1L2 22l5-1.6A9.9 9.9 0 1 0 12.04 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .9.9-2.9-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.6-.7c.1-.2.1-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.4 3.8 2.6 1 2.6.7 3.1.6.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3Z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 48 48">
                        <path
                          fill="#4caf50"
                          d="M45 16.2l-5 2.75-5 4.75V40h7a3 3 0 0 0 3-3V16.2z"
                        />
                        <path
                          fill="#1e88e5"
                          d="M3 16.2l3.614 1.71L13 23.7V40H6a3 3 0 0 1-3-3V16.2z"
                        />
                        <path
                          fill="#e53935"
                          d="M35 11.2 24 19.45 13 11.2l-1 5.8 1 6.7L24 31.95l11-8.25 1-6.7-1-5.8z"
                        />
                        <path
                          fill="#c62828"
                          d="M3 12.298V16.2l10 7.5V11.2L9.876 8.859A4.298 4.298 0 0 0 3 12.298z"
                        />
                        <path
                          fill="#fbc02d"
                          d="M45 12.298V16.2l-10 7.5V11.2l3.124-2.341A4.298 4.298 0 0 1 45 12.298z"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="enquiry-modal_option-copy">
                    <strong>{option.title}</strong>
                    <small>{option.text}</small>
                  </span>
                </label>
              ))}
            </div>

            {sendError ? (
              <p className="enquiry-modal_error" role="alert">
                {sendError}
              </p>
            ) : null}

            <div className="enquiry-modal_actions">
              <button
                className="btn btn--primary"
                type="button"
                onClick={handleProceed}
                disabled={sending}
              >
                {sending
                  ? "Sending..."
                  : channel === "whatsapp"
                    ? "Proceed with WhatsApp"
                    : "Proceed with email"}
              </button>
              <button
                className="btn btn--outline"
                type="button"
                onClick={closeModal}
                disabled={sending}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
