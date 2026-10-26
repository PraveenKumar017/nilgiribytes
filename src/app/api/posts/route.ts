import { NextResponse } from "next/server";
import { getPublishedPosts } from "@/lib/storefront";

export const revalidate = 300;

export async function GET() {
  const posts = await getPublishedPosts();
  return NextResponse.json(
    { posts },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
