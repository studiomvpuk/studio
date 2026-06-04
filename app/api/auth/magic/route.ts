import { NextResponse } from "next/server";
import { dbConfigured } from "@/lib/db";
import { ensureSchema } from "@/lib/migrate";
import { createMagicToken, sendMagicLink } from "@/lib/auth";

export async function POST(req: Request) {
  if (!dbConfigured) {
    return NextResponse.json(
      { error: "Database isn't connected. Set the DATABASE_URL environment variable, then redeploy." },
      { status: 503 }
    );
  }

  // Make sure tables + admin exist (auto-migrate; no-op after the first run).
  try {
    await ensureSchema();
  } catch {
    return NextResponse.json({ error: "Couldn't reach the database. Check DATABASE_URL." }, { status: 503 });
  }

  const { email } = await req.json().catch(() => ({ email: "" }));
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  // In production we can't deliver the link without email configured — don't
  // pretend to send. Point people to Google sign-in instead.
  if (process.env.NODE_ENV === "production" && !process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email sign-in isn't available right now — please continue with Google." }, { status: 503 });
  }

  const token = await createMagicToken(email);
  const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  const link = `${base}/api/auth/callback?token=${token}`;
  const { devLink } = await sendMagicLink(email, link);

  return NextResponse.json({ ok: true, devLink });
}
