import { NextResponse } from "next/server";
import { dbConfigured, query } from "@/lib/db";
import { dispatch } from "@/lib/automations";

type Proposal = {
  id: string; client_email: string; client_name: string | null; title: string;
  price_cents: number; payment_plan: "full" | "deposit" | "milestones"; deposit_pct: number; status: string;
};

const PHASES = ["Discovery", "Design", "Build", "Test", "Launch"];

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!dbConfigured) {
    return NextResponse.json({ ok: true, demo: true, redirect: "/dashboard" });
  }

  const b = await req.json().catch(() => ({}));
  const signerName = String(b.signerName || "").trim();
  const signature = String(b.signature || "").trim();
  if (!signerName || !signature) {
    return NextResponse.json({ error: "Type your full name to sign." }, { status: 400 });
  }

  const rows = await query<Proposal>(`select * from proposals where token = $1`, [token]);
  if (!rows.length) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  const p = rows[0];
  if (p.status === "signed") return NextResponse.json({ error: "Already signed." }, { status: 409 });

  // find-or-create the client user
  let users = await query<{ id: string }>(`select id from users where email = $1`, [p.client_email]);
  if (!users.length) {
    users = await query(
      `insert into users (email, name, role) values ($1, $2, 'client') returning id`,
      [p.client_email, p.client_name]
    );
  } else {
    await query(`update users set role = 'client' where id = $1 and role = 'prospect'`, [users[0].id]);
  }
  const clientId = users[0].id;

  // create the project + phases
  const proj = await query<{ id: string }>(
    `insert into projects (client_id, name, status, current_phase, total_cents, deposit_pct, gate_launch)
     values ($1, $2, 'signed', 'Discovery', $3, $4, true) returning id`,
    [clientId, p.title, p.price_cents, p.deposit_pct]
  );
  const projectId = proj[0].id;
  for (let i = 0; i < PHASES.length; i++) {
    await query(
      `insert into phases (project_id, name, status, ord) values ($1, $2, $3, $4)`,
      [projectId, PHASES[i], i === 0 ? "active" : "upcoming", i + 1]
    );
  }

  // first invoice — full or deposit
  if (p.payment_plan === "full") {
    await query(`insert into invoices (project_id, amount_cents, type, status) values ($1,$2,'full','due')`, [projectId, p.price_cents]);
  } else {
    const deposit = Math.round((p.price_cents * p.deposit_pct) / 100);
    await query(`insert into invoices (project_id, amount_cents, type, status) values ($1,$2,'deposit','due')`, [projectId, deposit]);
    await query(`insert into invoices (project_id, amount_cents, type, status) values ($1,$2,'balance','draft')`, [projectId, p.price_cents - deposit]);
  }

  // record the signed contract (audit meta)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const agent = req.headers.get("user-agent") || null;
  await query(
    `insert into contracts (proposal_id, project_id, signer_name, signer_email, signature, signer_ip, signer_agent)
     values ($1,$2,$3,$4,$5,$6,$7)`,
    [p.id, projectId, signerName, p.client_email, signature, ip, agent]
  );
  await query(`update proposals set status = 'signed' where id = $1`, [p.id]);
  await query(`update leads set status = 'signed' where lower(email) = lower($1)`, [p.client_email]);

  await dispatch("contract.signed", { email: p.client_email, name: p.client_name || signerName, project_id: projectId });
  await dispatch("invoice.created", { project_id: projectId });

  return NextResponse.json({ ok: true, redirect: "/login" });
}
