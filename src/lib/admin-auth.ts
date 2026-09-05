import { NextResponse } from "next/server";
import { getSession, type Session } from "@/lib/session";
import { ROLE_RANK, type Role } from "@/lib/roles";

export async function requireSession(
  minRole: Role = "moderator",
): Promise<{ session: Session; denied: null } | { session: null; denied: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      denied: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (ROLE_RANK[session.role] < ROLE_RANK[minRole]) {
    return {
      session: null,
      denied: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session, denied: null };
}
