"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SafeImage } from "@/components/safe-image";
import { formatDate } from "@/lib/format";
import type { StorePost } from "@/lib/types";

const CATEGORIES = [
  "All",
  "Baking Tips",
  "Bakery Stories",
  "Ingredients",
  "Recipes",
  "News",
];

export function BlogList({ posts }: { posts: StorePost[] }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (category !== "All" && post.category !== category) return false;
      if (!needle) return true;
      return `${post.title} ${post.excerpt} ${post.category}`
        .toLowerCase()
        .includes(needle);
    });
  }, [posts, category, query]);

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
          <div className="field blog-search-field">
            <label htmlFor="blog-search">Search</label>
            <input
              className="input"
              id="blog-search"
              type="search"
              placeholder="Search articles..."
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="blog-grid mt-4" id="blog-grid">
        {visible.length ? (
          visible.map((post) => (
            <article
              className="post-card reveal"
              data-reveal="fade-up"
              key={post.slug}
            >
              <Link
                className="post-card_media"
                href={`/blog/${post.slug}`}
                aria-label={`Read ${post.title}`}
              >
                <SafeImage
                  src={post.image}
                  alt={post.imageAlt || post.title}
                  width={800}
                  height={450}
                  loading="lazy"
                />
                <span className="post-card_read">{post.readingTime}</span>
              </Link>
              <div className="post-card_body">
                <p className="post-card_meta">
                  <span className="post-card_category">{post.category}</span>
                  <span>{formatDate(post.date)}</span>
                </p>
                <h3 className="post-card_title">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                <p className="post-card_excerpt">{post.excerpt}</p>
                <Link className="post-card_link" href={`/blog/${post.slug}`}>
                  Read article &rarr;
                </Link>
              </div>
            </article>
          ))
        ) : (
          <p className="empty-state">
            No articles match your search. Try another keyword or category.
          </p>
        )}
      </div>
    </>
  );
}
