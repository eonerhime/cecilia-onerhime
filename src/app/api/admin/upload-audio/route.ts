import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/admin-auth";

const MAX_BYTES = 50 * 1024 * 1024;

export async function POST(request: Request) {
  const { denied } = await requireSession("editor");
  if (denied) return denied;

  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["audio/*"],
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Audio upload failed", error);
    return NextResponse.json(
      { error: "Upload failed. Check storage configuration." },
      { status: 400 },
    );
  }
}
