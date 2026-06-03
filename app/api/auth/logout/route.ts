import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST(req: Request) {
  await clearSession();
  const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  return NextResponse.redirect(`${base}/login`, { status: 303 });
}
