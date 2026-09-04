import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name || !message || name.length > 80 || message.length > 2000) {
      return NextResponse.json(
        { error: "Please provide a name and message." },
        { status: 400 },
      );
    }

    const sql = getDatabase();
    await sql`insert into tributes (name, message) values (${name}, ${message})`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Tribute submission failed", error);
    return NextResponse.json(
      { error: "Unable to submit tribute right now." },
      { status: 500 },
    );
  }
}
