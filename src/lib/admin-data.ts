import { getDatabase } from "@/lib/db";

export type PendingTribute = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

export type PendingMedia = {
  id: string;
  name: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption: string | null;
  albumId: string | null;
  createdAt: string;
};

export type ContactInquiry = {
  id: string;
  name: string;
  email: string;
  projectType: string;
  message: string;
  createdAt: string;
};

export type TenantMember = {
  userId: string;
  email: string;
  displayName: string | null;
  role: string;
};

export type PendingInvite = {
  email: string;
  role: string;
  invitedAt: string;
};

export async function getPendingTributes(tenantId: string): Promise<PendingTribute[]> {
  const sql = getDatabase();
  const rows = await sql`
    select id, name, message, created_at from tributes
    where tenant_id = ${tenantId} and status = 'pending'
    order by created_at asc
  `;
  return rows.map(
    ({ created_at, ...row }) => ({ ...row, createdAt: created_at }),
  ) as PendingTribute[];
}

export async function getPendingMedia(tenantId: string): Promise<PendingMedia[]> {
  const sql = getDatabase();
  const rows = await sql`
    select id, name, media_url, media_type, caption, album_id, created_at from media_submissions
    where tenant_id = ${tenantId} and status = 'pending'
    order by created_at asc
  `;
  return rows.map(({ media_url, media_type, album_id, created_at, ...row }) => ({
    ...row,
    mediaUrl: media_url,
    mediaType: media_type,
    albumId: album_id,
    createdAt: created_at,
  })) as PendingMedia[];
}

export async function getContactInquiries(tenantId: string): Promise<ContactInquiry[]> {
  const sql = getDatabase();
  const rows = await sql`
    select id, name, email, project_type, message, created_at from contact_inquiries
    where tenant_id = ${tenantId}
    order by created_at desc
    limit 100
  `;
  return rows.map(({ project_type, created_at, ...row }) => ({
    ...row,
    projectType: project_type,
    createdAt: created_at,
  })) as ContactInquiry[];
}

export async function getTenantMembers(tenantId: string): Promise<TenantMember[]> {
  const sql = getDatabase();
  const rows = await sql`
    select users.id as user_id, users.email, users.display_name, tenant_memberships.role
    from tenant_memberships
    join users on users.id = tenant_memberships.user_id
    where tenant_memberships.tenant_id = ${tenantId}
    order by tenant_memberships.created_at asc
  `;
  return rows.map((row) => ({
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
  }));
}

export async function getPendingInvites(tenantId: string): Promise<PendingInvite[]> {
  const sql = getDatabase();
  const rows = await sql`
    select email, role, invited_at from admin_invites
    where tenant_id = ${tenantId}
    order by invited_at asc
  `;
  return rows.map(
    ({ invited_at, ...row }) => ({ ...row, invitedAt: invited_at }),
  ) as PendingInvite[];
}
