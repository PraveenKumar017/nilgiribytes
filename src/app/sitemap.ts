import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { getPublishedPosts } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      images: [absoluteUrl("/assets/hero_image_bg.png")],
    },
    {
      url: absoluteUrl("/shop"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      images: [absoluteUrl("/assets/Fresh_Pastries.png")],
    },
    {
      url: absoluteUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
      images: [absoluteUrl("/assets/our_story.png")],
    },
    {
      url: absoluteUrl("/wholesale"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
      images: [absoluteUrl("/assets/Fresh_Pastries.png")],
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      images: [absoluteUrl("/assets/Craftsmanship.png")],
    },
    {
      url: absoluteUrl("/policies/privacy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/policies/store"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(`${post.date}T00:00:00`),
    changeFrequency: "monthly",
    priority: 0.6,
    images: [
      post.image.startsWith("http") ? post.image : absoluteUrl(post.image),
    ],
  }));

  return [...staticPages, ...postPages];
}
