"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { StoreProduct } from "@/lib/types";
import { SafeImage } from "./safe-image";

type PosterStyle = CSSProperties & {
  "--offset": number;
  "--scale": number;
  "--opacity": number;
};

const DEFAULT_POSTER_SLUG = "premium-special-varkey";

const POSTER_BY_SLUG: Record<string, string> = {
  "special-varkey": "/assets/images/product_poster/Special_Varkey.jpeg",
  "premium-special-varkey": "/assets/images/product_poster/Premium_Varkey.jpeg",
  "regular-varkey": "/assets/images/product_poster/Classic_Varkey.jpeg",
  "crispy-varkey": "/assets/images/product_poster/Crispy_Varkey.jpeg",
  "mini-varkey": "/assets/images/product_poster/Mini_Varkey.jpeg",
  "varkey-flakes": "/assets/images/product_poster/Varkey_Flakes.jpeg",
  "salt-biscuit": "/assets/images/product_poster/Salt_Biscuit.jpeg",
  "sweet-biscuit": "/assets/images/product_poster/Sweet_Biscuit.jpeg",
};

export function PosterRail({ products }: { products: StoreProduct[] }) {
  const posters = products
    .filter((product) => Boolean(POSTER_BY_SLUG[product.slug]))
    .map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      poster: POSTER_BY_SLUG[product.slug],
    }));
  const [active, setActive] = useState(() => {
    const defaultIndex = posters.findIndex(
      (poster) => poster.slug === DEFAULT_POSTER_SLUG
    );
    return defaultIndex >= 0 ? defaultIndex : 0;
  });
  const [paused, setPaused] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused || posters.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % posters.length),
      1000
    );
    return () => window.clearInterval(timer);
  }, [paused, posters.length]);

  if (!posters.length) return null;

  return (
    <div
      className="poster-deck reveal"
      data-reveal="fade-up"
      ref={deckRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setActive((current) => (current + 1) % posters.length);
      }}
      onFocus={(event) => {
        if (
          event.target instanceof HTMLElement &&
          event.target.matches(":focus-visible")
        ) {
          setPaused(true);
        }
      }}
      onBlur={() => setPaused(false)}
    >
      <div className="poster-stage" id="poster-rail" aria-label="Signature product range">
        {posters.map((poster, index) => {
          const count = posters.length;
          let offset = index - active;
          if (offset > count / 2) offset -= count;
          if (offset < -count / 2) offset += count;
          const abs = Math.abs(offset);
          const style: PosterStyle = {
            "--offset": offset,
            "--scale": Math.max(0.62, 1 - abs * 0.11),
            "--opacity": abs > 3 ? 0 : Math.max(0.3, 1 - abs * 0.16),
            zIndex: 20 - abs,
          };
          return (
            <div
              key={poster.id}
              className={`poster-card${offset === 0 ? " is-active" : ""}`}
              data-offset={offset}
              style={style}
            >
              <SafeImage
                className="poster-card_img"
                src={poster.poster}
                alt={`${poster.name} \u2014 Nilgiribytes`}
                width={1122}
                height={1402}
                loading="lazy"
              />
            </div>
          );
        })}
      </div>
      <button
        className="poster-nav poster-nav--prev"
        type="button"
        aria-label="Previous poster"
        onClick={() =>
          setActive((current) => (current - 1 + posters.length) % posters.length)
        }
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            d="M15 5l-7 7 7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        className="poster-nav poster-nav--next"
        type="button"
        aria-label="Next poster"
        onClick={() => setActive((current) => (current + 1) % posters.length)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            d="M9 5l7 7-7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
