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
    const pdfUrl = typeof body.pdfUrl === "string" ? body.pdfUrl.trim() : "";

    if (!id || !name || name.length > 80 || message.length > 20000) {
      return NextResponse.json(
        { error: "Please provide a name and message." },
        { status: 400 },
      );
    }
    if (!message && !pdfUrl) {
      return NextResponse.json(
        { error: "Please provide a message or a letter PDF." },
        { status: 400 },
      );
    }

    const sql = getDatabase();
    const [previous] = await sql`
      select pdf_url from tributes where id = ${id} and tenant_id = ${session.tenantId}
    `;
    await sql`
      update tributes set name = ${name}, message = ${message}, pdf_url = ${pdfUrl || null}
      where id = ${id} and tenant_id = ${session.tenantId}
    `;

    const previousPdfUrl = previous?.pdf_url as string | null | undefined;
    if (previousPdfUrl && previousPdfUrl !== pdfUrl && isBlobUrl(previousPdfUrl)) {
      await del(previousPdfUrl).catch((error) => {
        console.error("Blob cleanup after tribute PDF replace failed", error);
      });
    }

    revalidatePath("/tributes");
    revalidatePath("/", "layout");
    return NextResponse.json({ data: { id, name, message, pdfUrl: pdfUrl || null } });
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
      returning pdf_url
    `;
    if (!item) {
      return NextResponse.json({ error: "That tribute no longer exists." }, { status: 404 });
    }

    if (item.pdf_url && isBlobUrl(item.pdf_url)) {
      await del(item.pdf_url).catch((error) => {
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
