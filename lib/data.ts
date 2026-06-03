import { dbConfigured, safeQuery } from "./db";

const gbp = (cents: number) => "£" + (cents / 100).toLocaleString("en-GB");
const dayMonth = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—";
const dayMonthYear = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

const STATUS_LABELS: Record<string, string> = {
  new: "New", call_booked: "Call booked", proposal: "Proposal", signed: "Signed", lost: "Lost",
  draft: "Draft", sent: "Sent", viewed: "Viewed", declined: "Declined",
  active: "Active", completed: "Completed", lead: "Lead", due: "Due", paid: "Paid",
  pending: "Pending", approved: "Approved", changes: "Changes requested",
};
const label = (s: string) => STATUS_LABELS[s] || s;

export type AdminData = {
  live: boolean;
  empty: boolean;
  stats: { k: string; v: string; delta: string; warn?: boolean }[];
  projects: { id: string | null; name: string; phase: string; pay: string; badge: string; status: string }[];
  leads: { name: string; status: string; est: string }[];
};

export async function getAdminData(): Promise<AdminData> {
  const projects = await safeQuery<{
    id: string; name: string; current_phase: string; total_cents: number; paid_cents: number;
  }>(`
    select p.id, p.name, p.current_phase, p.total_cents,
           coalesce((select sum(amount_cents) from invoices i where i.project_id = p.id and i.status='paid'),0) as paid_cents
      from projects p where p.status in ('active','signed') order by p.created_at desc limit 8
  `);
  const leads = await safeQuery<{ name: string | null; email: string; status: string; est_cents: number | null }>(
    `select name, email, status, est_cents from leads where status in ('new','call_booked','proposal') order by created_at desc limit 6`
  );
  const totals = await safeQuery<{ pipeline: number; collected: number; outstanding: number; active: number }>(`
    select
      coalesce((select sum(est_cents) from leads where status in ('new','call_booked','proposal')),0)
        + coalesce((select sum(price_cents) from proposals where status in ('draft','sent','viewed')),0) as pipeline,
      coalesce((select sum(amount_cents) from invoices where status='paid'),0) as collected,
      coalesce((select sum(amount_cents) from invoices where status='due'),0) as outstanding,
      (select count(*) from projects where status='active') as active
  `);

  const t = totals[0] || { pipeline: 0, collected: 0, outstanding: 0, active: 0 };
  return {
    live: dbConfigured,
    empty: !projects.length && !leads.length,
    stats: [
      { k: "Pipeline value", v: gbp(t.pipeline), delta: "leads + proposals" },
      { k: "Collected", v: gbp(t.collected), delta: "paid invoices" },
      { k: "Outstanding", v: gbp(t.outstanding), delta: "balances due", warn: t.outstanding > 0 },
      { k: "Active projects", v: String(t.active), delta: "in production" },
    ],
    projects: projects.map((p) => {
      const paid = p.paid_cents >= p.total_cents && p.total_cents > 0;
      return {
        id: p.id, name: p.name, phase: p.current_phase,
        pay: `${gbp(p.paid_cents)} / ${gbp(p.total_cents)}`,
        badge: paid ? "b-ok" : "b-warn",
        status: paid ? "Paid in full" : "Balance due",
      };
    }),
    leads: leads.map((l) => ({ name: l.name || l.email, status: l.status, est: l.est_cents ? gbp(l.est_cents) : "—" })),
  };
}

/* ───────── PIPELINE ───────── */
export type Deal = { nm: string; a?: string; b?: string; badge?: string; badgeText?: string; href?: string };
export type PipelineCol = { h: string; deals: Deal[] };

export async function getPipeline(): Promise<{ live: boolean; empty: boolean; cols: PipelineCol[] }> {
  const leads = await safeQuery<{ name: string | null; email: string; status: string; est_cents: number | null }>(
    `select name, email, status, est_cents from leads where status in ('new','call_booked') order by created_at desc`
  );
  const proposals = await safeQuery<{ title: string; status: string; price_cents: number; token: string }>(
    `select title, status, price_cents, token from proposals where status in ('draft','sent','viewed') order by created_at desc`
  );
  const projects = await safeQuery<{ id: string; name: string; status: string; current_phase: string }>(
    `select id, name, status, current_phase from projects order by created_at desc`
  );
  const est = (c: number | null) => (c ? gbp(c) + " est" : "—");

  const cols: PipelineCol[] = [
    { h: "Leads", deals: leads.map((l) => ({ nm: l.name || l.email, a: label(l.status), b: est(l.est_cents) })) },
    { h: "Proposal", deals: proposals.map((p) => ({ nm: p.title, a: label(p.status), b: gbp(p.price_cents), href: `/admin/contracts` })) },
    { h: "Signed", deals: projects.filter((p) => p.status === "signed").map((p) => ({ nm: p.name, badge: "b-warn", badgeText: "Deposit due", href: `/admin/projects/${p.id}` })) },
    { h: "Active", deals: projects.filter((p) => p.status === "active").map((p) => ({ nm: p.name, badge: "b-info", badgeText: p.current_phase, href: `/admin/projects/${p.id}` })) },
    { h: "Done", deals: projects.filter((p) => p.status === "completed").map((p) => ({ nm: p.name, badge: "b-ok", badgeText: "Done", href: `/admin/projects/${p.id}` })) },
  ];
  const empty = cols.every((c) => c.deals.length === 0);
  return { live: dbConfigured, empty, cols };
}

