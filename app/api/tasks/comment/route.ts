import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { authorizeOwner, isDenied } from "@/lib/task-access";

// Add a comment to a task — the back-and-forth thread between client and studio.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const taskId = String(b.taskId || "");
  const body = String(b.body || "").trim();
  if (!taskId || !body) return NextResponse.json({ error: "Write something first." }, { status: 400 });

  const t = await query<{ project_id: string | null; retainer_id: string | null }>(
    `select project_id, retainer_id from project_tasks where id = $1`, [taskId]
  );
  if (!t.length) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  const auth = await authorizeOwner({ projectId: t[0].project_id, retainerId: t[0].retainer_id });
  if (isDenied(auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await query(
    `insert into task_comments (task_id, author, body) values ($1,$2,$3)`,
    [taskId, auth.role, body]
  );
  await query(`update project_tasks set updated_at = now() where id = $1`, [taskId]);
  return NextResponse.json({ ok: true });
}
