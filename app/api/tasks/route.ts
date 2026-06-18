import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { dispatch } from "@/lib/automations";
import { authorizeOwner, isDenied } from "@/lib/task-access";
import { periodStartExpr, periodWord } from "@/lib/data";
import { uploadImage, isUploadError } from "@/lib/attachments";

const ADMIN_EMAIL = () => process.env.ADMIN_EMAIL || "officialstudiomvp@gmail.com";

// Where each recipient should land when they click the email button — these must
// be real, existing routes (tasks live embedded, not on a standalone page).
const clientLink = (projectId: string | null, retainerId: string | null) =>
  retainerId ? "/dashboard/retainer" : "/dashboard";
const adminLink = (projectId: string | null, retainerId: string | null) =>
  retainerId ? "/admin/retainers" : projectId ? `/admin/projects/${projectId}` : "/admin";

// The other side's name/email + a human label, for either a project or retainer task.
async function scopeMeta(projectId: string | null, retainerId: string | null) {
  if (retainerId) {
    const r = await query<{ label: string; client_email: string | null; client_name: string | null }>(
      `select r.title as label,
              (select email from users u where u.id = r.client_id) as client_email,
              (select name  from users u where u.id = r.client_id) as client_name
         from retainers r where r.id = $1`,
      [retainerId]
    );
    return r[0] || null;
  }
  if (projectId) {
    const p = await query<{ label: string; client_email: string | null; client_name: string | null }>(
      `select p.name as label,
              (select email from users u where u.id = p.client_id) as client_email,
              (select name  from users u where u.id = p.client_id) as client_name
         from projects p where p.id = $1`,
      [projectId]
    );
    return p[0] || null;
  }
  return null;
}

// Create a task / request (either side can raise one) against a project or a retainer.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const projectId = b.projectId ? String(b.projectId) : null;
  const retainerId = b.retainerId ? String(b.retainerId) : null;
  const title = String(b.title || "").trim();
  const detail = String(b.detail || "").trim();
  if ((!projectId && !retainerId) || !title) return NextResponse.json({ error: "A title is required." }, { status: 400 });

  const auth = await authorizeOwner({ projectId, retainerId });
  if (isDenied(auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // Enforce the retainer's per-period task allowance — only for the client's own
  // additions. The allowance resets every billing period (e.g. N tasks per month).
  if (retainerId && auth.role === "client") {
    const cap = await query<{ task_allowance: number; period: string }>(
      `select task_allowance, period from retainers where id = $1`, [retainerId]
    );
    const allowance = cap[0]?.task_allowance ?? 0;
    if (allowance > 0) {
      const period = cap[0].period;
      const used = await query<{ n: string }>(
        `select count(*) as n from project_tasks
          where retainer_id = $1 and created_by = 'client' and created_at >= ${periodStartExpr(period)}`,
        [retainerId]
      );
      if (Number(used[0]?.n || 0) >= allowance) {
        const word = periodWord[period] || "period";
        return NextResponse.json(
          { error: `This retainer includes ${allowance} task${allowance === 1 ? "" : "s"} per ${word}. You've used them all this ${word} — they reset next ${word}, or ask the team to add more.` },
          { status: 403 }
        );
      }
    }
  }

  // Validate + upload any attached image before creating the task.
  const img = await uploadImage(b.image);
  if (isUploadError(img)) return NextResponse.json({ error: img.error }, { status: img.status });

  const rows = await query<{ id: string }>(
    `insert into project_tasks (project_id, retainer_id, title, detail, created_by, status)
     values ($1,$2,$3,$4,$5,'pending') returning id`,
    [projectId, retainerId, title, detail || null, auth.role]
  );
  if (img) {
    await query(`insert into task_attachments (task_id, mime, r2_key) values ($1,$2,$3)`, [rows[0].id, img.mime, img.key]);
  }

  const meta = await scopeMeta(projectId, retainerId);
  if (meta) {
    if (auth.role === "client") {
      await dispatch("task.created", { email: ADMIN_EMAIL(), name: "team", project: meta.label, title, who: meta.client_name || "A client", link: adminLink(projectId, retainerId) });
    } else if (meta.client_email) {
      await dispatch("task.created", { email: meta.client_email, name: meta.client_name || "there", project: meta.label, title, who: "StudioMVP", link: clientLink(projectId, retainerId) });
    }
  }
  return NextResponse.json({ ok: true, id: rows[0].id });
}

// Move a task along the workflow. Admin drives the work states; the client confirms.
export async function PATCH(req: Request) {
  const b = await req.json().catch(() => ({}));
  const id = String(b.id || "");
  const status = String(b.status || "");
  if (!id || !status) return NextResponse.json({ error: "id and status required." }, { status: 400 });

  const t = await query<{ project_id: string | null; retainer_id: string | null; status: string; title: string }>(
    `select project_id, retainer_id, status, title from project_tasks where id = $1`, [id]
  );
  if (!t.length) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  const auth = await authorizeOwner({ projectId: t[0].project_id, retainerId: t[0].retainer_id });
  if (isDenied(auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const adminCan = ["pending", "in_progress", "done"];
  const clientCan = ["confirmed", "in_progress"]; // confirm completion, or reopen for changes
  const allowed = auth.role === "admin" ? adminCan : clientCan;
  if (!allowed.includes(status)) return NextResponse.json({ error: "You can't set that status." }, { status: 403 });
  if (auth.role === "client" && t[0].status !== "done") {
    return NextResponse.json({ error: "You can confirm once the team marks it done." }, { status: 403 });
  }

  await query(`update project_tasks set status = $1, updated_at = now() where id = $2`, [status, id]);

  const meta = await scopeMeta(t[0].project_id, t[0].retainer_id);
  if (meta) {
    if (auth.role === "admin" && status === "done" && meta.client_email) {
      await dispatch("task.done", { email: meta.client_email, name: meta.client_name || "there", project: meta.label, title: t[0].title, link: clientLink(t[0].project_id, t[0].retainer_id) });
    }
    if (auth.role === "client" && status === "confirmed") {
      await dispatch("task.confirmed", { email: ADMIN_EMAIL(), name: "team", project: meta.label, title: t[0].title, who: meta.client_name || "The client", link: adminLink(t[0].project_id, t[0].retainer_id) });
    }
  }
  return NextResponse.json({ ok: true });
}

// Remove a task. Clients may remove one that's still pending; admins can remove any.
export async function DELETE(req: Request) {
  const b = await req.json().catch(() => ({}));
  const id = String(b.id || "");
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });

  const t = await query<{ project_id: string | null; retainer_id: string | null; status: string }>(
    `select project_id, retainer_id, status from project_tasks where id = $1`, [id]
  );
  if (!t.length) return NextResponse.json({ ok: true });

  const auth = await authorizeOwner({ projectId: t[0].project_id, retainerId: t[0].retainer_id });
  if (isDenied(auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.role === "client" && t[0].status !== "pending") {
    return NextResponse.json({ error: "You can only remove a request before it's started." }, { status: 403 });
  }
  await query(`delete from project_tasks where id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
