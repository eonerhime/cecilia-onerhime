import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { TRIBUTE_ATTACHMENT_CONTENT_TYPES } from "@/lib/attachment";

const MAX_BYTES = 20 * 1024 * 1024;
// Higher than the 5/hour cap on the actual tribute submission below it —
// this only gates the upload step, and every attempt counts toward it
// (not just failures), so a family member picking the wrong file or
// attaching a couple of letters shouldn't get locked out.
const MAX_ATTEMPTS = 20;

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return `tribute-attachment:${clientIp}`;
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
          ) >= ${MAX_ATTEMPTS} then now() + interval '15 minutes'
          else null
        end
      returning failed_attempts, locked_until
    `;
    if (attempt?.failed_attempts >= MAX_ATTEMPTS) {
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

    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: TRIBUTE_ATTACHMENT_CONTENT_TYPES,
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Tribute attachment upload failed", error);
    return NextResponse.json(
      { error: "Unable to upload that file right now." },
      { status: 400 },
    );
  }
}
