import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  return NextResponse.json(
    { data: session ? { role: session.role } : { role: null } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
