"use client";

import { useState } from "react";

type SafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: string;
};

const FALLBACK = "/assets/placeholder.svg";

export function SafeImage({ src, fallback = FALLBACK, alt, ...rest }: SafeImageProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const source = typeof src === "string" ? src : "";
  const current = failed === source ? fallback : source || fallback;

  return (
    <img
      {...rest}
      src={current}
      alt={alt ?? ""}
      onError={() => setFailed(source || null)}
    />
  );
}
