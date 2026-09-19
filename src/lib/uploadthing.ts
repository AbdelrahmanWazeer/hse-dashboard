import { generateUploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

/**
 * Typed UploadThing component helpers.
 *
 * The app currently stores uploads locally via `/api/upload` (see
 * `src/components/ui/image-uploader.tsx`). To switch to UploadThing for
 * production, set `UPLOADTHING_TOKEN` in your environment and replace the
 * local uploader with these components.
 */
export const UploadButton = generateUploadButton<OurFileRouter>();