/* ───────── PROJECTS ───────── */
export type ProjectRow = {
  id: string; name: string; client: string; status: string; phase: string;
  pay: string; badge: string; statusLabel: string; launch: string;
};
export async function getProjects(): Promise<{ live: boolean; rows: ProjectRow[] }> {
  const rows = await safeQuery<{
    id: string; name: string; status: string; current_phase: string; total_cents: number;
    est_launch: string | null; paid_cents: number; client_name: string | null;
  }>(`
    select p.id, p.name, p.status, p.current_phase, p.total_cents, p.est_launch,
           coalesce((select sum(amount_cents) from invoices i where i.project_id = p.id and i.status='paid'),0) as paid_cents,
           (select name from users u where u.id = p.client_id) as client_name
      from projects p order by p.created_at desc
  `);
  return {
    live: dbConfigured,
    rows: rows.map((p) => {
      const paid = p.paid_cents >= p.total_cents && p.total_cents > 0;
      return {
        id: p.id, name: p.name, client: p.client_name || "—",
        status: p.status, phase: p.current_phase,
        pay: `${gbp(p.paid_cents)} / ${gbp(p.total_cents)}`,
        badge: paid ? "b-ok" : p.status === "active" ? "b-info" : "b-warn",
        statusLabel: paid ? "Paid in full" : label(p.status),
        launch: dayMonthYear(p.est_launch),
      };
    }),
  };
}

export type ProjectDetail = {
  id: string; name: string; client: string; status: string; phase: string;
  total: string; paid: string; outstanding: string; totalCents: number; depositPct: number; gateLaunch: boolean; launch: string;
  phases: { id: string; name: string; state: "done" | "active" | "upcoming"; ord: number }[];
  invoices: { id: string; amount: string; type: string; status: string; when: string }[];
  approvals: { id: string; item: string; status: string; when: string }[];
  messages: { author: string; body: string; when: string; mine: boolean }[];
};
export async function getProjectDetail(id: string): Promise<ProjectDetail | null> {
  const rows = await safeQuery<{
    id: string; name: string; status: string; current_phase: string; total_cents: number;
    deposit_pct: number; gate_launch: boolean; est_launch: string | null; client_name: string | null;
  }>(`
    select p.id, p.name, p.status, p.current_phase, p.total_cents, p.deposit_pct, p.gate_launch, p.est_launch,
           (select name from users u where u.id = p.client_id) as client_name
      from projects p where p.id = $1
  `, [id]);
  if (!rows.length) return null;
  const p = rows[0];

  const phases = await safeQuery<{ id: string; name: string; status: "done" | "active" | "upcoming"; ord: number }>(
    `select id, name, status, ord from phases where project_id = $1 order by ord`, [id]
  );
  const invoices = await safeQuery<{ id: string; amount_cents: number; type: string; status: string; created_at: string; paid_at: string | null }>(
    `select id, amount_cents, type, status, created_at, paid_at from invoices where project_id = $1 order by created_at`, [id]
  );
  const approvals = await safeQuery<{ id: string; item: string; status: string; created_at: string }>(
    `select id, item, status, created_at from approvals where project_id = $1 order by created_at desc`, [id]
  );
  const messages = await safeQuery<{ author: string; body: string; created_at: string }>(
    `select author, body, created_at from messages where project_id = $1 order by created_at asc limit 50`, [id]
  );

  const paidCents = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount_cents, 0);
  return {
    id: p.id, name: p.name, client: p.client_name || "—", status: label(p.status), phase: p.current_phase,
    total: gbp(p.total_cents), paid: gbp(paidCents), outstanding: gbp(p.total_cents - paidCents),
    totalCents: p.total_cents, depositPct: p.deposit_pct, gateLaunch: p.gate_launch, launch: dayMonthYear(p.est_launch),
    phases: phases.map((x) => ({ id: x.id, name: x.name, state: x.status, ord: x.ord })),
    invoices: invoices.map((i) => ({ id: i.id, amount: gbp(i.amount_cents), type: label(i.type), status: i.status, when: dayMonth(i.paid_at || i.created_at) })),
    approvals: approvals.map((a) => ({ id: a.id, item: a.item, status: a.status, when: dayMonth(a.created_at) })),
    messages: messages.map((m) => ({ author: m.author, body: m.body, when: dayMonth(m.created_at), mine: m.author !== "client" })),
  };
}

