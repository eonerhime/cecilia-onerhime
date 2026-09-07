import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/db";
import { requireSession } from "@/lib/admin-auth";
import { detectVideoThumbnail } from "@/lib/media-embed";

export async function POST(request: Request) {
  try {
    const { session, denied } = await requireSession("editor");
    if (denied) return denied;

    const body = await request.json();
    const mediaUrl = typeof body.mediaUrl === "string" ? body.mediaUrl.trim() : "";
    const caption = typeof body.caption === "string" ? body.caption.trim() : "";
    const albumId = typeof body.albumId === "string" && body.albumId ? body.albumId : null;
    const thumbnailUrlInput =
      typeof body.thumbnailUrl === "string" ? body.thumbnailUrl.trim() : "";

    let parsed: URL | null = null;
    try {
      parsed = new URL(mediaUrl);
    } catch {
      parsed = null;
    }
    if (
      !parsed ||
      parsed.protocol !== "https:" ||
      mediaUrl.length > 1000 ||
      caption.length > 300 ||
      thumbnailUrlInput.length > 1000
    ) {
      return NextResponse.json(
        { error: "Please provide a valid https video URL." },
        { status: 400 },
      );
    }

    const thumbnailUrl = thumbnailUrlInput || (await detectVideoThumbnail(mediaUrl));

    const sql = getDatabase();
    await sql`
      insert into media_submissions (tenant_id, name, media_url, media_type, caption, album_id, thumbnail_url, status)
      values (${session.tenantId}, 'Family upload', ${mediaUrl}, 'video', ${caption || null}, ${albumId}, ${thumbnailUrl}, 'approved')
    `;
    revalidatePath("/admin");
    revalidatePath("/", "layout");
    return NextResponse.json({ data: { mediaUrl, caption, albumId, thumbnailUrl } });
  } catch (error) {
    console.error("Video link add failed", error);
    return NextResponse.json(
      { error: "Unable to add that video right now." },
      { status: 500 },
    );
  }
}
