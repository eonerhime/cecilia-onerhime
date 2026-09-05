import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { getGoogleClient } from "@/lib/google-auth";

export async function GET(request: Request) {
  try {
    const { client } = getGoogleClient();
    const state = randomBytes(16).toString("hex");
    const cookieStore = await cookies();
    cookieStore.set("co_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    const url = client.generateAuthUrl({
      access_type: "online",
      scope: ["openid", "email", "profile"],
      state,
      prompt: "select_account",
    });
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Google sign-in initiation failed", error);
    return NextResponse.redirect(
      new URL("/admin?error=oauth_not_configured", request.url),
    );
  }
}
