import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { hashToken } from "@/lib/tokens";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!token) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 },
      );
    }
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const sql = getDatabase();
    const tokenHash = hashToken(token);
    const [record] = await sql`
      select user_id, expires_at, used_at from password_reset_tokens where id = ${tokenHash}
    `;
    if (!record || record.used_at || new Date(record.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);
    await sql`update users set password_hash = ${passwordHash} where id = ${record.user_id}`;
    await sql`update password_reset_tokens set used_at = now() where id = ${tokenHash}`;
    await sql`delete from auth_sessions where user_id = ${record.user_id}`;

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error("Reset password failed", error);
    return NextResponse.json(
      { error: "Unable to reset your password right now." },
      { status: 500 },
    );
  }
}
