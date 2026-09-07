import { NextResponse } from "next/server";
import { getClientKey, recordAttempt } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 20;

// Called by the client before handing a file to @vercel/blob's upload().
// That library swallows any non-2xx response from the handleUploadUrl
// endpoint into one generic "Failed to retrieve the client token" error,
// so a rate-limit message returned from /api/tributes/upload itself can
// never reach the visitor — this endpoint exists solely so we can show
// them something useful instead, ahead of that call.
export async function POST(request: Request) {
  try {
    const clientKey = getClientKey(request, "tribute-attachment");
    const { limited, retryAfterSeconds } = await recordAttempt(clientKey, MAX_ATTEMPTS);
    if (limited) {
      return NextResponse.json({ ok: false, retryAfterSeconds });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Tribute upload rate-limit check failed", error);
    return NextResponse.json({ ok: true });
  }
}
