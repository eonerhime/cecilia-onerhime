import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/db";
import { requireSession } from "@/lib/admin-auth";

export async function PATCH(request: Request) {
  try {
    const { session, denied } = await requireSession("editor");
    if (denied) return denied;

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!id || !name || !message || name.length > 80 || message.length > 2000) {
      return NextResponse.json(
        { error: "Please provide a name and message." },
        { status: 400 },
      );
    }

    const sql = getDatabase();
    await sql`
      update tributes set name = ${name}, message = ${message}
      where id = ${id} and tenant_id = ${session.tenantId}
    `;
    revalidatePath("/tributes");
    revalidatePath("/", "layout");
    return NextResponse.json({ data: { id, name, message } });
  } catch (error) {
    console.error("Tribute edit failed", error);
    return NextResponse.json(
      { error: "Unable to save that tribute right now." },
      { status: 500 },
    );
  }
}
