"use client";

import { useState } from "react";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* Clipboard unavailable - still announce completion. */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="article_share">
      <button
        type="button"
        className="btn btn--outline btn--small"
        onClick={copyLink}
      >
        {copied ? "Link copied \u2713" : "Copy link"}
      </button>
      <a
        className="btn btn--ghost btn--small"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener"
      >
        Share on Facebook
      </a>
      <a
        className="btn btn--ghost btn--small"
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
        target="_blank"
        rel="noopener"
      >
        Share on WhatsApp
      </a>
    </div>
  );
}
