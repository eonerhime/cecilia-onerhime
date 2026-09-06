import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";

export async function POST(request: Request) {
  try {
    const sql = getDatabase();
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const caption = typeof body.caption === "string" ? body.caption.trim() : "";
    const albumIdCandidate =
      typeof body.albumId === "string" && body.albumId ? body.albumId : null;
    const mediaUrl = typeof body.mediaUrl === "string" ? body.mediaUrl.trim() : "";

    if (!name || name.length > 80) {
      return NextResponse.json(
        { error: "Please provide your name." },
        { status: 400 },
      );
    }
    if (!mediaUrl || mediaUrl.length > 1000) {
      return NextResponse.json(
        { error: "Please choose a photo." },
        { status: 400 },
      );
    }
    if (caption.length > 300) {
      return NextResponse.json(
        { error: "Caption is too long." },
        { status: 400 },
      );
    }

    let albumId: string | null = null;
    if (albumIdCandidate) {
      const [album] = await sql`
        select id from albums where id = ${albumIdCandidate} and tenant_id = ${DEFAULT_TENANT_ID}
      `;
      albumId = album ? album.id : null;
    }

    await sql`
      insert into media_submissions (tenant_id, name, media_url, media_type, caption, album_id)
      values (${DEFAULT_TENANT_ID}, ${name}, ${mediaUrl}, 'image', ${caption || null}, ${albumId})
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Media share submission failed", error);
    return NextResponse.json(
      { error: "Unable to share that photo right now." },
      { status: 500 },
    );
  }
}
