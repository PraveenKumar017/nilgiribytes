import Link from "next/link";
import {
  INSTAGRAM_URL,
  MAPS_URL,
  PHONE_DISPLAY,
  PHONE_TEL,
} from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <p className="footer-brand_name">Nilgiribytes</p>
            <p className="footer-brand_text">
              Warm greetings from Nilgiribytes, Kotagiri! Authentic Ooty Varkey,
              since 1980. Retail &amp; wholesale varkey and biscuits - with a
              commitment to quality. Pre-order cakes also available.
            </p>
          </div>

          <div className="footer-col">
            <p className="footer-col_title">Explore</p>
            <ul>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/shop">Shop</Link>
              </li>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/blog">Blog</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <p className="footer-col_title">Visit us</p>
            <ul>
              <li>Kotagiri, Tamil Nadu 643217</li>
              <li>
                <a href={MAPS_URL} target="_blank" rel="noopener">
                  Open in Google Maps
                </a>
              </li>
              <li>
                <a href={`tel:${PHONE_TEL}`}>{PHONE_DISPLAY}</a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <p className="footer-col_title">Policies</p>
            <ul>
              <li>
                <Link href="/policies/privacy">Privacy policy</Link>
              </li>
              <li>
                <Link href="/policies/store">Store policy</Link>
              </li>
              <li>
                <Link href="/about#visit-us">Contact</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} Nilgiribytes. All rights reserved.{" "}
            <Link className="footer-admin-link" href="/admin">
              Admin
            </Link>
          </p>
          <div className="social-links" aria-label="Social media links">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener"
              aria-label="Nilgiribytes on Instagram"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2m0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1C2.6 9.9 2.6 10.3 2.6 12s0 2.1.1 3.3c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-3.3s0-2.1-.1-3.3c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 1.8a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Zm5.1-3.2a1.1 1.1 0 1 1 0 2.3 1.1 1.1 0 0 1 0-2.3Z" />
              </svg>
            </a>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener"
              aria-label="Chat with Nilgiribytes on WhatsApp"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2a9.9 9.9 0 0 0-8.5 15.1L2 22l5-1.4A9.9 9.9 0 1 0 12 2Zm0 1.8a8.1 8.1 0 0 1 6.6 12.9 8.1 8.1 0 0 1-11.2 2.2l-.4-.2-3 .8.8-2.9-.2-.4A8.1 8.1 0 0 1 12 3.8Zm-3.3 4c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.4 3.8 2.2.9 2.6.7 3.1.7s1.5-.6 1.7-1.2c.2-.6.2-1.1.1-1.2l-.6-.3-1.6-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.8-1.9c-.2-.4-.4-.4-.6-.4h-.5Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
