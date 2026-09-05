export type Role = "owner" | "admin" | "editor" | "moderator" | "viewer";

export const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  moderator: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

export function hasRole(role: Role | null | undefined, minRole: Role) {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}
