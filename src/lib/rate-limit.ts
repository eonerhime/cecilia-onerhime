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

/**
 * Records one attempt against a rolling 60-minute window, locking the key
 * out for 15 minutes once it hits `maxAttempts`. Used by the public
 * tribute-upload flow, which needs a much higher ceiling and a shorter
 * window than the auth lockout above (`recordFailure`) — that one guards
 * login/signup abuse specifically, this guards upload/spam volume.
 */
export async function recordAttempt(clientKey: string, maxAttempts: number) {
  const sql = getDatabase();
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
        ) >= ${maxAttempts} then now() + interval '15 minutes'
        else null
      end
    returning failed_attempts, locked_until
  `;
  const limited = attempt?.failed_attempts >= maxAttempts;
  const lockedUntil = attempt?.locked_until ? new Date(attempt.locked_until).getTime() : 0;
  return {
    limited,
    retryAfterSeconds: limited ? Math.max(Math.ceil((lockedUntil - Date.now()) / 1000), 1) : 0,
  };
}
