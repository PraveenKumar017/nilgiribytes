"use client";

import { useEffect, useState } from "react";

type SafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: string;
};

const FALLBACK = "/assets/placeholder.svg";

export function SafeImage({ src, fallback = FALLBACK, alt, ...rest }: SafeImageProps) {
  const [current, setCurrent] = useState(src || fallback);

  useEffect(() => {
    setCurrent(src || fallback);
  }, [src, fallback]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={current}
      alt={alt ?? ""}
      onError={() => {
        if (current !== fallback) setCurrent(fallback);
      }}
    />
  );
}
