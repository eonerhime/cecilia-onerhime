import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";
import { detectVideoThumbnail } from "@/lib/media-embed";
import { checkRateLimit, getClientKey, recordAttempt } from "@/lib/rate-limit";

// Guests can only share a video by link (YouTube/Vimeo/etc.), never a raw
// file upload — see MRU ADR-015. Lands as "pending", same as photo shares
// and text tributes, so nothing reaches the public gallery without a
// moderator approving it first.
const MAX_ATTEMPTS = 20;

function formatWait(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return minutes === 1 ? "a minute" : `${minutes} minutes`;
}

export async function POST(request: Request) {
  try {
    const clientKey = getClientKey(request, "media-share-video");
    if (await checkRateLimit(clientKey)) {
      return NextResponse.json(
        { error: "You've shared a few videos recently. Please try again in a little while." },
        { status: 429 },
      );
    }

    const sql = getDatabase();
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const videoUrl = typeof body.videoUrl === "string" ? body.videoUrl.trim() : "";
    const caption = typeof body.caption === "string" ? body.caption.trim() : "";
    const albumIdCandidate =
      typeof body.albumId === "string" && body.albumId ? body.albumId : null;

    if (!name || name.length > 80) {
      return NextResponse.json(
        { error: "Please provide your name." },
        { status: 400 },
      );
    }

    let parsed: URL | null = null;
    try {
      parsed = new URL(videoUrl);
    } catch {
      parsed = null;
    }
    if (!parsed || parsed.protocol !== "https:" || videoUrl.length > 1000) {
      return NextResponse.json(
        { error: "Please paste a valid video link (e.g. a YouTube or Vimeo URL)." },
        { status: 400 },
      );
    }
    if (caption.length > 300) {
      return NextResponse.json({ error: "Caption is too long." }, { status: 400 });
    }

    const { limited, retryAfterSeconds } = await recordAttempt(clientKey, MAX_ATTEMPTS);
    if (limited) {
      return NextResponse.json(
        {
          error: `You've shared a few videos recently. Please wait ${formatWait(
            retryAfterSeconds,
          )} and try again.`,
        },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
      );
    }

    let albumId: string | null = null;
    if (albumIdCandidate) {
      const [album] = await sql`
        select id from albums where id = ${albumIdCandidate} and tenant_id = ${DEFAULT_TENANT_ID}
      `;
      albumId = album ? album.id : null;
    }

    const thumbnailUrl = await detectVideoThumbnail(videoUrl);

    await sql`
      insert into media_submissions (tenant_id, name, media_url, media_type, caption, album_id, thumbnail_url)
      values (${DEFAULT_TENANT_ID}, ${name}, ${videoUrl}, 'video', ${caption || null}, ${albumId}, ${thumbnailUrl})
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Video share submission failed", error);
    return NextResponse.json(
      { error: "Unable to share that video right now." },
      { status: 500 },
    );
  }
}
