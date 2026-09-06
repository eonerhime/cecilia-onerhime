import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/db";
import { requireSession } from "@/lib/admin-auth";

export async function PATCH(request: Request) {
  try {
    const { session, denied } = await requireSession("editor");
    if (denied) return denied;

    const body = await request.json();
    const mediaId = typeof body.mediaId === "string" ? body.mediaId : "";
    const albumId = typeof body.albumId === "string" ? body.albumId : null;
    if (!mediaId) {
      return NextResponse.json({ error: "Invalid media item." }, { status: 400 });
    }

    const sql = getDatabase();
    await sql`
      update media_submissions set album_id = ${albumId}
      where id = ${mediaId} and tenant_id = ${session.tenantId}
    `;
    revalidatePath("/", "layout");
    revalidatePath("/admin");
    return NextResponse.json({ data: { mediaId, albumId } });
  } catch (error) {
    console.error("Media album assignment failed", error);
    return NextResponse.json(
      { error: "Unable to update that item's album right now." },
      { status: 500 },
    );
  }
}
