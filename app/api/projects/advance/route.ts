import { NextResponse } from "next/server";
import { dbConfigured, query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { dispatch } from "@/lib/automations";

// Admin: advance a project to its next phase. Completing the last phase settles the project.
export async function POST(req: Request) {
  const session = await getSession();
  if (dbConfigured && session?.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }
  const b = await req.json().catch(() => ({}));
  const projectId = String(b.projectId || "");
  if (!dbConfigured) return NextResponse.json({ ok: true, demo: true });
  if (!projectId) return NextResponse.json({ error: "projectId required." }, { status: 400 });

  const phases = await query<{ id: string; name: string; status: string; ord: number }>(
    `select id, name, status, ord from phases where project_id = $1 order by ord`,
    [projectId]
  );
  if (!phases.length) return NextResponse.json({ error: "No phases." }, { status: 404 });

  const activeIdx = phases.findIndex((p) => p.status === "active");
  const idx = activeIdx === -1 ? phases.findIndex((p) => p.status === "upcoming") : activeIdx;
  if (idx === -1) return NextResponse.json({ ok: true, done: true });

  // mark current done
  await query(`update phases set status = 'done' where id = $1`, [phases[idx].id]);
  await dispatch("phase.completed", { project_id: projectId, phase: phases[idx].name });

  const next = phases[idx + 1];
  if (next) {
    await query(`update phases set status = 'active' where id = $1`, [next.id]);
    await query(`update projects set current_phase = $1 where id = $2`, [next.name, projectId]);

    // entering Launch → settle the balance: flip the draft balance invoice to due.
    if (next.name === "Launch") {
      await query(`update invoices set status = 'due' where project_id = $1 and type = 'balance' and status = 'draft'`, [projectId]);
    }
    return NextResponse.json({ ok: true, phase: next.name });
  }

  // last phase done → complete project
  await query(`update projects set status = 'completed', current_phase = 'Completed' where id = $1`, [projectId]);
  const client = await query<{ email: string | null; name: string | null }>(
    `select u.email, u.name from projects p left join users u on u.id = p.client_id where p.id = $1`,
    [projectId]
  );
  await dispatch("project.completed", { project_id: projectId, email: client[0]?.email, name: client[0]?.name || "there" });
  return NextResponse.json({ ok: true, completed: true });
}
