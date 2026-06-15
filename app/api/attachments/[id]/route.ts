import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { authorizeOwner, isDenied } from "@/lib/task-access";
import { r2Get } from "@/lib/r2";

export const runtime = "nodejs";

// Serve a task/comment image from R2 — only to the owning client or an admin.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const a = await query<{ task_id: string | null; comment_id: string | null; mime: string; r2_key: string }>(
    `select task_id, comment_id, mime, r2_key from task_attachments where id = $1`, [id]
  );
  if (!a.length) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Resolve the owning task (directly, or via the comment it hangs off).
  let taskId = a[0].task_id;
  if (!taskId && a[0].comment_id) {
    const c = await query<{ task_id: string }>(`select task_id from task_comments where id = $1`, [a[0].comment_id]);
    taskId = c[0]?.task_id ?? null;
  }
  if (!taskId) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const t = await query<{ project_id: string | null; retainer_id: string | null }>(
    `select project_id, retainer_id from project_tasks where id = $1`, [taskId]
  );
  if (!t.length) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const auth = await authorizeOwner({ projectId: t[0].project_id, retainerId: t[0].retainer_id });
  if (isDenied(auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const res = await r2Get(a[0].r2_key);
  if (!res.ok || !res.body) return NextResponse.json({ error: "Image unavailable." }, { status: 404 });

  return new Response(res.body, {
    headers: {
      "Content-Type": a[0].mime,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
