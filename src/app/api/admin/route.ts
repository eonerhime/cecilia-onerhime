import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

type SubmissionType = "tribute" | "media";
type SubmissionStatus = "approved" | "rejected";

const LOCKOUT_SECONDS = 30 * 60;
const MAX_ATTEMPTS = 5;

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return `admin:${clientIp}`;
}

async function authorize(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return { authorized: false, retryAfter: 0 };

  const sql = getDatabase();
  const clientKey = getClientKey(request);
  const [rateLimit] = await sql`
    select locked_until
    from admin_rate_limits
    where client_key = ${clientKey}
  `;
  const lockedUntil = rateLimit?.locked_until
    ? new Date(rateLimit.locked_until).getTime()
    : 0;
  if (lockedUntil > Date.now()) {
    return {
      authorized: false,
      retryAfter: Math.ceil((lockedUntil - Date.now()) / 1000),
    };
  }

  if (request.headers.get("x-admin-password") === password) {
    await sql`delete from admin_rate_limits where client_key = ${clientKey}`;
    return { authorized: true, retryAfter: 0 };
  }

  const [attempt] = await sql`
    insert into admin_rate_limits (client_key, failed_attempts)
    values (${clientKey}, 1)
    on conflict (client_key) do update set
      failed_attempts = case
        when admin_rate_limits.window_started < now() - interval '15 minutes' then 1
        else admin_rate_limits.failed_attempts + 1
      end,
      window_started = case
        when admin_rate_limits.window_started < now() - interval '15 minutes' then now()
        else admin_rate_limits.window_started
      end,
      locked_until = case
        when (
          case
            when admin_rate_limits.window_started < now() - interval '15 minutes' then 1
            else admin_rate_limits.failed_attempts + 1
          end
        ) >= 5 then now() + interval '30 minutes'
        else null
      end
    returning failed_attempts, locked_until
  `;
  const retryAfter =
    attempt?.failed_attempts >= MAX_ATTEMPTS ? LOCKOUT_SECONDS : 0;
  return { authorized: false, retryAfter };
}

async function requireAdmin(request: Request) {
  const result = await authorize(request);
  if (result.authorized) return null;
  return NextResponse.json(
    {
      error: result.retryAfter
        ? "Too many attempts. Try again later."
        : "Unauthorized",
    },
    {
      status: result.retryAfter ? 429 : 401,
      headers: result.retryAfter
        ? { "Retry-After": String(result.retryAfter) }
        : undefined,
    },
  );
}

export async function GET(request: Request) {
  try {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    const sql = getDatabase();
    const [tributes, media, settings] = await Promise.all([
      sql`select id, name, message, created_at from tributes where status = 'pending' order by created_at asc`,
      sql`select id, name, media_url, media_type, caption, created_at from media_submissions where status = 'pending' order by created_at asc`,
      sql`select display_name, footer_text, background_color, foreground_color, paper_color, sage_color, accent_color, line_color, rose_color, peach_color from memorial_settings where id = 'default'`,
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
        !footerText ||
        footerText.length > 200 ||
        !colors ||
        colorNames.some((name) => !isHexColor(colors[name]))
      ) {
        return NextResponse.json(
          { error: "Please provide valid footer text and six-digit colors." },
          { status: 400 },
        );
      }
      const sql = getDatabase();
      await sql`
        insert into memorial_settings (
          id, footer_text, background_color, foreground_color, paper_color,
          sage_color, accent_color, line_color, rose_color, peach_color, updated_at
        ) values (
          'default', ${footerText}, ${colors.background}, ${colors.foreground},
          ${colors.paper}, ${colors.sage}, ${colors.accent}, ${colors.line},
          ${colors.rose}, ${colors.peach}, now()
        )
        on conflict (id) do update set
          footer_text = ${footerText}, background_color = ${colors.background},
          foreground_color = ${colors.foreground}, paper_color = ${colors.paper},
          sage_color = ${colors.sage}, accent_color = ${colors.accent},
          line_color = ${colors.line}, rose_color = ${colors.rose},
          peach_color = ${colors.peach}, updated_at = now()
      `;
      return NextResponse.json({ data: { footerText, colors } });
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
      await sql`update tributes set status = ${status} where id = ${id}`;
    else
      await sql`update media_submissions set status = ${status} where id = ${id}`;
    return NextResponse.json({ data: { id, type, status } });
  } catch (error) {
    console.error("Admin submission update failed", error);
    return NextResponse.json(
      { error: "Unable to update submission right now." },
      { status: 500 },
    );
  }
}
