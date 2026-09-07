import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/db";
import { requireSession } from "@/lib/admin-auth";
import { isBlobUrl } from "@/lib/blob";

export async function DELETE(request: Request) {
  try {
    const { session, denied } = await requireSession("editor");
    if (denied) return denied;

    const body = await request.json();
    const mediaId = typeof body.mediaId === "string" ? body.mediaId : "";
    if (!mediaId) {
      return NextResponse.json({ error: "Invalid media item." }, { status: 400 });
    }

    const sql = getDatabase();
    const [item] = await sql`
      delete from media_submissions
      where id = ${mediaId} and tenant_id = ${session.tenantId}
      returning media_url, thumbnail_url
    `;
    if (!item) {
      return NextResponse.json({ error: "That item no longer exists." }, { status: 404 });
    }

    const blobUrls = [item.media_url, item.thumbnail_url].filter(
      (url): url is string => typeof url === "string" && isBlobUrl(url),
    );
    if (blobUrls.length) {
      await del(blobUrls).catch((error) => {
        console.error("Blob cleanup after media delete failed", error);
      });
    }

    revalidatePath("/", "layout");
    revalidatePath("/admin");
    return NextResponse.json({ data: { mediaId } });
  } catch (error) {
    console.error("Media delete failed", error);
    return NextResponse.json(
      { error: "Unable to delete that item right now." },
      { status: 500 },
    );
  }
}
