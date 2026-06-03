import { NextResponse } from "next/server";
import { dbConfigured, query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { dispatch } from "@/lib/automations";

// Create an approval request (admin) or decide one (client/admin).
export async function POST(req: Request) {
  const session = await getSession();
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");

  if (!dbConfigured) return NextResponse.json({ ok: true, demo: true });

  if (action === "create") {
    if (session?.role !== "admin") return NextResponse.json({ error: "Admins only." }, { status: 403 });
    const projectId = String(b.projectId || "");
    const item = String(b.item || "").trim();
    if (!projectId || !item) return NextResponse.json({ error: "Project and item required." }, { status: 400 });
    const rows = await query<{ id: string }>(
      `insert into approvals (project_id, item, status) values ($1,$2,'pending') returning id`,
      [projectId, item]
    );
    await dispatch("phase.completed", { project_id: projectId, approvalId: rows[0].id });
    return NextResponse.json({ ok: true, id: rows[0].id });
  }

  // decide
  const approvalId = String(b.approvalId || "");
  const decision = b.decision === "changes" ? "changes" : "approved";
  if (!approvalId) return NextResponse.json({ error: "approvalId required." }, { status: 400 });
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  await query(`update approvals set status = $1, decided_at = now() where id = $2`, [decision, approvalId]);
  return NextResponse.json({ ok: true, status: decision });
}
