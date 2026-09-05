import { cache } from "react";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { getDatabase } from "@/lib/db";
import { hashToken } from "@/lib/tokens";
import type { Role } from "@/lib/roles";

export type { Role } from "@/lib/roles";

const COOKIE_NAME = "co_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type Session = {
  userId: string;
  tenantId: string;
  email: string;
  displayName: string | null;
  role: Role;
};

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const sql = getDatabase();
  await sql`
    insert into auth_sessions (user_id, token_hash, expires_at)
    values (${userId}, ${hashToken(token)}, ${expiresAt.toISOString()})
  `;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const sql = getDatabase();
    const [row] = await sql`
      select auth_sessions.expires_at,
        users.id as user_id, users.email, users.display_name,
        tenant_memberships.tenant_id, tenant_memberships.role
      from auth_sessions
      join users on users.id = auth_sessions.user_id
      join tenant_memberships on tenant_memberships.user_id = auth_sessions.user_id
      where auth_sessions.token_hash = ${hashToken(token)}
    `;
    if (!row || new Date(row.expires_at).getTime() < Date.now()) return null;
    return {
      userId: row.user_id,
      tenantId: row.tenant_id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
    };
  } catch (error) {
    console.error("Session lookup failed", error);
    return null;
  }
});

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    try {
      const sql = getDatabase();
      await sql`delete from auth_sessions where token_hash = ${hashToken(token)}`;
    } catch (error) {
      console.error("Session deletion failed", error);
    }
  }
  cookieStore.delete(COOKIE_NAME);
}
