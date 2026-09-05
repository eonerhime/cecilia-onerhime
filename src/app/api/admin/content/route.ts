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

    if (!blockKey || blockKey.length > 200 || value.length > 5000) {
      return NextResponse.json({ error: "Invalid content." }, { status: 400 });
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