/* ───────── CONTRACTS ───────── */
export async function getContracts(): Promise<{
  live: boolean;
  proposals: { id: string; title: string; client: string; price: string; status: string; statusLabel: string; token: string; when: string }[];
  signed: { title: string; signer: string; email: string; when: string }[];
}> {
  const proposals = await safeQuery<{ id: string; title: string; client_name: string | null; client_email: string; price_cents: number; status: string; token: string; created_at: string }>(
    `select id, title, client_name, client_email, price_cents, status, token, created_at from proposals order by created_at desc`
  );
  const signed = await safeQuery<{ title: string; signer_name: string; signer_email: string; signed_at: string }>(
    `select pr.title, c.signer_name, c.signer_email, c.signed_at from contracts c join proposals pr on pr.id = c.proposal_id order by c.signed_at desc`
  );
  const badgeFor = (s: string) => (s === "signed" ? "b-ok" : s === "declined" ? "b-warn" : s === "viewed" || s === "sent" ? "b-info" : "b-mute");
  return {
    live: dbConfigured,
    proposals: proposals.map((p) => ({
      id: p.id, title: p.title, client: p.client_name || p.client_email,
      price: gbp(p.price_cents), status: badgeFor(p.status), statusLabel: label(p.status),
      token: p.token, when: dayMonth(p.created_at),
    })),
    signed: signed.map((s) => ({ title: s.title, signer: s.signer_name, email: s.signer_email, when: dayMonthYear(s.signed_at) })),
  };
}

/* ───────── PAYMENTS ───────── */
export async function getPayments(): Promise<{
  live: boolean;
  stats: { k: string; v: string; warn?: boolean }[];
  rows: { id: string; project: string; amount: string; type: string; status: string; badge: string; when: string }[];
}> {
  const rows = await safeQuery<{ id: string; project: string; amount_cents: number; type: string; status: string; created_at: string; paid_at: string | null }>(
    `select i.id, p.name as project, i.amount_cents, i.type, i.status, i.created_at, i.paid_at
       from invoices i join projects p on p.id = i.project_id order by i.created_at desc`
  );
  const totals = await safeQuery<{ collected: number; due: number }>(
    `select coalesce(sum(amount_cents) filter (where status='paid'),0) as collected,
            coalesce(sum(amount_cents) filter (where status='due'),0) as due from invoices`
  );
  const t = totals[0] || { collected: 0, due: 0 };
  return {
    live: dbConfigured,
    stats: [
      { k: "Collected", v: gbp(t.collected) },
      { k: "Outstanding", v: gbp(t.due), warn: t.due > 0 },
      { k: "Invoices", v: String(rows.length) },
    ],
    rows: rows.map((i) => ({
      id: i.id, project: i.project, amount: gbp(i.amount_cents), type: label(i.type),
      status: label(i.status), badge: i.status === "paid" ? "b-ok" : i.status === "due" ? "b-warn" : "b-mute",
      when: dayMonth(i.paid_at || i.created_at),
    })),
  };
}

