import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { hashToken } from "@/lib/tokens";
import { createSession } from "@/lib/session";
import { commitRole } from "@/lib/membership";
import type { Role } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";
    const accepted = body.accepted === true;

    if (!token) {
      return NextResponse.json(
        { error: "Invalid or expired link. Please sign in again." },
        { status: 400 },
      );
    }
    if (!accepted) {
      return NextResponse.json(
        {
          error:
            "You must accept the Privacy Policy and Terms of Use to continue.",
        },
        { status: 400 },
      );
    }

    const sql = getDatabase();
    const tokenHash = hashToken(token);
    const [record] = await sql`
      select pending_consents.user_id, pending_consents.tenant_id, pending_consents.role,
        pending_consents.expires_at, users.email
      from pending_consents
      join users on users.id = pending_consents.user_id
      where pending_consents.id = ${tokenHash}
    `;
    if (!record || new Date(record.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Invalid or expired link. Please sign in again." },
        { status: 400 },
      );
    }

    await sql`update users set terms_accepted_at = now() where id = ${record.user_id}`;
    await commitRole(record.tenant_id, record.user_id, record.email, record.role as Role);
    await sql`delete from pending_consents where id = ${tokenHash}`;
    await createSession(record.user_id);

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error("Accept terms failed", error);
    return NextResponse.json(
      { error: "Unable to continue right now." },
      { status: 500 },
    );
  }
}
