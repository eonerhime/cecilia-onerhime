import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/db";
import { requireSession } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const { session, denied } = await requireSession("editor");
    if (denied) return denied;

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 100) {
      return NextResponse.json(
        { error: "Please provide an album name." },
        { status: 400 },
      );
    }
    const coverUrl =
      typeof body.coverUrl === "string" && body.coverUrl.trim()
        ? body.coverUrl.trim()
        : null;
    if (coverUrl && coverUrl.length > 1000) {
      return NextResponse.json({ error: "Invalid cover image." }, { status: 400 });
    }

    const sql = getDatabase();
    const [{ next_order }] = await sql`
      select coalesce(max(sort_order), -1) + 1 as next_order
      from albums where tenant_id = ${session.tenantId}
    `;
    const [created] = await sql`
      insert into albums (tenant_id, name, cover_url, sort_order)
      values (${session.tenantId}, ${name}, ${coverUrl}, ${next_order})
      returning id, name, cover_url
    `;
    revalidatePath("/", "layout");
    return NextResponse.json({
      data: { id: created.id, name: created.name, coverUrl: created.cover_url },
    });
  } catch (error) {
    console.error("Album creation failed", error);
    return NextResponse.json(
      { error: "Unable to create that album right now." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { session, denied } = await requireSession("editor");
    if (denied) return denied;

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "Invalid album." }, { status: 400 });
    }
    if (typeof body.hidden === "boolean") {
      const sql = getDatabase();
      await sql`
        update albums set hidden = ${body.hidden}
        where id = ${id} and tenant_id = ${session.tenantId}
      `;
      revalidatePath("/", "layout");
      return NextResponse.json({ data: { id, hidden: body.hidden } });
    }
    const coverUrl = typeof body.coverUrl === "string" ? body.coverUrl.trim() : null;
    if (!coverUrl || coverUrl.length > 1000) {
      return NextResponse.json({ error: "Invalid cover image." }, { status: 400 });
    }

    const sql = getDatabase();
    await sql`
      update albums set cover_url = ${coverUrl}
      where id = ${id} and tenant_id = ${session.tenantId}
    `;
    revalidatePath("/", "layout");
    return NextResponse.json({ data: { id, coverUrl } });
  } catch (error) {
    console.error("Album cover update failed", error);
    return NextResponse.json(
      { error: "Unable to update that album's cover right now." },
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
      return NextResponse.json({ error: "Invalid album." }, { status: 400 });
    }

    const sql = getDatabase();
    await sql`delete from albums where id = ${id} and tenant_id = ${session.tenantId}`;
    revalidatePath("/", "layout");
    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("Album removal failed", error);
    return NextResponse.json(
      { error: "Unable to remove that album right now." },
      { status: 500 },
    );
  }
}
