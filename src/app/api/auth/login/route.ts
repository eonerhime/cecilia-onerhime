import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { resolveRoleForLogin } from "@/lib/membership";
import { checkRateLimit, clearAttempts, getClientKey, recordFailure } from "@/lib/rate-limit";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";

export async function POST(request: Request) {
  try {
    const clientKey = getClientKey(request, "login");
    if (await checkRateLimit(clientKey)) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 400 },
      );
    }

    const sql = getDatabase();
    const [user] = await sql`
      select id, password_hash, email_verified_at from users where email = ${email}
    `;
    const passwordOk = user?.password_hash
      ? await verifyPassword(password, user.password_hash)
      : false;

    if (!user || !passwordOk) {
      await recordFailure(clientKey);
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }
    if (!user.email_verified_at) {
      await recordFailure(clientKey);
      return NextResponse.json(
        { error: "Please verify your email before signing in." },
        { status: 403 },
      );
    }

    const role = await resolveRoleForLogin(DEFAULT_TENANT_ID, user.id, email);
    if (!role) {
      await recordFailure(clientKey);
      return NextResponse.json(
        { error: "This account no longer has access." },
        { status: 403 },
      );
    }

    await createSession(user.id);
    await clearAttempts(clientKey);
    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json(
      { error: "Unable to sign in right now." },
      { status: 500 },
    );
  }
}
