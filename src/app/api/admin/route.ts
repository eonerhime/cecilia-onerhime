import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/db";
import { requireSession } from "@/lib/admin-auth";

type SubmissionType = "tribute" | "media";
type SubmissionStatus = "approved" | "rejected";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { session, denied } = await requireSession(
      body.type === "settings" ? "admin" : "moderator",
    );
    if (denied) return denied;

    if (body.type === "settings") {
      const footerText =
        typeof body.footerText === "string" ? body.footerText.trim() : "";
      const displayName =
        typeof body.displayName === "string" ? body.displayName.trim() : "";
      const heroImageUrl =
        typeof body.heroImageUrl === "string" ? body.heroImageUrl.trim() : "";
      const musicUrl =
        typeof body.musicUrl === "string" ? body.musicUrl.trim() : "";
      const musicAutoplay =
        typeof body.musicAutoplay === "string" ? body.musicAutoplay : "off";
      const musicLoop = body.musicLoop !== false;
      const templateId =
        typeof body.templateId === "string"
          ? body.templateId
          : "editorial-memory";
      const allowedTemplates = [
        "editorial-memory",
        "quiet-gallery",
        "bright-celebration",
      ];
      const allowedAutoplay = ["off", "always", "once_per_session"];
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
        musicUrl.length > 1000 ||
        !allowedAutoplay.includes(musicAutoplay) ||
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
      await sql`update tenants set template_id = ${templateId} where id = ${session.tenantId}`;
      await sql`
          insert into memorial_settings (
            id, tenant_id, display_name, footer_text, hero_image_url, music_url, music_autoplay, music_loop,
            background_color, foreground_color, paper_color,
          sage_color, accent_color, line_color, rose_color, peach_color, updated_at
        ) values (
          'default', ${session.tenantId}, ${displayName}, ${footerText}, ${heroImageUrl}, ${musicUrl}, ${musicAutoplay}, ${musicLoop},
          ${colors.background}, ${colors.foreground},
          ${colors.paper}, ${colors.sage}, ${colors.accent}, ${colors.line},
          ${colors.rose}, ${colors.peach}, now()
        )
        on conflict (id) do update set
          display_name = ${displayName}, footer_text = ${footerText}, hero_image_url = ${heroImageUrl},
          music_url = ${musicUrl}, music_autoplay = ${musicAutoplay}, music_loop = ${musicLoop},
          background_color = ${colors.background},
          foreground_color = ${colors.foreground}, paper_color = ${colors.paper},
          sage_color = ${colors.sage}, accent_color = ${colors.accent},
          line_color = ${colors.line}, rose_color = ${colors.rose},
          peach_color = ${colors.peach}, updated_at = now()
      `;
      revalidatePath("/", "layout");
      return NextResponse.json({
        data: {
          displayName,
          templateId,
          footerText,
          heroImageUrl,
          musicUrl,
          musicAutoplay,
          musicLoop,
          colors,
        },
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
      await sql`update tributes set status = ${status} where id = ${id} and tenant_id = ${session.tenantId}`;
    else
      await sql`update media_submissions set status = ${status} where id = ${id} and tenant_id = ${session.tenantId}`;
    revalidatePath("/", "layout");
    return NextResponse.json({ data: { id, type, status } });
  } catch (error) {
    console.error("Admin submission update failed", error);
    return NextResponse.json(
      { error: "Unable to update submission right now." },
      { status: 500 },
    );
  }
}
