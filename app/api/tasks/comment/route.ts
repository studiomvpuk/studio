import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { authorizeOwner, isDenied } from "@/lib/task-access";
import { uploadImage, isUploadError } from "@/lib/attachments";
import { dispatch } from "@/lib/automations";

// Add a comment to a task — the back-and-forth thread between client and studio.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const taskId = String(b.taskId || "");
  const body = String(b.body || "").trim();
  // A comment must have text or an image.
  if (!taskId || (!body && !b.image)) return NextResponse.json({ error: "Write something or attach an image." }, { status: 400 });

  const t = await query<{ project_id: string | null; retainer_id: string | null; title: string }>(
    `select project_id, retainer_id, title from project_tasks where id = $1`, [taskId]
  );
  if (!t.length) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  const auth = await authorizeOwner({ projectId: t[0].project_id, retainerId: t[0].retainer_id });
  if (isDenied(auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const img = await uploadImage(b.image);
  if (isUploadError(img)) return NextResponse.json({ error: img.error }, { status: img.status });

  const c = await query<{ id: string }>(
    `insert into task_comments (task_id, author, body) values ($1,$2,$3) returning id`,
    [taskId, auth.role, body || "(image)"]
  );
  if (img) {
    await query(`insert into task_attachments (comment_id, mime, r2_key) values ($1,$2,$3)`, [c[0].id, img.mime, img.key]);
  }
  await query(`update project_tasks set updated_at = now() where id = $1`, [taskId]);

  // When the studio comments, email the client so they don't miss it.
  if (auth.role === "admin") {
    const retainerId = t[0].retainer_id;
    const meta = retainerId
      ? await query<{ label: string; client_email: string | null; client_name: string | null }>(
          `select r.title as label,
                  (select email from users u where u.id = r.client_id) as client_email,
                  (select name  from users u where u.id = r.client_id) as client_name
             from retainers r where r.id = $1`, [retainerId])
      : await query<{ label: string; client_email: string | null; client_name: string | null }>(
          `select p.name as label,
                  (select email from users u where u.id = p.client_id) as client_email,
                  (select name  from users u where u.id = p.client_id) as client_name
             from projects p where p.id = $1`, [t[0].project_id]);
    if (meta[0]?.client_email) {
      await dispatch("task.comment", {
        email: meta[0].client_email,
        name: meta[0].client_name || "there",
        project: meta[0].label,
        title: t[0].title,
        body,
        link: retainerId ? "/dashboard/retainer" : "/dashboard",
      });
    }
  }
  return NextResponse.json({ ok: true });
}
