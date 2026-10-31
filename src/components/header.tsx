"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./cart-provider";

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
            </ul>
          </nav>

          <div className="header-actions">
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
