import { NextResponse } from "next/server";
import { dbConfigured, query } from "@/lib/db";
import { getSession } from "@/lib/auth";

const ALLOWED = new Set(["new", "call_booked", "proposal", "lost"]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (dbConfigured && session?.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json().catch(() => ({}));
  if (!ALLOWED.has(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  if (!dbConfigured) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const rows = await query(`update leads set status = $1 where id = $2 returning id`, [status, id]);
  if (!rows.length) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
