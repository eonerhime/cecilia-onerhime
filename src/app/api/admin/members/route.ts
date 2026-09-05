import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/db";
import { requireSession } from "@/lib/admin-auth";
import type { Role } from "@/lib/session";

const ALLOWED_ROLES: Role[] = ["owner", "admin", "editor", "moderator", "viewer"];

export async function POST(request: Request) {
  try {
    const { session, denied } = await requireSession("owner");
    if (denied) return denied;

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = typeof body.role === "string" ? body.role : "";

    if (!email || !email.includes("@") || email.length > 200 || !ALLOWED_ROLES.includes(role as Role)) {
      return NextResponse.json({ error: "Please provide a valid email and role." }, { status: 400 });
    }

    const sql = getDatabase();
    await sql`
      insert into admin_invites (tenant_id, email, role)
      values (${session.tenantId}, ${email}, ${role})
      on conflict (tenant_id, email) do update set role = excluded.role
    `;
    revalidatePath("/admin");
    return NextResponse.json({ data: { email, role } });
  } catch (error) {
    console.error("Invite creation failed", error);
    return NextResponse.json(
      { error: "Unable to send that invite right now." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { session, denied } = await requireSession("owner");
    if (denied) return denied;

    const body = await request.json();
    const sql = getDatabase();

    if (typeof body.userId === "string" && body.userId) {
      if (body.userId === session.userId) {
        return NextResponse.json(
          { error: "You can't revoke your own access." },
          { status: 400 },
        );
      }
      await sql`
        delete from tenant_memberships
        where tenant_id = ${session.tenantId} and user_id = ${body.userId}
      `;
      await sql`delete from auth_sessions where user_id = ${body.userId}`;
      revalidatePath("/admin");
      return NextResponse.json({ data: { userId: body.userId } });
    }

    if (typeof body.email === "string" && body.email) {
      const email = body.email.trim().toLowerCase();
      await sql`delete from admin_invites where tenant_id = ${session.tenantId} and email = ${email}`;
      revalidatePath("/admin");
      return NextResponse.json({ data: { email } });
    }

    return NextResponse.json({ error: "Nothing to revoke." }, { status: 400 });
  } catch (error) {
    console.error("Revoke access failed", error);
    return NextResponse.json(
      { error: "Unable to revoke that access right now." },
      { status: 500 },
    );
  }
}