/* ───────── AUTOMATIONS / EVENTS ───────── */
export async function getEvents(): Promise<{ live: boolean; rows: { type: string; summary: string; when: string }[] }> {
  const rows = await safeQuery<{ type: string; payload: Record<string, unknown> | null; fired_at: string }>(
    `select type, payload, fired_at from events order by fired_at desc limit 60`
  );
  const summarize = (payload: Record<string, unknown> | null) => {
    if (!payload) return "";
    const keys = ["name", "email", "title", "project", "amount"];
    const part = keys.map((k) => (payload[k] != null ? String(payload[k]) : null)).filter(Boolean);
    return part.join(" · ");
  };
  return {
    live: dbConfigured,
    rows: rows.map((e) => ({
      type: e.type,
      summary: summarize(e.payload),
      when: e.fired_at ? new Date(e.fired_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—",
    })),
  };
}

export type ClientMessage = { author: string; body: string; when: string };
export type ClientData = {
  live: boolean;
  hasProject: boolean;
  projectId: string | null;
  project: string;
  statusLabel: string;
  phaseLabel: string;
  nextPhase: string | null;
  pct: number;
  phases: { name: string; state: "done" | "active" | "upcoming" }[];
  total: string;
  paid: string;
  outstanding: string;
  paidPct: number;
  balanceInvoiceId: string | null;
  invoices: { id: string; label: string; amount: string; status: string; badge: string }[];
  documents: { label: string; meta: string; href: string | null }[];
  approvals: { id: string; item: string; status: "pending" | "approved" | "changes"; when: string }[];
  messages: ClientMessage[];
};

function emptyClient(live: boolean): ClientData {
  return {
    live, hasProject: false, projectId: null, project: "", statusLabel: "", phaseLabel: "",
    nextPhase: null, pct: 0, phases: [], total: gbp(0), paid: gbp(0), outstanding: gbp(0),
    paidPct: 0, balanceInvoiceId: null, invoices: [], documents: [], approvals: [], messages: [],
  };
}

export async function getClientData(clientId?: string): Promise<ClientData> {
  const proj = await safeQuery<{ id: string; name: string; status: string; current_phase: string; total_cents: number; est_launch: string | null }>(
    clientId
      ? `select id, name, status, current_phase, total_cents, est_launch from projects where client_id = $1 order by created_at desc limit 1`
      : `select id, name, status, current_phase, total_cents, est_launch from projects order by created_at desc limit 1`,
    clientId ? [clientId] : []
  );
  if (!proj.length) return emptyClient(dbConfigured);

  const p = proj[0];
  const phaseRows = await safeQuery<{ name: string; status: "done" | "active" | "upcoming" }>(
    `select name, status from phases where project_id = $1 order by ord`, [p.id]
  );
  const phases = phaseRows.map((x) => ({ name: x.name, state: x.status }));
  const invoices = await safeQuery<{ id: string; amount_cents: number; type: string; status: string }>(
    `select id, amount_cents, type, status from invoices where project_id = $1 order by created_at`, [p.id]
  );
  const approvalRows = await safeQuery<{ id: string; item: string; status: "pending" | "approved" | "changes"; created_at: string }>(
    `select id, item, status, created_at from approvals where project_id = $1 order by created_at desc`, [p.id]
  );
  const messageRows = await safeQuery<{ author: string; body: string; created_at: string }>(
    `select author, body, created_at from messages where project_id = $1 order by created_at asc limit 50`, [p.id]
  );
  const docRows = await safeQuery<{ token: string; title: string; signed_at: string | null }>(
    `select pr.token, pr.title, c.signed_at from contracts c join proposals pr on pr.id = c.proposal_id where c.project_id = $1 order by c.signed_at desc`,
    [p.id]
  );

  const paidCents = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount_cents, 0);
  const dueBalance = invoices.find((i) => i.status === "due" && (i.type === "balance" || i.type === "full"));
  const done = phases.filter((x) => x.state === "done").length;
  const pct = phases.length ? Math.round((done / phases.length) * 100) : 0;
  const paidPct = p.total_cents > 0 ? Math.round((paidCents / p.total_cents) * 100) : 0;
  const nextPhase = phases.find((x) => x.state === "active")?.name || phases.find((x) => x.state === "upcoming")?.name || null;

  const invLabel: Record<string, string> = { deposit: "Deposit invoice", balance: "Balance invoice", full: "Full payment" };
  const documents = docRows.flatMap((d) => {
    const out: { label: string; meta: string; href: string | null }[] = [];
    if (d.signed_at) out.push({ label: "Signed agreement", meta: `Signed ${dayMonthYear(d.signed_at)}`, href: `/proposal/${d.token}` });
    out.push({ label: "Project proposal", meta: d.title, href: `/proposal/${d.token}` });
    return out;
  });

  return {
    live: dbConfigured,
    hasProject: true,
    projectId: p.id,
    project: p.name,
    statusLabel: label(p.status),
    phaseLabel: `${p.current_phase}${p.est_launch ? ` · Estimated launch ${dayMonthYear(p.est_launch)}` : ""}`,
    nextPhase,
    pct,
    phases,
    total: gbp(p.total_cents),
    paid: gbp(paidCents),
    outstanding: gbp(p.total_cents - paidCents),
    paidPct,
    balanceInvoiceId: dueBalance?.id ?? null,
    invoices: invoices.map((i) => ({
      id: i.id, label: invLabel[i.type] || i.type, amount: gbp(i.amount_cents),
      status: label(i.status), badge: i.status === "paid" ? "b-ok" : i.status === "due" ? "b-warn" : "b-mute",
    })),
    documents,
    approvals: approvalRows.map((a) => ({ id: a.id, item: a.item, status: a.status, when: dayMonth(a.created_at) })),
    messages: messageRows.map((m) => ({ author: m.author, body: m.body, when: dayMonth(m.created_at) })),
  };
}

