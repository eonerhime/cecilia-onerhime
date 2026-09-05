import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/db";
import { requireSession } from "@/lib/admin-auth";

const MAX_ITEMS = 500;

export async function PATCH(request: Request) {
  try {
    const { session, denied } = await requireSession("editor");
    if (denied) return denied;

    const body = await request.json();
    const order = Array.isArray(body.order) ? body.order : null;
    if (
      !order ||
      !order.length ||
      order.length > MAX_ITEMS ||
      !order.every((id: unknown) => typeof id === "string")
    ) {
      return NextResponse.json({ error: "Invalid order." }, { status: 400 });
    }

    const sql = getDatabase();
    await Promise.all(
      order.map((id: string, index: number) =>
        sql`update media_submissions set display_order = ${index} where id = ${id} and tenant_id = ${session.tenantId}`,
      ),
    );
    revalidatePath("/gallery");
    revalidatePath("/", "layout");
    return NextResponse.json({ data: { order } });
  } catch (error) {
    console.error("Gallery reorder failed", error);
    return NextResponse.json(
      { error: "Unable to save that order right now." },
      { status: 500 },
    );
  }
}
