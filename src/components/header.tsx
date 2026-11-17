"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { INSTAGRAM_URL, LINKEDIN_URL } from "@/lib/site";
import { useCart } from "./cart-provider";

const SOCIALS = [
  {
    href: INSTAGRAM_URL,
    label: "Instagram",
    path: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm5-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z",
  },
  {
    href: LINKEDIN_URL,
    label: "LinkedIn",
    path: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h4v1.7h.1c.6-1 2-2 3.4-2 3.5 0 4.5 2.3 4.5 5.3V21h-4v-6.3c0-1.5 0-3.3-2-3.3s-2.4 1.6-2.4 3.2V21H9V9Z",
  },
];

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/wholesale", label: "Wholesale" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
];

export function Header() {
  const pathname = usePathname();
  const { count } = useCart();
  const [navOpen, setNavOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pop, setPop] = useState(false);
  const previousCount = useRef<number | null>(null);

  useEffect(() => {
    document.body.classList.toggle("nav-is-open", navOpen);
    return () => document.body.classList.remove("nav-is-open");
  }, [navOpen]);

  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    }
    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (previousCount.current !== null && previousCount.current !== count) {
      setPop(true);
      const timer = window.setTimeout(() => setPop(false), 450);
      previousCount.current = count;
      return () => window.clearTimeout(timer);
    }
    previousCount.current = count;
  }, [count]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>


      <header className="site-header">
        <div className="container site-header_inner">
          <Link
            className={`site-logo${logoFailed ? " is-fallback" : ""}`}
            href="/"
            aria-label="Nilgiribytes - Home"
          >
            <img
              src="/assets/nilgiribytes_header.png"
              alt=""
              width={200}
              height={200}
              data-logo-img
              onError={() => setLogoFailed(true)}
            />
            <span className="site-logo_name">Nilgiribytes</span>
          </Link>

          <nav
            className={`site-nav${navOpen ? " is-open" : ""}`}
            id="site-nav"
            aria-label="Main navigation"
          >
            <button
              className="icon-btn site-nav_close"
              type="button"
              onClick={() => setNavOpen(false)}
              aria-label="Close menu"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <ul className="site-nav_list">
              {NAV.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      className="site-nav_link"
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setNavOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              <li className="site-nav_mobile-only">
                <Link
                  className="site-nav_link"
                  href="/track-order"
                  aria-current={
                    pathname === "/track-order" ||
                    pathname.startsWith("/track-order/")
                      ? "page"
                      : undefined
                  }
                  onClick={() => setNavOpen(false)}
                >
                  Track order
                </Link>
              </li>
            </ul>
          </nav>

          <div className="header-actions">
            <div className="header-socials" aria-label="Social media links">
              {SOCIALS.map(({ href, label, path }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener"
                  aria-label={`Nilgiribytes on ${label}`}
                  onClick={() => setNavOpen(false)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d={path} />
                  </svg>
                </a>
              ))}
            </div>
            <Link
              className="icon-btn"
              href="/cart"
              aria-label="Open cart"
              onClick={() => setNavOpen(false)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6h15l-1.5 9h-12z" />
                <path d="M6 6 5 3H2" />
                <circle cx="9" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>
              <span
                className={`cart-count${pop ? " is-pop" : ""}`}
                data-cart-count
                aria-hidden="true"
              >
                {count}
              </span>
            </Link>
            <button
              className="icon-btn nav-toggle"
              type="button"
              onClick={() => setNavOpen((open) => !open)}
              aria-expanded={navOpen}
              aria-controls="site-nav"
              aria-label={navOpen ? "Close menu" : "Open menu"}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div
        className={`overlay site-nav_overlay${navOpen ? " is-open" : ""}`}
        aria-hidden="true"
        onClick={() => setNavOpen(false)}
      />
    </>
  );
}
