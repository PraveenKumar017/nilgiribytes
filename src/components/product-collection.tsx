"use client";

import { useEffect, useState } from "react";
import type { StoreItem } from "@/lib/types";
import { ProductCard } from "./product-card";
import { ProductModal } from "./product-modal";

export function ProductCollection({ items }: { items: StoreItem[] }) {
  const [selected, setSelected] = useState<StoreItem | null>(null);

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
        <ProductCard key={item.id} item={item} onOpen={setSelected} />
      ))}
      {selected ? (
        <ProductModal item={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}
