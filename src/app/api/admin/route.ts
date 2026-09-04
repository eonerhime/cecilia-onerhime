import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";

type SubmissionType = "tribute" | "media";
type SubmissionStatus = "approved" | "rejected";

export async function GET(request: Request) {
  try {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    const sql = getDatabase();
    const [tributes, media, settings] = await Promise.all([
      sql`select id, name, message, created_at from tributes where tenant_id = ${DEFAULT_TENANT_ID} and status = 'pending' order by created_at asc`,
      sql`select id, name, media_url, media_type, caption, created_at from media_submissions where tenant_id = ${DEFAULT_TENANT_ID} and status = 'pending' order by created_at asc`,
      sql`select memorial_settings.display_name, memorial_settings.footer_text, memorial_settings.hero_image_url, tenants.template_id, memorial_settings.background_color, memorial_settings.foreground_color, memorial_settings.paper_color, memorial_settings.sage_color, memorial_settings.accent_color, memorial_settings.line_color, memorial_settings.rose_color, memorial_settings.peach_color from memorial_settings join tenants on tenants.id = memorial_settings.tenant_id where memorial_settings.tenant_id = ${DEFAULT_TENANT_ID}`,
    ]);
    const currentSettings = settings[0];
    return NextResponse.json(
      {
        data: {
          tributes: tributes.map(({ created_at, ...tribute }) => ({
            ...tribute,
            createdAt: created_at,
          })),
          media: media.map(
            ({ media_url, media_type, created_at, ...item }) => ({
              ...item,
              mediaUrl: media_url,
              mediaType: media_type,
              createdAt: created_at,
            }),
          ),
          settings: {
            displayName: currentSettings?.display_name || "Cecilia Onerhime",
            templateId: currentSettings?.template_id || "editorial-memory",
            heroImageUrl: currentSettings?.hero_image_url || "",
            footerText:
              currentSettings?.footer_text ||
              "Copyright © is the Moses Onerhime Family 2026 All rights reserved",
            colors: {
              background: currentSettings?.background_color || "#f5f0e8",
              foreground: currentSettings?.foreground_color || "#1f2d2b",
              paper: currentSettings?.paper_color || "#fbf8f2",
              sage: currentSettings?.sage_color || "#536b60",
              accent: currentSettings?.accent_color || "#c48a3a",
              line: currentSettings?.line_color || "#d8cec0",
              rose: currentSettings?.rose_color || "#b8786f",
              peach: currentSettings?.peach_color || "#d9b5a8",
            },
          },
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Admin submissions lookup failed", error);
    return NextResponse.json(
      { error: "Unable to load submissions right now." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    const body = await request.json();
    if (body.type === "settings") {
      const footerText =
        typeof body.footerText === "string" ? body.footerText.trim() : "";
      const displayName =
        typeof body.displayName === "string" ? body.displayName.trim() : "";
      const heroImageUrl =
        typeof body.heroImageUrl === "string" ? body.heroImageUrl.trim() : "";
      const templateId =
        typeof body.templateId === "string"
          ? body.templateId
          : "editorial-memory";
      const allowedTemplates = [
        "editorial-memory",
        "quiet-gallery",
        "bright-celebration",
      ];
      const colors = body.colors as Record<string, unknown>;
      const colorNames = [
        "background",
        "foreground",
        "paper",
        "sage",
        "accent",
        "line",
        "rose",
        "peach",
      ] as const;
      const isHexColor = (value: unknown): value is string =>
        typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
      if (
        !displayName ||
        displayName.length > 100 ||
        !footerText ||
        footerText.length > 200 ||
        heroImageUrl.length > 1000 ||
        !allowedTemplates.includes(templateId) ||
        !colors ||
        colorNames.some((name) => !isHexColor(colors[name]))
      ) {
        return NextResponse.json(
          { error: "Please provide valid footer text and six-digit colors." },
          { status: 400 },
        );
      }
      const sql = getDatabase();
      await sql`update tenants set template_id = ${templateId} where id = ${DEFAULT_TENANT_ID}`;
      await sql`
          insert into memorial_settings (
            id, tenant_id, display_name, footer_text, hero_image_url, background_color, foreground_color, paper_color,
          sage_color, accent_color, line_color, rose_color, peach_color, updated_at
        ) values (
          'default', ${DEFAULT_TENANT_ID}, ${displayName}, ${footerText}, ${heroImageUrl}, ${colors.background}, ${colors.foreground},
          ${colors.paper}, ${colors.sage}, ${colors.accent}, ${colors.line},
          ${colors.rose}, ${colors.peach}, now()
        )
        on conflict (id) do update set
          display_name = ${displayName}, footer_text = ${footerText}, hero_image_url = ${heroImageUrl}, background_color = ${colors.background},
          foreground_color = ${colors.foreground}, paper_color = ${colors.paper},
          sage_color = ${colors.sage}, accent_color = ${colors.accent},
          line_color = ${colors.line}, rose_color = ${colors.rose},
          peach_color = ${colors.peach}, updated_at = now()
      `;
      return NextResponse.json({
        data: { displayName, templateId, footerText, heroImageUrl, colors },
      });
    }
    const type = body.type as SubmissionType;
    const status = body.status as SubmissionStatus;
    const id = typeof body.id === "string" ? body.id : "";
    if (
      !id ||
      !["tribute", "media"].includes(type) ||
      !["approved", "rejected"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Invalid moderation request." },
        { status: 400 },
      );
    }
    const sql = getDatabase();
    if (type === "tribute")
      await sql`update tributes set status = ${status} where id = ${id} and tenant_id = ${DEFAULT_TENANT_ID}`;
    else
      await sql`update media_submissions set status = ${status} where id = ${id} and tenant_id = ${DEFAULT_TENANT_ID}`;
    return NextResponse.json({ data: { id, type, status } });
  } catch (error) {
    console.error("Admin submission update failed", error);
    return NextResponse.json(
      { error: "Unable to update submission right now." },
      { status: 500 },
    );
  }
}
