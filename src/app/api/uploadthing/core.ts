import { createUploadthing, type FileRouter } from "uploadthing/server";
import { requireUser } from "@/lib/guards";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 4 } })
    .middleware(async () => {
      const user = await requireUser();
      return { userId: user.id };
    })
    .onUploadComplete(({ metadata, file }) => {
      console.log("Upload complete:", file.key, "by", metadata.userId);
      return { uploadedByUserId: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;