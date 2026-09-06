import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/db";
import { getGoogleClient } from "@/lib/google-auth";
import { createSession } from "@/lib/session";
import { commitRole, peekRoleForLogin } from "@/lib/membership";
import { generateToken } from "@/lib/tokens";
import { checkRateLimit, clearAttempts, getClientKey, recordFailure } from "@/lib/rate-limit";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";

const CONSENT_TTL_MS = 10 * 60 * 1000;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientKey = getClientKey(request, "oauth");

  if (await checkRateLimit(clientKey)) {
    return NextResponse.redirect(new URL("/admin?error=too_many_attempts", url));
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("co_oauth_state")?.value;
  cookieStore.delete("co_oauth_state");

  if (!code || !state || !expectedState || state !== expectedState) {
    await recordFailure(clientKey);
    return NextResponse.redirect(new URL("/admin?error=invalid_request", url));
  }

  try {
    const { client, clientId } = getGoogleClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) throw new Error("Google did not return an ID token");

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) {
      await recordFailure(clientKey);
      return NextResponse.redirect(new URL("/admin?error=unverified_email", url));
    }
    const email = payload.email.toLowerCase();

    const sql = getDatabase();
    const [existingUser] = await sql`
      select id, terms_accepted_at from users where email = ${email}
    `;

    // Check invite/membership status before ever creating a `users` row —
    // an account with no relationship to any tenant shouldn't be stored
    // just because someone tried (and failed) to sign in.
    const role = await peekRoleForLogin(
      DEFAULT_TENANT_ID,
      existingUser?.id ?? null,
      email,
    );
    if (!role) {
      await recordFailure(clientKey);
      return NextResponse.redirect(new URL("/admin?error=not_invited", url));
    }

    let userId = existingUser?.id as string | undefined;
    let termsAcceptedAt = existingUser?.terms_accepted_at ?? null;
    if (!userId) {
      const [created] = await sql`
        insert into users (email, display_name)
        values (${email}, ${payload.name ?? null})
        on conflict (email) do update set display_name = coalesce(users.display_name, excluded.display_name)
        returning id, terms_accepted_at
      `;
      userId = created.id as string;
      termsAcceptedAt = created.terms_accepted_at ?? null;
    }

    if (!termsAcceptedAt) {
      const { token, hash } = generateToken();
      const expiresAt = new Date(Date.now() + CONSENT_TTL_MS);
      await sql`
        insert into pending_consents (id, user_id, tenant_id, role, expires_at)
        values (${hash}, ${userId}, ${DEFAULT_TENANT_ID}, ${role}, ${expiresAt.toISOString()})
      `;
      await clearAttempts(clientKey);
      return NextResponse.redirect(
        new URL(`/admin/accept-terms?token=${token}`, url),
      );
    }

    await commitRole(DEFAULT_TENANT_ID, userId, email, role);
    await createSession(userId);
    await clearAttempts(clientKey);
    return NextResponse.redirect(new URL("/admin", url));
  } catch (error) {
    console.error("Google OAuth callback failed", error);
    await recordFailure(clientKey);
    return NextResponse.redirect(new URL("/admin?error=oauth_failed", url));
  }
}
