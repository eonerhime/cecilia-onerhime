import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";
import { checkRateLimit, getClientKey, recordAttempt } from "@/lib/rate-limit";

// Same ceiling as the upload step (/api/tributes/upload) — low enough to
// bound spam, high enough that a family member submitting a few tributes,
// or fixing a typo and resending, doesn't get locked out. Every accepted
// tribute still sits as "pending" until a moderator approves it, so a
// burst of submissions can't reach the public site on its own.
const MAX_ATTEMPTS = 20;

function formatWait(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return minutes === 1 ? "a minute" : `${minutes} minutes`;
}

export async function POST(request: Request) {
  try {
    const clientKey = getClientKey(request, "tribute");
    if (await checkRateLimit(clientKey)) {
      return NextResponse.json(
        { error: "You've submitted a few tributes recently. Please try again in a little while." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const attachmentUrl = typeof body.attachmentUrl === "string" ? body.attachmentUrl.trim() : "";

    if (!name || name.length > 80 || message.length > 2000) {
      return NextResponse.json(
        { error: "Please provide a name and message." },
        { status: 400 },
      );
    }
    if (!message && !attachmentUrl) {
      return NextResponse.json(
        { error: "Please write a message or attach a letter." },
        { status: 400 },
      );
    }
    if (attachmentUrl.length > 1000) {
      return NextResponse.json(
        { error: "That attachment link is too long." },
        { status: 400 },
      );
    }

    const { limited, retryAfterSeconds } = await recordAttempt(clientKey, MAX_ATTEMPTS);
    if (limited) {
      return NextResponse.json(
        {
          error: `You've submitted a few tributes recently. Please wait ${formatWait(
            retryAfterSeconds,
          )} and try again.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSeconds) },
        },
      );
    }

    const sql = getDatabase();
    const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
    if (message) {
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
    }

    await sql`
      insert into tributes (tenant_id, name, message, attachment_url)
      values (${DEFAULT_TENANT_ID}, ${name}, ${message}, ${attachmentUrl || null})
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Tribute submission failed", error);
    return NextResponse.json(
      { error: "Unable to submit tribute right now." },
      { status: 500 },
    );
  }
}
