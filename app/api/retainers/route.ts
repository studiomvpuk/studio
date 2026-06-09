import { NextResponse } from "next/server";
import { dbConfigured, query } from "@/lib/db";
import { ensureSchema } from "@/lib/migrate";
import { getSession } from "@/lib/auth";
import { dispatch } from "@/lib/automations";

async function guard() {
  const session = await getSession();
  if (session?.role !== "admin") return { error: "Admins only.", status: 403 as const };
  if (!dbConfigured) return { error: "Database isn't connected.", status: 503 as const };
  await ensureSchema();
  return null;
}

const PERIODS = ["monthly", "quarterly", "yearly"];

// Accept only a clean YYYY-MM-DD; anything else → null (caller falls back to today).
function isoDate(v: unknown): string | null {
  const s = String(v || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

// Admin: set up a retainer for a project's client.
export async function POST(req: Request) {
  const bad = await guard();
  if (bad) return NextResponse.json({ error: bad.error }, { status: bad.status });

  const b = await req.json().catch(() => ({}));
  let clientId = String(b.clientId || "");
  const projectId = String(b.projectId || ""); // optional — a retainer can stand alone
  const title = String(b.title || "").trim() || "Ongoing retainer";
  const amountCents = Math.round(Number(b.amount) * 100);
  const period = PERIODS.includes(b.period) ? b.period : "monthly";
  const nextDue = isoDate(b.nextDue); // null → defaults to today in SQL

  if (!Number.isFinite(amountCents) || amountCents < 100) {
    return NextResponse.json({ error: "Enter an amount of £1 or more." }, { status: 400 });
  }

  // If a project is given, validate it and (when no client picked) derive the client from it.
  if (projectId) {
    const proj = await query<{ client_id: string | null }>(`select client_id from projects where id = $1`, [projectId]);
    if (!proj.length) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    if (!clientId) clientId = proj[0].client_id || "";
  }

  if (!clientId) return NextResponse.json({ error: "Pick a client." }, { status: 400 });
  const client = await query<{ id: string }>(`select id from users where id = $1`, [clientId]);
  if (!client.length) return NextResponse.json({ error: "Client not found." }, { status: 404 });

  const rows = await query<{ id: string }>(
    `insert into retainers (project_id, client_id, title, amount_cents, period, status, next_due)
     values ($1,$2,$3,$4,$5,'active', coalesce($6::date, current_date)) returning id`,
    [projectId || null, clientId, title, amountCents, period, nextDue]
  );

  // Tell the client their ongoing plan is set up + when the first payment is due.
  const c = await query<{ email: string | null; name: string | null }>(
    `select email, name from users where id = $1`, [clientId]
  );
  if (c.length && c[0].email) {
    await dispatch("retainer.created", {
      email: c[0].email, name: c[0].name || "there",
      title, amountCents, period, nextDue,
    });
  }
  return NextResponse.json({ ok: true, id: rows[0].id });
}

// Admin: edit a retainer or change its status (active / paused / ended).
export async function PATCH(req: Request) {
  const bad = await guard();
  if (bad) return NextResponse.json({ error: bad.error }, { status: bad.status });

  const b = await req.json().catch(() => ({}));
  const id = String(b.id || "");
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });

  const sets: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

  if (b.title !== undefined) { sets.push(`title = $${i++}`); vals.push(String(b.title).trim() || "Ongoing retainer"); }
  if (b.amount !== undefined) {
    const cents = Math.round(Number(b.amount) * 100);
    if (!Number.isFinite(cents) || cents < 100) return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
    sets.push(`amount_cents = $${i++}`); vals.push(cents);
  }
  if (b.period !== undefined && PERIODS.includes(b.period)) { sets.push(`period = $${i++}`); vals.push(b.period); }
  if (b.status !== undefined && ["active", "paused", "ended"].includes(b.status)) { sets.push(`status = $${i++}`); vals.push(b.status); }
  if (b.nextDue !== undefined) {
    const d = isoDate(b.nextDue);
    if (!d) return NextResponse.json({ error: "Enter a valid next-due date." }, { status: 400 });
    sets.push(`next_due = $${i++}`); vals.push(d);
  }

  if (!sets.length) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  vals.push(id);
  await query(`update retainers set ${sets.join(", ")} where id = $${i}`, vals);
  return NextResponse.json({ ok: true });
}

// Admin: delete a retainer.
export async function DELETE(req: Request) {
  const bad = await guard();
  if (bad) return NextResponse.json({ error: bad.error }, { status: bad.status });
  const b = await req.json().catch(() => ({}));
  const id = String(b.id || "");
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
  await query(`delete from retainers where id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
