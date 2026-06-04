import { NextResponse } from "next/server";
import { dbConfigured, query } from "@/lib/db";
import { ensureSchema } from "@/lib/migrate";
import { getSession } from "@/lib/auth";

const normalizeUrl = (u: string) => {
  const t = u.trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
};

async function guard() {
  const session = await getSession();
  if (session?.role !== "admin") return { error: "Admins only.", status: 403 as const };
  if (!dbConfigured) return { error: "Database isn't connected.", status: 503 as const };
  await ensureSchema();
  return null;
}

// Admin: add a document to a project.
export async function POST(req: Request) {
  const bad = await guard();
  if (bad) return NextResponse.json({ error: bad.error }, { status: bad.status });

  const b = await req.json().catch(() => ({}));
  const projectId = String(b.projectId || "");
  const label = String(b.label || "").trim();
  const url = normalizeUrl(String(b.url || ""));
  if (!projectId || !label || !url) {
    return NextResponse.json({ error: "Project, label and a link are required." }, { status: 400 });
  }
  const rows = await query<{ id: string }>(
    `insert into documents (project_id, label, url) values ($1,$2,$3) returning id`,
    [projectId, label, url]
  );
  return NextResponse.json({ ok: true, id: rows[0].id });
}

// Admin: rename / re-link a document.
export async function PATCH(req: Request) {
  const bad = await guard();
  if (bad) return NextResponse.json({ error: bad.error }, { status: bad.status });

  const b = await req.json().catch(() => ({}));
  const id = String(b.id || "");
  const label = String(b.label || "").trim();
  const url = normalizeUrl(String(b.url || ""));
  if (!id || !label || !url) {
    return NextResponse.json({ error: "Label and a link are required." }, { status: 400 });
  }
  await query(`update documents set label = $1, url = $2 where id = $3`, [label, url, id]);
  return NextResponse.json({ ok: true });
}

// Admin: remove a document.
export async function DELETE(req: Request) {
  const bad = await guard();
  if (bad) return NextResponse.json({ error: bad.error }, { status: bad.status });

  const b = await req.json().catch(() => ({}));
  const id = String(b.id || "");
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
  await query(`delete from documents where id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
