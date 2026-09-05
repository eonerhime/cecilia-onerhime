import { getDatabase } from "@/lib/db";

const LOCKOUT_SECONDS = 30 * 60;
const MAX_ATTEMPTS = 5;

export async function checkRateLimit(clientKey: string) {
  const sql = getDatabase();
  const [rateLimit] = await sql`
    select locked_until from admin_rate_limits where client_key = ${clientKey}
  `;
  const lockedUntil = rateLimit?.locked_until
    ? new Date(rateLimit.locked_until).getTime()
    : 0;
  return lockedUntil > Date.now();
}

export async function recordFailure(clientKey: string) {
  const sql = getDatabase();
  const [attempt] = await sql`
    insert into admin_rate_limits (client_key, failed_attempts)
    values (${clientKey}, 1)
    on conflict (client_key) do update set
      failed_attempts = case when admin_rate_limits.window_started < now() - interval '15 minutes' then 1 else admin_rate_limits.failed_attempts + 1 end,
      window_started = case when admin_rate_limits.window_started < now() - interval '15 minutes' then now() else admin_rate_limits.window_started end,
      locked_until = case when (case when admin_rate_limits.window_started < now() - interval '15 minutes' then 1 else admin_rate_limits.failed_attempts + 1 end) >= 5 then now() + interval '30 minutes' else null end
    returning failed_attempts
  `;
  return attempt?.failed_attempts >= MAX_ATTEMPTS ? LOCKOUT_SECONDS : 0;
}

export async function clearAttempts(clientKey: string) {
  const sql = getDatabase();
  await sql`delete from admin_rate_limits where client_key = ${clientKey}`;
}

export function getClientKey(request: Request, prefix: string) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return `${prefix}:${clientIp}`;
}
