import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { StorePost } from "@/lib/types";

export function PostCard({ post }: { post: StorePost }) {
  return (
    <article className="post-card reveal" data-reveal="fade-up">
      <Link
        className="post-card_media"
        href={`/blog/${post.slug}`}
        aria-label={`Read ${post.title}`}
      >
        <img
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
  );
}
