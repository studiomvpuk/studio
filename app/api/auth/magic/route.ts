import { NextResponse } from "next/server";
import { dbConfigured } from "@/lib/db";
import { createMagicToken, sendMagicLink } from "@/lib/auth";

export async function POST(req: Request) {
  if (!dbConfigured) {
    return NextResponse.json(
      { error: "Database not configured. Set DATABASE_URL and run `npm run db:setup`." },
      { status: 503 }
    );
  }
  const { email } = await req.json().catch(() => ({ email: "" }));
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const token = await createMagicToken(email);
  const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  const link = `${base}/api/auth/callback?token=${token}`;
  const { devLink } = await sendMagicLink(email, link);

  return NextResponse.json({ ok: true, devLink });
}
