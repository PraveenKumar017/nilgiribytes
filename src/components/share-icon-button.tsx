"use client";

import { useState } from "react";

type ShareIconButtonProps = {
  url: string;
  title: string;
  text?: string;
  label?: string;
};

export function ShareIconButton({
  url,
  title,
  text,
  label = "Share",
}: ShareIconButtonProps) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const shareData = {
      title,
      text: text ?? title,
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
      className="share-icon-btn"
      aria-label={copied ? "Link copied" : label}
      title={copied ? "Link copied" : label}
      onClick={share}
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

type CopyIconButtonProps = {
  value: string;
  label?: string;
};

export function CopyIconButton({ value, label = "Copy" }: CopyIconButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* Clipboard unavailable - still announce completion. */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      className="copy-icon-btn"
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
      onClick={copy}
    >
      {copied ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m5 12 5 5L20 7" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>
      )}
    </button>
  );
}
