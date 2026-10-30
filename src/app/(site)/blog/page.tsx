import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getPublishedPosts } from "@/lib/storefront";
import { BlogList } from "./blog-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Blog | Nilgiribytes - Stories from Our Oven",
  description:
    "Baking tips, bakery stories, ingredient notes and recipes from Nilgiribytes.",
  keywords: [
    "Nilgiribytes blog",
    "Ooty Varkey recipes",
    "baking tips",
    "Nilgiri bakery stories",
    "tea time recipes",
    "varkey ingredients",
  ],
  path: "/blog",
  image: "/assets/Craftsmanship.png",
});

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <main id="main-content">
      <section className="page-hero page-hero--blog" aria-labelledby="blog-title">
        <div className="page-hero_media" aria-hidden="true">
          <img
            src="/assets/Craftsmanship.png"
            alt=""
            width={2000}
            height={1500}
            fetchPriority="high"
          />
        </div>
        <div className="page-hero_overlay" aria-hidden="true" />
        <div className="container page-hero_content">
          <span className="section-kicker">The blog</span>
          <h1 className="page-hero_title" id="blog-title">
            Stories from Our Oven.
          </h1>
          <p className="page-hero_text">
            Tips, tales and recipes from the bakery floor.
          </p>
          <ul className="page-hero_pills">
            <li>Baking Tips</li>
            <li>Bakery Stories</li>
            <li>Recipes</li>
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="posts-heading">
        <div className="container">
          <h2 className="sr-only" id="posts-heading">
            Articles
          </h2>
          <BlogList posts={posts} />
        </div>
      </section>
    </main>
  );
}
