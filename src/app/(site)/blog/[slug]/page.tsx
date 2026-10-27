import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { PostCard } from "@/components/post-card";
import { ShareButtons } from "@/components/share-buttons";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { absoluteUrl, SITE_KEYWORDS, SITE_NAME } from "@/lib/site";
import { getPostBySlug, getPublishedPosts } from "@/lib/storefront";
import type { BlogBlock } from "@/lib/types";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return {
      title: "Article not found | Nilgiribytes",
      robots: { index: false, follow: false },
    };
  }
  return pageMetadata({
    title: `${post.title} | Nilgiribytes`,
    description: post.excerpt,
    keywords: [
      post.title,
      post.category,
      ...SITE_KEYWORDS.slice(0, 10),
    ],
    path: `/blog/${post.slug}`,
    image: post.image,
    type: "article",
    publishedTime: new Date(`${post.date}T00:00:00`).toISOString(),
    authors: [post.author],
  });
}

function ArticleBlocks({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "p") return <p key={index}>{block.text}</p>;
        if (block.type === "h2") return <h2 key={index}>{block.text}</h2>;
        if (block.type === "h3") return <h3 key={index}>{block.text}</h3>;
        if (block.type === "ol") {
          return (
            <ol key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ol>
          );
        }
        if ("items" in block) {
          return (
            <ul key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          );
        }
        return null;
      })}
    </>
  );
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const [post, allPosts] = await Promise.all([
    getPostBySlug(slug),
    getPublishedPosts(),
  ]);

  if (!post) notFound();

  const related = allPosts
    .filter((entry) => entry.slug !== post.slug)
    .sort((a, b) => {
      const aMatch = a.category === post.category ? 0 : 1;
      const bMatch = b.category === post.category ? 0 : 1;
      return aMatch - bMatch;
    })
    .slice(0, 3);

  const url = absoluteUrl(`/blog/${post.slug}`);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.image.startsWith("http") ? post.image : absoluteUrl(post.image),
    datePublished: new Date(`${post.date}T00:00:00`).toISOString(),
    dateModified: new Date(`${post.date}T00:00:00`).toISOString(),
    author: { "@type": "Organization", name: post.author || SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/assets/nilgiribytes_header.png"),
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: post.category,
  };

  return (
    <main id="main-content">
      <section className="section">
        <div className="container">
          <article className="article">
            <p>
              <Link className="link-arrow" href="/blog">
                &larr; Back to all articles
              </Link>
            </p>
            <h1 className="page-hero_title">{post.title}</h1>
            <p className="article_meta">
              <span>By {post.author || "Nilgiribytes"}</span>
              <span>{formatDate(post.date)}</span>
              <span>{post.readingTime}</span>
              <span>{post.category}</span>
            </p>
            <div className="article_cover">
              <img
                src={post.image}
                alt={post.imageAlt || post.title}
                width={1200}
                height={675}
              />
            </div>
            <div className="article_content">
              <ArticleBlocks blocks={post.content} />
            </div>
            <ShareButtons url={url} title={post.title} />

            {related.length ? (
              <section className="related">
                <h2 className="section-heading text-left">Related posts</h2>
                <div className="blog-grid mt-2">
                  {related.map((entry) => (
                    <PostCard key={entry.slug} post={entry} />
                  ))}
                </div>
              </section>
            ) : null}
          </article>
        </div>
      </section>

      <JsonLd data={articleJsonLd} />
    </main>
  );
}
