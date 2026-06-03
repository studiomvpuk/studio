import { NextResponse } from "next/server";
import { dbConfigured, query } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Post a message to a project's thread.
export async function POST(req: Request) {
  const session = await getSession();
  const b = await req.json().catch(() => ({}));
  const projectId = String(b.projectId || "");
  const body = String(b.body || "").trim();

  if (!body) return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });
  if (!dbConfigured) return NextResponse.json({ ok: true, demo: true });
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!projectId) return NextResponse.json({ error: "projectId required." }, { status: 400 });

  // Clients can only post to their own project.
  if (session.role === "client") {
    const owns = await query<{ id: string }>(`select id from projects where id = $1 and client_id = $2`, [projectId, session.userId]);
    if (!owns.length) return NextResponse.json({ error: "Not your project." }, { status: 403 });
  }

  const author = session.role === "admin" ? "team" : "client";
  await query(`insert into messages (project_id, author, body) values ($1,$2,$3)`, [projectId, author, body]);
  return NextResponse.json({ ok: true, author });
}
