import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";

const MAX_BYTES = 10 * 1024 * 1024;

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return `media-share:${clientIp}`;
}

export async function POST(request: Request) {
  try {
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
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((lockedUntil - Date.now()) / 1000)),
          },
        },
      );
    }

    const form = await request.formData();
    const name = typeof form.get("name") === "string" ? (form.get("name") as string).trim() : "";
    const caption =
      typeof form.get("caption") === "string" ? (form.get("caption") as string).trim() : "";
    const albumIdRaw = form.get("albumId");
    const albumIdCandidate = typeof albumIdRaw === "string" && albumIdRaw ? albumIdRaw : null;
    const file = form.get("file");

    if (!name || name.length > 80) {
      return NextResponse.json(
        { error: "Please provide your name." },
        { status: 400 },
      );
    }
    if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Please choose an image up to 10 MB." },
        { status: 400 },
      );
    }
    if (caption.length > 300) {
      return NextResponse.json(
        { error: "Caption is too long." },
        { status: 400 },
      );
    }

    const [attempt] = await sql`
      insert into admin_rate_limits (client_key, failed_attempts)
      values (${clientKey}, 1)
      on conflict (client_key) do update set
        failed_attempts = case
          when admin_rate_limits.window_started < now() - interval '60 minutes' then 1
          else admin_rate_limits.failed_attempts + 1
        end,
        window_started = case
          when admin_rate_limits.window_started < now() - interval '60 minutes' then now()
          else admin_rate_limits.window_started
        end,
        locked_until = case
          when (
            case
              when admin_rate_limits.window_started < now() - interval '60 minutes' then 1
              else admin_rate_limits.failed_attempts + 1
            end
          ) >= 5 then now() + interval '15 minutes'
          else null
        end
      returning failed_attempts, locked_until
    `;
    if (attempt?.failed_attempts >= 5) {
      const retryAfter = attempt.locked_until
        ? Math.ceil(
            (new Date(attempt.locked_until).getTime() - Date.now()) / 1000,
          )
        : 900;
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(retryAfter, 1)) },
        },
      );
    }

    let albumId: string | null = null;
    if (albumIdCandidate) {
      const [album] = await sql`
        select id from albums where id = ${albumIdCandidate} and tenant_id = ${DEFAULT_TENANT_ID}
      `;
      albumId = album ? album.id : null;
    }

    const blob = await put(`memorial/${crypto.randomUUID()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });

    await sql`
      insert into media_submissions (tenant_id, name, media_url, media_type, caption, album_id)
      values (${DEFAULT_TENANT_ID}, ${name}, ${blob.url}, 'image', ${caption || null}, ${albumId})
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Media share submission failed", error);
    return NextResponse.json(
      { error: "Unable to share that photo right now." },
      { status: 500 },
    );
  }
}
