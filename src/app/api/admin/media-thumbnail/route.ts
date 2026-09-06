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
    const thumbnailUrl =
      typeof body.thumbnailUrl === "string" ? body.thumbnailUrl.trim() : "";
    if (!mediaId || thumbnailUrl.length > 1000) {
      return NextResponse.json({ error: "Invalid thumbnail update." }, { status: 400 });
    }

    const sql = getDatabase();
    await sql`
      update media_submissions set thumbnail_url = ${thumbnailUrl || null}
      where id = ${mediaId} and tenant_id = ${session.tenantId}
    `;
    revalidatePath("/", "layout");
    revalidatePath("/admin");
    return NextResponse.json({ data: { mediaId, thumbnailUrl } });
  } catch (error) {
    console.error("Media thumbnail update failed", error);
    return NextResponse.json(
      { error: "Unable to update that thumbnail right now." },
      { status: 500 },
    );
  }
}
