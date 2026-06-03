import { NextResponse } from "next/server";
import { consumeMagicToken, createSession } from "@/lib/auth";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;

  if (!token) return NextResponse.redirect(`${base}/login?error=missing`);

  const session = await consumeMagicToken(token);
  if (!session) return NextResponse.redirect(`${base}/login?error=invalid`);

  await createSession(session);
  const dest = session.role === "admin" ? "/admin" : "/dashboard";
  return NextResponse.redirect(`${base}${dest}`);
}
