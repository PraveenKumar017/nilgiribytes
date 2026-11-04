import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";

export const runtime = "nodejs";

const IMAGE_MAX_BYTES = 2 * 1024 * 1024;
const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const VIDEO_EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4",
};

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Choose an image or video to upload." },
      { status: 400 }
    );
  }

  const imageExtension = IMAGE_EXTENSIONS[file.type];
  const videoExtension = VIDEO_EXTENSIONS[file.type];
  const extension = imageExtension ?? videoExtension;

  if (!extension) {
    return NextResponse.json(
      { error: "Use a JPG, PNG, WebP, AVIF or MP4 file." },
      { status: 400 }
    );
  }

  const isVideo = Boolean(videoExtension);
  const maxBytes = isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;

  if (file.size > maxBytes) {
    return NextResponse.json(
      {
        error: isVideo
          ? "Each video must be 100 MB or smaller."
          : "Each image must be 2 MB or smaller.",
      },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = isVideo
    ? `${createHash("sha256").update(buffer).digest("hex").slice(0, 32)}.${extension}`
    : `${Date.now()}-${randomBytes(8).toString("hex")}.${extension}`;
  const folder = isVideo ? "videos" : "products";
  const directory = path.join(process.cwd(), "public", "uploads", folder);

  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), buffer);

  return NextResponse.json({ url: `/uploads/${folder}/${filename}` });
}
