import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/db";
import { requireSession } from "@/lib/admin-auth";

export async function PATCH(request: Request) {
  try {
    const { session, denied } = await requireSession("editor");
    if (denied) return denied;

    const body = await request.json();
    const blockKey =
      typeof body.blockKey === "string" ? body.blockKey.trim() : "";
    const value = typeof body.value === "string" ? body.value : "";

    if (!blockKey || blockKey.length > 200) {
      return NextResponse.json({ error: "Invalid content." }, { status: 400 });
    }
    // Generous enough for a full life-story bio (the longest content block
    // on the site) — the old 5000-character cap was silently rejecting
    // saves partway through writing one, with no error shown to the editor.
    if (value.length > 20000) {
      return NextResponse.json(
        { error: `That's too long (${value.length}/20000 characters). Please shorten it and try again.` },
        { status: 400 },
      );
    }

    const sql = getDatabase();
    await sql`
      insert into content_blocks (tenant_id, block_key, value, updated_at)
      values (${session.tenantId}, ${blockKey}, ${value}, now())
      on conflict (tenant_id, block_key) do update set value = excluded.value, updated_at = now()
    `;
    revalidatePath("/", "layout");
    return NextResponse.json({ data: { blockKey, value } });
  } catch (error) {
    console.error("Content block update failed", error);
    return NextResponse.json(
      { error: "Unable to save that change right now." },
      { status: 500 },
    );
  }
}
