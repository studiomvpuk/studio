import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { googleConfigured, googleAuthUrl, googleRedirectUri } from "@/lib/google";

// Kick off Google sign-in: set a CSRF state cookie, then redirect to Google.
export async function GET(req: Request) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  if (!googleConfigured) return NextResponse.redirect(`${base}/login?error=google_off`);

  const state = randomBytes(16).toString("hex");
  const next = new URL(req.url).searchParams.get("next") || "";

  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set("g_state", state, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 600 });
  if (next.startsWith("/")) jar.set("g_next", next, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 600 });

  return NextResponse.redirect(googleAuthUrl(googleRedirectUri(base), state));
}
