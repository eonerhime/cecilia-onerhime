import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { generateToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, getClientKey, recordFailure } from "@/lib/rate-limit";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const GENERIC_MESSAGE = "If that email needs verifying, a new link is on its way.";

export async function POST(request: Request) {
  try {
    const clientKey = getClientKey(request, "resend-verification");
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
    const [user] = await sql`
      select id from users
      where email = ${email} and password_hash is not null and email_verified_at is null
    `;
    if (user) {
      await sql`delete from email_verifications where user_id = ${user.id}`;
      const { token, hash } = generateToken();
      const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
      await sql`
        insert into email_verifications (id, user_id, expires_at)
        values (${hash}, ${user.id}, ${expiresAt.toISOString()})
      `;
      const verifyUrl = new URL(
        `/api/auth/verify-email?token=${token}`,
        request.url,
      ).toString();
      await sendEmail({
        to: email,
        subject: "Confirm your Cecilia Onerhime family access",
        html: `<p>Click the link below to confirm your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      });
    } else {
      await recordFailure(clientKey);
    }

    return NextResponse.json({ data: { message: GENERIC_MESSAGE } });
  } catch (error) {
    console.error("Resend verification failed", error);
    return NextResponse.json({ data: { message: GENERIC_MESSAGE } });
  }
}
