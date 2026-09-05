import { getDatabase } from "@/lib/db";

export const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  templateId: string;
};

export async function getTenantBySlug(slug = "cecilia-onerhime") {
  try {
    const sql = getDatabase();
    const [tenant] = await sql`
      select id, slug, name, template_id
      from tenants
      where slug = ${slug} and status = 'active'
    `;
    if (!tenant) return null;
    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      templateId: tenant.template_id,
    } satisfies Tenant;
  } catch (error) {
    console.error("Tenant lookup failed", error);
    return null;
  }
}

export async function getDefaultTenant() {
  return getTenantBySlug(process.env.DEFAULT_TENANT_SLUG || "cecilia-onerhime");
}

export async function getTemplateCatalog() {
  try {
    const sql = getDatabase();
    const templates = await sql`
      select id, name, slug, component_key, description, config
      from templates
      where is_active = true
      order by created_at asc
    `;
    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      slug: template.slug,
      componentKey: template.component_key,
      description: template.description,
      config: template.config,
    }));
  } catch (error) {
    console.error("Template catalog lookup failed", error);
    return [];
  }
}
