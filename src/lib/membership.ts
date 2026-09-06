import { getDatabase } from "@/lib/db";
import type { Role } from "@/lib/session";

/**
 * Read-only: what role would this login resolve to, without granting it.
 * `userId` is null when no `users` row exists yet for this email — in that
 * case there can be no membership, so only the invite is checked.
 */
export async function peekRoleForLogin(
  tenantId: string,
  userId: string | null,
  email: string,
): Promise<Role | null> {
  const sql = getDatabase();
  if (userId) {
    const [membership] = await sql`
      select role from tenant_memberships
      where tenant_id = ${tenantId} and user_id = ${userId}
    `;
    if (membership) return membership.role as Role;
  }

  const [invite] = await sql`
    select role from admin_invites
    where tenant_id = ${tenantId} and email = ${email}
  `;
  return invite ? (invite.role as Role) : null;
}

/** Grants the given role: creates the membership and consumes the invite. */
export async function commitRole(
  tenantId: string,
  userId: string,
  email: string,
  role: Role,
) {
  const sql = getDatabase();
  await sql`
    insert into tenant_memberships (tenant_id, user_id, role)
    values (${tenantId}, ${userId}, ${role})
    on conflict (tenant_id, user_id) do nothing
  `;
  await sql`delete from admin_invites where tenant_id = ${tenantId} and email = ${email}`;
}

/**
 * Returns the caller's role for the tenant, provisioning membership from a
 * pending invite on first successful login. Returns null if the account has
 * neither an existing membership nor a matching invite (access denied or
 * previously revoked).
 */
export async function resolveRoleForLogin(
  tenantId: string,
  userId: string,
  email: string,
): Promise<Role | null> {
  const role = await peekRoleForLogin(tenantId, userId, email);
  if (!role) return null;
  await commitRole(tenantId, userId, email, role);
  return role;
}
