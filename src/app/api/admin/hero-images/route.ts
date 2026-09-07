import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/db";
import { requireSession } from "@/lib/admin-auth";
import { isBlobUrl } from "@/lib/blob";

export async function POST(request: Request) {
  try {
    const { session, denied } = await requireSession("editor");
    if (denied) return denied;

    const body = await request.json();
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    if (!imageUrl || imageUrl.length > 1000) {
      return NextResponse.json({ error: "Please provide an image." }, { status: 400 });
    }

    const sql = getDatabase();
    const [{ next_order: nextOrder }] = await sql`
      select coalesce(max(sort_order), -1) + 1 as next_order
      from hero_images
      where tenant_id = ${session.tenantId}
    `;
    const [row] = await sql`
      insert into hero_images (tenant_id, image_url, sort_order)
      values (${session.tenantId}, ${imageUrl}, ${nextOrder})
      returning id
    `;

    revalidatePath("/", "layout");
    return NextResponse.json({ data: { id: row.id, imageUrl } });
  } catch (error) {
    console.error("Hero image add failed", error);
    return NextResponse.json(
      { error: "Unable to add that photo right now." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { session, denied } = await requireSession("editor");
    if (denied) return denied;

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "Invalid photo." }, { status: 400 });
    }

    const sql = getDatabase();
    const [item] = await sql`
      delete from hero_images where id = ${id} and tenant_id = ${session.tenantId}
      returning image_url
    `;
    if (!item) {
      return NextResponse.json({ error: "That photo no longer exists." }, { status: 404 });
    }

    if (item.image_url && isBlobUrl(item.image_url)) {
      await del(item.image_url).catch((error) => {
        console.error("Blob cleanup after hero image delete failed", error);
      });
    }

    revalidatePath("/", "layout");
    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("Hero image delete failed", error);
    return NextResponse.json(
      { error: "Unable to remove that photo right now." },
      { status: 500 },
    );
  }
}
