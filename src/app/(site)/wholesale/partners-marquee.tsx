import type { ReactNode } from "react";

export function PartnersMarquee({ children }: { children: ReactNode }) {
  return (
    <div
      className="wholesale-partners_marquee"
      role="region"
      aria-label="Ways to work with Nilgiribytes"
    >
      {children}
    </div>
  );
}
