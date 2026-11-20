"use client";

import { useEffect } from "react";
import type { StoreItem } from "@/lib/types";
import { ProductCard } from "./product-card";

export function ProductCollection({
  items,
  showDescription = false,
  revealType,
}: {
  items: StoreItem[];
  showDescription?: boolean;
  revealType?: "fade-up" | "fade-in" | "slide-left" | "slide-right" | "zoom-in";
}) {
  useEffect(() => {
    window.refreshReveals?.(document);
  }, [items]);

  if (!items.length) {
    return (
      <p className="empty-state">
        No products available right now. Please check back soon.
      </p>
    );
  }

  return (
    <>
      {items.map((item, index) => (
        <ProductCard
          key={item.id}
          item={item}
          showDescription={showDescription}
          revealType={revealType}
          staggerIndex={index}
        />
      ))}
    </>
  );
}
