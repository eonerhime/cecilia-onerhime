import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/admin-auth";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const { denied } = await requireSession("editor");
  if (denied) return denied;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
    }
    if (!file.type.startsWith("image/") || file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Only images up to 10 MB are accepted." },
        { status: 400 },
      );
    }

    const blob = await put(`memorial/${crypto.randomUUID()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({ data: { url: blob.url } });
  } catch (error) {
    console.error("Image upload failed", error);
    return NextResponse.json(
      { error: "Upload failed. Check storage configuration." },
      { status: 500 },
    );
  }
}
