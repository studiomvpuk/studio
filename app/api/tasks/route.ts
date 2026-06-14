import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { dispatch } from "@/lib/automations";
import { authorizeProject } from "@/lib/task-access";

// Create a task / request (either side can raise one).
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const projectId = String(b.projectId || "");
  const title = String(b.title || "").trim();
  const detail = String(b.detail || "").trim();
  if (!projectId || !title) return NextResponse.json({ error: "A title is required." }, { status: 400 });

  const auth = await authorizeProject(projectId);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rows = await query<{ id: string }>(
    `insert into project_tasks (project_id, title, detail, created_by, status)
     values ($1,$2,$3,$4,'pending') returning id`,
    [projectId, title, detail || null, auth.role]
  );

  // Tell the other side a request was raised.
  const meta = await query<{ project: string; client_name: string | null; client_email: string | null }>(
    `select p.name as project,
            (select name from users u where u.id = p.client_id) as client_name,
            (select email from users u where u.id = p.client_id) as client_email
       from projects p where p.id = $1`,
    [projectId]
  );
  if (meta.length) {
    if (auth.role === "client") {
      // notify the studio
      await dispatch("task.created", {
        email: process.env.ADMIN_EMAIL || "officialstudiomvp@gmail.com",
        name: "team", project: meta[0].project, title, who: meta[0].client_name || "A client",
      });
    } else if (meta[0].client_email) {
      // admin added a task → let the client know it's on their board
      await dispatch("task.created", {
        email: meta[0].client_email, name: meta[0].client_name || "there",
        project: meta[0].project, title, who: "StudioMVP",
      });
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

  const t = await query<{ project_id: string; status: string; title: string }>(
    `select project_id, status, title from project_tasks where id = $1`, [id]
  );
  if (!t.length) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  const auth = await authorizeProject(t[0].project_id);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // Role-gated transitions.
  const adminCan = ["pending", "in_progress", "done"];
  const clientCan = ["confirmed", "in_progress"]; // confirm completion, or reopen for changes
  const allowed = auth.role === "admin" ? adminCan : clientCan;
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "You can't set that status." }, { status: 403 });
  }
  // The client may only act once the work is marked done.
  if (auth.role === "client" && t[0].status !== "done") {
    return NextResponse.json({ error: "You can confirm once the team marks it done." }, { status: 403 });
  }

  await query(`update project_tasks set status = $1, updated_at = now() where id = $2`, [status, id]);

  // Email hooks on the two states that need the other side's attention.
  const meta = await query<{ project: string; client_email: string | null; client_name: string | null }>(
    `select p.name as project,
            (select email from users u where u.id = p.client_id) as client_email,
            (select name  from users u where u.id = p.client_id) as client_name
       from projects p where p.id = $1`,
    [t[0].project_id]
  );
  if (meta.length) {
    if (auth.role === "admin" && status === "done" && meta[0].client_email) {
      await dispatch("task.done", {
        email: meta[0].client_email, name: meta[0].client_name || "there",
        project: meta[0].project, title: t[0].title,
      });
    }
    if (auth.role === "client" && status === "confirmed") {
      await dispatch("task.confirmed", {
        email: process.env.ADMIN_EMAIL || "officialstudiomvp@gmail.com",
        name: "team", project: meta[0].project, title: t[0].title, who: meta[0].client_name || "The client",
      });
    }
  }
  return NextResponse.json({ ok: true });
}

// Remove a task. Either side can remove one that's still pending; admins can remove any.
export async function DELETE(req: Request) {
  const b = await req.json().catch(() => ({}));
  const id = String(b.id || "");
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });

  const t = await query<{ project_id: string; status: string }>(
    `select project_id, status from project_tasks where id = $1`, [id]
  );
  if (!t.length) return NextResponse.json({ ok: true });

  const auth = await authorizeProject(t[0].project_id);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.role === "client" && t[0].status !== "pending") {
    return NextResponse.json({ error: "You can only remove a request before it's started." }, { status: 403 });
  }
  await query(`delete from project_tasks where id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
