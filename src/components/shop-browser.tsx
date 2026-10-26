"use client";

import { useEffect, useMemo, useState } from "react";
import { itemPrice } from "@/lib/cart";
import type { Catalog, StoreItem } from "@/lib/types";
import { ProductCard } from "./product-card";
import { ProductModal } from "./product-modal";

const CATEGORIES = [
  "All",
  "Varkey",
  "Salt Biscuit",
  "Sweet Biscuit",
  "Cakes",
  "Combos",
];

type Sort = "featured" | "price-asc" | "price-desc" | "name";

type ShopBrowserProps = {
  catalog: Catalog;
  initialCategory?: string;
};

export function ShopBrowser({ catalog, initialCategory }: ShopBrowserProps) {
  const allItems = useMemo<StoreItem[]>(
    () => [...catalog.combos, ...catalog.products],
    [catalog]
  );
  const [category, setCategory] = useState(
    initialCategory && CATEGORIES.includes(initialCategory)
      ? initialCategory
      : "All"
  );
  const [sort, setSort] = useState<Sort>("featured");
  const [selected, setSelected] = useState<StoreItem | null>(null);

  const items = useMemo(() => {
    let list = allItems.slice();
    if (category !== "All") {
      list = list.filter((item) => item.category === category);
    }
    if (sort === "price-asc") {
      list.sort((a, b) => itemPrice(a, 0) - itemPrice(b, 0));
    } else if (sort === "price-desc") {
      list.sort((a, b) => itemPrice(b, 0) - itemPrice(a, 0));
    } else if (sort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [allItems, category, sort]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => window.refreshReveals?.(document),
      30
    );
    return () => window.clearTimeout(timer);
  }, [category, sort]);

  return (
    <>
      <div className="shop-toolbar reveal" data-reveal="fade-up">
        <div className="filter-chips" role="group" aria-label="Filter by category">
          {CATEGORIES.map((value) => (
            <button
              key={value}
              className="chip"
              type="button"
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="shop-controls">
          <div className="field">
            <label htmlFor="shop-sort">Sort by</label>
            <select
              className="select"
              id="shop-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
            >
              <option value="featured">Default</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name: A-Z</option>
            </select>
          </div>
        </div>
      </div>

      <p className="form-hint" role="status" aria-live="polite">
        {items.length} {items.length === 1 ? "product" : "products"}
      </p>

      <div className="product-grid" id="shop-grid">
        {items.length ? (
          items.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              onOpen={setSelected}
              animate={false}
            />
          ))
        ) : (
          <p className="empty-state">
            No products match your search. Try a different keyword or category.
          </p>
        )}
      </div>

      {selected ? (
        <ProductModal item={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}
