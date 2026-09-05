import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { hashToken } from "@/lib/tokens";
import { createSession } from "@/lib/session";
import { resolveRoleForLogin } from "@/lib/membership";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const token = url.searchParams.get("token");
    if (!token) {
      return NextResponse.redirect(new URL("/admin?error=invalid_request", url));
    }

    const sql = getDatabase();
    const tokenHash = hashToken(token);
    const [record] = await sql`
      select email_verifications.user_id, email_verifications.expires_at, users.email
      from email_verifications
      join users on users.id = email_verifications.user_id
      where email_verifications.id = ${tokenHash}
    `;
    if (!record || new Date(record.expires_at).getTime() < Date.now()) {
      return NextResponse.redirect(
        new URL("/admin?error=invalid_or_expired_token", url),
      );
    }

    await sql`update users set email_verified_at = now() where id = ${record.user_id}`;
    await sql`delete from email_verifications where id = ${tokenHash}`;

    const role = await resolveRoleForLogin(
      DEFAULT_TENANT_ID,
      record.user_id,
      record.email,
    );
    if (!role) {
      return NextResponse.redirect(new URL("/admin?error=not_invited", url));
    }

    await createSession(record.user_id);
    return NextResponse.redirect(new URL("/admin", url));
  } catch (error) {
    console.error("Email verification failed", error);
    return NextResponse.redirect(new URL("/admin?error=verification_failed", url));
  }
}
