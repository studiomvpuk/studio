import { NextResponse } from "next/server";
import { dbConfigured, query } from "@/lib/db";
import { dispatch } from "@/lib/automations";

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
  await dispatch("lead.created", { email, name: name || "there" });

  return NextResponse.json({ ok: true });
}
