"use client";

import { useEffect } from "react";
import type { StoreItem } from "@/lib/types";
import { ProductCard } from "./product-card";

export function ProductCollection({ items }: { items: StoreItem[] }) {
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
      {items.map((item) => (
        <ProductCard key={item.id} item={item} />
      ))}
    </>
  );
}
