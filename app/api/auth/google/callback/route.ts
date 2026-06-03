import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConfigured } from "@/lib/db";
import { ensureSchema } from "@/lib/migrate";
import { createSession, upsertOAuthUser } from "@/lib/auth";
import { exchangeGoogleCode, googleConfigured, googleRedirectUri } from "@/lib/google";

export async function GET(req: Request) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  const fail = (reason: string) => NextResponse.redirect(`${base}/login?error=${reason}`);

  if (!googleConfigured) return fail("google_off");
  if (!dbConfigured) return fail("db");

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const jar = await cookies();
  const expected = jar.get("g_state")?.value;
  const next = jar.get("g_next")?.value || "";
  jar.delete("g_state");
  jar.delete("g_next");

  if (!code || !state || !expected || state !== expected) return fail("state");

  const profile = await exchangeGoogleCode(code, googleRedirectUri(base));
  if (!profile?.email) return fail("google");

  try {
    await ensureSchema();
  } catch {
    return fail("db");
  }

  const session = await upsertOAuthUser(profile.email, profile.name);
  await createSession(session);

  const dest = next.startsWith("/") ? next : session.role === "admin" ? "/admin" : "/dashboard";
  return NextResponse.redirect(`${base}${dest}`);
}
