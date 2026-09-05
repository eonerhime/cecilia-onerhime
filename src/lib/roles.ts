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

// Each role includes everything the roles below it can do.
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  viewer: "Can sign in and view the family dashboard. No editing, moderation, or settings access.",
  moderator: "Can approve or reject tribute and photo submissions.",
  editor:
    "Can edit site text and photos via the pencil icon, upload images, and reorder the gallery, plus everything moderator can do.",
  admin:
    "Can change site settings (colors, template, footer text) and upload music, plus everything editor can do.",
  owner:
    "Full access, including inviting or removing other family members, plus everything admin can do.",
};
