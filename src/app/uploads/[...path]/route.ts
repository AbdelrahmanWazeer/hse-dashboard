import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { extname, join, sep } from "path";

const ROOT = join(process.cwd(), "public", "uploads");

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = (await params).path ?? [];
  if (segments.length === 0 || segments.some((s) => s === "" || s === ".." || s.includes("\\") || s.includes("/"))) {
    return new NextResponse("Bad request", { status: 400 });
  }
  const target = join(ROOT, ...segments);
  if (!target.startsWith(ROOT + sep)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const data = await readFile(target).catch(() => null);
  if (!data) return new NextResponse("Not found", { status: 404 });

  const ext = extname(target).toLowerCase();
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "content-type": MIME[ext] ?? "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}