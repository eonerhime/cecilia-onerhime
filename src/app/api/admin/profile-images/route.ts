import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/db";
import { requireSession } from "@/lib/admin-auth";
import { isBlobUrl } from "@/lib/blob";
import { MAX_SUPPORTING_IMAGES } from "@/lib/memorial";

export async function POST(request: Request) {
  try {
    const { session, denied } = await requireSession("editor");
    if (denied) return denied;

    const body = await request.json();
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    const role = body.role === "banner" ? "banner" : body.role === "supporting" ? "supporting" : null;
    if (!imageUrl || imageUrl.length > 1000 || !role) {
      return NextResponse.json({ error: "Please provide an image." }, { status: 400 });
    }

    const sql = getDatabase();

    if (role === "banner") {
      // Only one banner ever exists (enforced by a partial unique index
      // too) — "replace" and "add" are the same operation: drop whatever
      // banner is there, if any, and insert the new one.
      const [existing] = await sql`
        delete from profile_images
        where tenant_id = ${session.tenantId} and role = 'banner'
        returning image_url
      `;
      if (existing?.image_url && isBlobUrl(existing.image_url)) {
        await del(existing.image_url).catch((error) => {
          console.error("Blob cleanup after banner replace failed", error);
        });
      }
      const [row] = await sql`
        insert into profile_images (tenant_id, image_url, role, sort_order)
        values (${session.tenantId}, ${imageUrl}, 'banner', 0)
        returning id
      `;
      revalidatePath("/profile");
      return NextResponse.json({ data: { id: row.id, imageUrl } });
    }

    const [{ count, next_order: nextOrder }] = await sql`
      select count(*) as count, coalesce(max(sort_order), -1) + 1 as next_order
      from profile_images
      where tenant_id = ${session.tenantId} and role = 'supporting'
    `;
    if (Number(count) >= MAX_SUPPORTING_IMAGES) {
      return NextResponse.json(
        { error: `You can have at most ${MAX_SUPPORTING_IMAGES} supporting photos. Remove one first.` },
        { status: 400 },
      );
    }
    const [row] = await sql`
      insert into profile_images (tenant_id, image_url, role, sort_order)
      values (${session.tenantId}, ${imageUrl}, 'supporting', ${nextOrder})
      returning id
    `;

    revalidatePath("/profile");
    return NextResponse.json({ data: { id: row.id, imageUrl } });
  } catch (error) {
    console.error("Profile image add failed", error);
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
      delete from profile_images where id = ${id} and tenant_id = ${session.tenantId}
      returning image_url
    `;
    if (!item) {
      return NextResponse.json({ error: "That photo no longer exists." }, { status: 404 });
    }

    if (item.image_url && isBlobUrl(item.image_url)) {
      await del(item.image_url).catch((error) => {
        console.error("Blob cleanup after profile image delete failed", error);
      });
    }

    revalidatePath("/profile");
    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("Profile image delete failed", error);
    return NextResponse.json(
      { error: "Unable to remove that photo right now." },
      { status: 500 },
    );
  }
}
