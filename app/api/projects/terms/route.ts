import { NextResponse } from "next/server";
import { dbConfigured, query } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Admin: persist a project's payment terms (plan / deposit% / launch gate).
export async function POST(req: Request) {
  const session = await getSession();
  if (dbConfigured && session?.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const b = await req.json().catch(() => ({}));
  const projectId = b.projectId ? String(b.projectId) : null;
  const depositPct = Math.min(90, Math.max(10, Number(b.depositPct) || 50));
  const gate = Boolean(b.gate);

  if (!dbConfigured || !projectId) {
    return NextResponse.json({ ok: true, demo: true });
  }

  await query(`update projects set deposit_pct = $1, gate_launch = $2 where id = $3`, [depositPct, gate, projectId]);
  return NextResponse.json({ ok: true });
}
