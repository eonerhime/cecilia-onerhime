import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return `tribute:${clientIp}`;
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

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name || !message || name.length > 80 || message.length > 2000) {
      return NextResponse.json(
        { error: "Please provide a name and message." },
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

    const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
    const [duplicate] = await sql`
      select id from tributes
      where tenant_id = ${DEFAULT_TENANT_ID}
        and lower(regexp_replace(trim(name), '\s+', ' ', 'g')) = ${normalize(name)}
        and lower(regexp_replace(trim(message), '\s+', ' ', 'g')) = ${normalize(message)}
      limit 1
    `;
    if (duplicate) {
      return NextResponse.json(
        { error: "You've already submitted this tribute. Thank you!" },
        { status: 409 },
      );
    }

    await sql`insert into tributes (tenant_id, name, message) values (${DEFAULT_TENANT_ID}, ${name}, ${message})`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Tribute submission failed", error);
    return NextResponse.json(
      { error: "Unable to submit tribute right now." },
      { status: 500 },
    );
  }
}
