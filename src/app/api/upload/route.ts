import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { id, media } from "@/lib/db/schema";
import { getCurrentTenant } from "@/lib/tenant";
import { saveUpload, UploadError } from "@/lib/uploads";

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { id: string; tenantId?: string | null; tenantSlug?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let tenantSlug = "main";
  let tenantId: string | null = null;
  try {
    const tenant = await getCurrentTenant();
    tenantId = tenant.id;
    tenantSlug = tenant.slug;
  } catch {
    tenantSlug = user.tenantSlug?.replace(/[^a-z0-9_-]/gi, "") || "main";
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  try {
    const saved = await saveUpload(file, tenantSlug);
    if (tenantId) {
      db.insert(media)
        .values({
          id: id("med"),
          tenantId,
          url: saved.url,
          name: saved.name,
          type: saved.type,
          size: saved.size,
          uploadedById: user.id,
          createdAt: Date.now(),
        })
        .run();
    }
    return NextResponse.json({ url: saved.url });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}