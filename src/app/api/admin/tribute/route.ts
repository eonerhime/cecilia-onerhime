import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/db";
import { requireSession } from "@/lib/admin-auth";
import { isBlobUrl } from "@/lib/blob";

export async function PATCH(request: Request) {
  try {
    const { session, denied } = await requireSession("editor");
    if (denied) return denied;

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const attachmentUrl = typeof body.attachmentUrl === "string" ? body.attachmentUrl.trim() : "";

    if (!id || !name || name.length > 80 || message.length > 20000) {
      return NextResponse.json(
        { error: "Please provide a name and message." },
        { status: 400 },
      );
    }
    if (!message && !attachmentUrl) {
      return NextResponse.json(
        { error: "Please provide a message or an attachment." },
        { status: 400 },
      );
    }

    const sql = getDatabase();
    const [previous] = await sql`
      select attachment_url from tributes where id = ${id} and tenant_id = ${session.tenantId}
    `;
    await sql`
      update tributes set name = ${name}, message = ${message}, attachment_url = ${attachmentUrl || null}
      where id = ${id} and tenant_id = ${session.tenantId}
    `;

    const previousAttachmentUrl = previous?.attachment_url as string | null | undefined;
    if (
      previousAttachmentUrl &&
      previousAttachmentUrl !== attachmentUrl &&
      isBlobUrl(previousAttachmentUrl)
    ) {
      await del(previousAttachmentUrl).catch((error) => {
        console.error("Blob cleanup after tribute attachment replace failed", error);
      });
    }

    revalidatePath("/tributes");
    revalidatePath("/", "layout");
    return NextResponse.json({ data: { id, name, message, attachmentUrl: attachmentUrl || null } });
  } catch (error) {
    console.error("Tribute edit failed", error);
    return NextResponse.json(
      { error: "Unable to save that tribute right now." },
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
      return NextResponse.json({ error: "Invalid tribute." }, { status: 400 });
    }

    const sql = getDatabase();
    const [item] = await sql`
      delete from tributes where id = ${id} and tenant_id = ${session.tenantId}
      returning attachment_url
    `;
    if (!item) {
      return NextResponse.json({ error: "That tribute no longer exists." }, { status: 404 });
    }

    if (item.attachment_url && isBlobUrl(item.attachment_url)) {
      await del(item.attachment_url).catch((error) => {
        console.error("Blob cleanup after tribute delete failed", error);
      });
    }

    revalidatePath("/tributes");
    revalidatePath("/", "layout");
    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("Tribute delete failed", error);
    return NextResponse.json(
      { error: "Unable to delete that tribute right now." },
      { status: 500 },
    );
  }
}
