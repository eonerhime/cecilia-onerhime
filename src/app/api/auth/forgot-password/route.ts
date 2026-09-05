import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { generateToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, getClientKey, recordFailure } from "@/lib/rate-limit";

const RESET_TTL_MS = 60 * 60 * 1000;
const GENERIC_MESSAGE = "If that email has an account, a reset link is on its way.";

export async function POST(request: Request) {
  try {
    const clientKey = getClientKey(request, "forgot-password");
    if (await checkRateLimit(clientKey)) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ data: { message: GENERIC_MESSAGE } });
    }

    const sql = getDatabase();
    const [user] = await sql`select id, password_hash from users where email = ${email}`;
    if (user?.password_hash) {
      const { token, hash } = generateToken();
      const expiresAt = new Date(Date.now() + RESET_TTL_MS);
      await sql`
        insert into password_reset_tokens (id, user_id, expires_at)
        values (${hash}, ${user.id}, ${expiresAt.toISOString()})
      `;
      const resetUrl = new URL(
        `/admin/reset-password?token=${token}`,
        request.url,
      ).toString();
      await sendEmail({
        to: email,
        subject: "Reset your Cecilia Onerhime password",
        html: `<p>Click the link below to choose a new password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      });
    } else {
      await recordFailure(clientKey);
    }

    return NextResponse.json({ data: { message: GENERIC_MESSAGE } });
  } catch (error) {
    console.error("Forgot-password request failed", error);
    return NextResponse.json({ data: { message: GENERIC_MESSAGE } });
  }
}
