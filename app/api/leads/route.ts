import { NextResponse } from "next/server";
import { dbConfigured, query } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const brief = String(body.brief || "").trim();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (!brief) {
    return NextResponse.json({ error: "Tell us a little about your idea." }, { status: 400 });
  }

  if (!dbConfigured) {
    // Demo mode — accept but don't persist.
    return NextResponse.json({ ok: true, demo: true });
  }

  await query(
    `insert into leads (name, email, brief, source, status) values ($1, $2, $3, 'website', 'new')`,
    [name || null, email, brief]
  );
  await query(`insert into events (type, payload) values ('lead.created', $1)`, [
    JSON.stringify({ email, name }),
  ]);

  // Auto: acknowledgement email (Resend if configured)
  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "StudioMVP <onboarding@resend.dev>",
        to: email,
        subject: "Thanks — we've got your project brief",
        html: `<p>Hi ${name || "there"},</p><p>Thanks for telling us about your idea. We'll review it and come back within a day with next steps.</p><p>— StudioMVP</p>`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
