import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { TRIBUTE_ATTACHMENT_CONTENT_TYPES } from "@/lib/attachment";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    // The real rate-limit gate (with a user-facing message) is the
    // client's preflight call to /api/tributes/upload-check — @vercel/blob
    // swallows any error we'd return from here into one generic message,
    // so this is only a read-only backstop against that step being
    // bypassed entirely, not the primary UX.
    const clientKey = getClientKey(request, "tribute-attachment");
    if (await checkRateLimit(clientKey)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }

    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: TRIBUTE_ATTACHMENT_CONTENT_TYPES,
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Tribute attachment upload failed", error);
    return NextResponse.json(
      { error: "Unable to upload that file right now." },
      { status: 400 },
    );
  }
}
