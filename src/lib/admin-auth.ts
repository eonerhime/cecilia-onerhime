import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

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

export async function requireAdmin(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sql = getDatabase();
  const clientKey = getClientKey(request);
  const [rateLimit] = await sql`
    select locked_until from admin_rate_limits where client_key = ${clientKey}
  `;
  const lockedUntil = rateLimit?.locked_until
    ? new Date(rateLimit.locked_until).getTime()
    : 0;
  if (lockedUntil > Date.now()) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((lockedUntil - Date.now()) / 1000)),
        },
      },
    );
  }

  if (request.headers.get("x-admin-password") === password) {
    await sql`delete from admin_rate_limits where client_key = ${clientKey}`;
    return null;
  }

  const [attempt] = await sql`
    insert into admin_rate_limits (client_key, failed_attempts)
    values (${clientKey}, 1)
    on conflict (client_key) do update set
      failed_attempts = case when admin_rate_limits.window_started < now() - interval '15 minutes' then 1 else admin_rate_limits.failed_attempts + 1 end,
      window_started = case when admin_rate_limits.window_started < now() - interval '15 minutes' then now() else admin_rate_limits.window_started end,
      locked_until = case when (case when admin_rate_limits.window_started < now() - interval '15 minutes' then 1 else admin_rate_limits.failed_attempts + 1 end) >= 5 then now() + interval '30 minutes' else null end
    returning failed_attempts
  `;
  const retryAfter =
    attempt?.failed_attempts >= MAX_ATTEMPTS ? LOCKOUT_SECONDS : 0;
  return NextResponse.json(
    {
      error: retryAfter
        ? "Too many attempts. Try again later."
        : "Unauthorized",
    },
    {
      status: retryAfter ? 429 : 401,
      ...(retryAfter ? { headers: { "Retry-After": String(retryAfter) } } : {}),
    },
  );
}
