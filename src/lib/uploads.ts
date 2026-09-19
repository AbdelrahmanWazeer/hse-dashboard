import "server-only";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { detectImageType, stripImageMetadata } from "@/lib/image-magic";

const UPLOADS_DIR = join(process.cwd(), "public", "uploads");

export const MAX_UPLOAD_SIZE = 8 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/bmp"];

const EXT_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/bmp": ".bmp",
};

export type SavedUpload = {
  url: string;
  name: string;
  type: string;
  size: number;
};

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function safeSegment(value: string) {
  const clean = value.replace(/[^a-z0-9_-]/gi, "");
  return clean.length > 0 ? clean.slice(0, 60) : "uploads";
}

/**
 * Stores an image file under `public/uploads/<subdir>/` and returns its
 * public URL. This is the local, zero-configuration storage backend.
 *
 * The declared MIME type is verified against the file's magic bytes, and
 * metadata (EXIF/GPS/XMP/text chunks) is stripped before persisting.
 */
export async function saveUpload(file: File, subdir: string): Promise<SavedUpload> {
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new UploadError("File is larger than 8 MB.", 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectImageType(new Uint8Array(buffer));
  if (!detected) {
    throw new UploadError("Uploaded file does not look like a supported image.", 415);
  }

  const declared = file.type ?? "";
  if (declared && EXT_MAP[declared] && EXT_MAP[declared] !== detected.ext) {
    throw new UploadError("File type does not match its contents.", 415);
  }

  const cleaned = stripImageMetadata(new Uint8Array(buffer), detected.mime);
  const stored = Buffer.from(cleaned.buffer, cleaned.byteOffset, cleaned.byteLength);

  const dir = safeSegment(subdir);
  const baseDir = join(UPLOADS_DIR, dir);
  mkdirSync(baseDir, { recursive: true });

  const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}${detected.ext}`;
  writeFileSync(join(baseDir, fileName), stored);

  return {
    url: `/uploads/${dir}/${fileName}`,
    name: file.name,
    type: detected.mime,
    size: stored.byteLength,
  };
}