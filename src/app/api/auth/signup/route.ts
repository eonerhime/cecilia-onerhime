import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { generateToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, getClientKey, recordFailure } from "@/lib/rate-limit";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const GENERIC_MESSAGE =
  "If that email is on the family access list, check your inbox for a verification link.";

export async function POST(request: Request) {
  try {
    const clientKey = getClientKey(request, "signup");
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
    const acceptedTerms = body.acceptedTerms === true;

    if (!email || !email.includes("@") || email.length > 200) {
      return NextResponse.json(
        { error: "Please provide a valid email." },
        { status: 400 },
      );
    }
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }
    if (!acceptedTerms) {
      return NextResponse.json(
        {
          error:
            "You must accept the Privacy Policy and Terms of Use to create an account.",
        },
        { status: 400 },
      );
    }

    const sql = getDatabase();
    const [invite] = await sql`
      select 1 from admin_invites
      where tenant_id = ${DEFAULT_TENANT_ID} and email = ${email}
    `;
    const [existing] = await sql`
      select id, password_hash from users where email = ${email}
    `;
    const [membership] = existing
      ? await sql`
          select 1 from tenant_memberships
          where tenant_id = ${DEFAULT_TENANT_ID} and user_id = ${existing.id}
        `
      : [undefined];

    if (!invite && !membership) {
      await recordFailure(clientKey);
      return NextResponse.json({ data: { message: GENERIC_MESSAGE } });
    }

    if (existing?.password_hash) {
      return NextResponse.json(
        { error: "An account with that email already exists. Try signing in." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    let userId = existing?.id as string | undefined;
    if (userId) {
      await sql`
        update users
        set password_hash = ${passwordHash}, terms_accepted_at = coalesce(terms_accepted_at, now())
        where id = ${userId}
      `;
    } else {
      const [created] = await sql`
        insert into users (email, password_hash, terms_accepted_at)
        values (${email}, ${passwordHash}, now())
        returning id
      `;
      userId = created.id as string;
    }

    const { token, hash } = generateToken();
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
    await sql`
      insert into email_verifications (id, user_id, expires_at)
      values (${hash}, ${userId}, ${expiresAt.toISOString()})
    `;

    const verifyUrl = new URL(
      `/api/auth/verify-email?token=${token}`,
      request.url,
    ).toString();
    await sendEmail({
      to: email,
      subject: "Confirm your Cecilia Onerhime family access",
      html: `<p>Click the link below to confirm your email and finish setting up access:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`,
    });

    return NextResponse.json({ data: { message: GENERIC_MESSAGE } });
  } catch (error) {
    console.error("Signup failed", error);
    return NextResponse.json(
      { error: "Unable to create that account right now." },
      { status: 500 },
    );
  }
}
