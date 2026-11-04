"use client";

import { useState } from "react";
import { absoluteUrl } from "@/lib/site";

type ProductShareButtonProps = {
  slug: string;
  title: string;
};

export function ProductShareButton({ slug, title }: ProductShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function shareProduct() {
    const url = absoluteUrl(`/shop/${slug}`);
    const shareData = {
      title,
      text: `Check out ${title} from Nilgiribytes`,
      url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* Clipboard unavailable - still announce completion. */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      className="product-share"
      aria-label={copied ? "Link copied" : "Share product"}
      title={copied ? "Link copied" : "Share product"}
      onClick={shareProduct}
    >
      {copied ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m5 12 5 5L20 7" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
          <path d="M12 3v12M8 7l4-4 4 4" />
        </svg>
      )}
    </button>
  );
}
