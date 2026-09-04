import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

const projectTypes = ["memorial", "birthday", "celebration", "other"] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const projectType =
      typeof body.projectType === "string" ? body.projectType : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (
      !name ||
      name.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !projectTypes.includes(projectType as (typeof projectTypes)[number]) ||
      !message ||
      message.length > 3000
    ) {
      return NextResponse.json(
        { error: "Please check your details and message." },
        { status: 400 },
      );
    }

    const sql = getDatabase();
    const [recent] = await sql`
      select count(*)::int as count
      from contact_inquiries
      where email = ${email} and created_at > now() - interval '1 hour'
    `;
    if (recent?.count >= 3) {
      return NextResponse.json(
        { error: "Please wait before sending another enquiry." },
        { status: 429 },
      );
    }

    await sql`
      insert into contact_inquiries (name, email, project_type, message)
      values (${name}, ${email}, ${projectType}, ${message})
    `;
    return NextResponse.json({ data: { received: true } });
  } catch (error) {
    console.error("Contact enquiry failed", error);
    return NextResponse.json(
      { error: "Unable to send your enquiry right now." },
      { status: 500 },
    );
  }
}
