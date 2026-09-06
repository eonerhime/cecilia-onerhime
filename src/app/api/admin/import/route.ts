import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { requireSession } from "@/lib/admin-auth";

const MAX_ROWS = 100;
const MAX_FILES = 30;

function parseCsv(value: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (const character of value.replace(/^\uFEFF/, "")) {
    if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\n" && (cell || row.length)) {
        row.push(cell.trim());
        rows.push(row);
        row = [];
        cell = "";
      }
    } else cell += character;
  }
  if (cell || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows;
}

export async function POST(request: Request) {
  const { session, denied } = await requireSession("editor");
  if (denied) return denied;

  try {
    const contentType = request.headers.get("content-type") || "";
    const sql = getDatabase();

    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (body.type !== "images") {
        return NextResponse.json({ error: "Unknown import type." }, { status: 400 });
      }
      const albumId = typeof body.albumId === "string" && body.albumId ? body.albumId : null;
      const mediaUrls = Array.isArray(body.mediaUrls)
        ? body.mediaUrls.filter((url: unknown): url is string => typeof url === "string")
        : [];
      if (!mediaUrls.length || mediaUrls.length > MAX_FILES) {
        return NextResponse.json(
          { error: `Choose 1-${MAX_FILES} image files.` },
          { status: 400 },
        );
      }
      for (const mediaUrl of mediaUrls)
        await sql`insert into media_submissions (tenant_id, name, media_url, media_type, album_id, status) values (${session.tenantId}, 'Family upload', ${mediaUrl}, 'image', ${albumId}, 'approved')`;
      return NextResponse.json({ data: { imported: mediaUrls.length } });
    }

    const form = await request.formData();
    const type = form.get("type");

    if (type === "tributes") {
      const file = form.get("file");
      if (!(file instanceof File))
        return NextResponse.json(
          { error: "Choose a CSV file." },
          { status: 400 },
        );
      const rows = parseCsv(await file.text());
      const headers = rows.shift()?.map((header) => header.toLowerCase());
      const nameIndex = headers?.indexOf("name") ?? -1;
      const tributeIndex =
        headers?.indexOf("tribute") ?? headers?.indexOf("message") ?? -1;
      const validRows = rows
        .map((row) => ({
          name: row[nameIndex]?.trim(),
          message: row[tributeIndex]?.trim(),
        }))
        .filter(
          (row) =>
            row.name &&
            row.message &&
            row.name.length <= 80 &&
            row.message.length <= 2000,
        );
      if (
        nameIndex < 0 ||
        tributeIndex < 0 ||
        validRows.length === 0 ||
        validRows.length > MAX_ROWS
      ) {
        return NextResponse.json(
          {
            error: `CSV must contain name and tribute columns, with 1-${MAX_ROWS} valid rows.`,
          },
          { status: 400 },
        );
      }
      for (const row of validRows)
        await sql`insert into tributes (tenant_id, name, message) values (${session.tenantId}, ${row.name}, ${row.message})`;
      return NextResponse.json({ data: { imported: validRows.length } });
    }

    return NextResponse.json(
      { error: "Unknown import type." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Bulk import failed", error);
    return NextResponse.json(
      {
        error: "Bulk import failed. Check your file and storage configuration.",
      },
      { status: 500 },
    );
  }
}
