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
  open: "Unpaid", void: "Void",
  paused: "Paused", ended: "Ended",
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
  documents: { id: string; label: string; url: string; when: string }[];
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
  const docs = await safeQuery<{ id: string; label: string; url: string; created_at: string }>(
    `select id, label, url, created_at from documents where project_id = $1 order by created_at desc`, [id]
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
    documents: docs.map((d) => ({ id: d.id, label: d.label, url: d.url, when: dayMonth(d.created_at) })),
  };
}

/* ───────── CONTRACTS ───────── */
export type AdminProposal = {
  id: string; title: string; client: string; clientName: string; clientEmail: string;
  scope: string; priceCents: number; price: string; paymentPlan: string; depositPct: number;
  status: string; statusLabel: string; rawStatus: string; token: string; when: string;
};
export async function getContracts(): Promise<{
  live: boolean;
  proposals: AdminProposal[];
  signed: { title: string; signer: string; email: string; when: string }[];
}> {
  const proposals = await safeQuery<{ id: string; title: string; client_name: string | null; client_email: string; scope: string | null; price_cents: number; payment_plan: string; deposit_pct: number; status: string; token: string; created_at: string }>(
    `select id, title, client_name, client_email, scope, price_cents, payment_plan, deposit_pct, status, token, created_at from proposals order by created_at desc`
  );
  const signed = await safeQuery<{ title: string; signer_name: string; signer_email: string; signed_at: string }>(
    `select pr.title, c.signer_name, c.signer_email, c.signed_at from contracts c join proposals pr on pr.id = c.proposal_id order by c.signed_at desc`
  );
  const badgeFor = (s: string) => (s === "signed" ? "b-ok" : s === "declined" ? "b-warn" : s === "viewed" || s === "sent" ? "b-info" : "b-mute");
  return {
    live: dbConfigured,
    proposals: proposals.map((p) => ({
      id: p.id, title: p.title, client: p.client_name || p.client_email,
      clientName: p.client_name || "", clientEmail: p.client_email, scope: p.scope || "",
      priceCents: p.price_cents, price: gbp(p.price_cents), paymentPlan: p.payment_plan, depositPct: p.deposit_pct,
      status: badgeFor(p.status), statusLabel: label(p.status), rawStatus: p.status,
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
  dueInvoiceId: string | null;
  dueLabel: string;
  invoices: { id: string; label: string; amount: string; status: string; badge: string }[];
  documents: { label: string; meta: string; href: string | null }[];
  approvals: { id: string; item: string; status: "pending" | "approved" | "changes"; when: string }[];
  messages: ClientMessage[];
};

function emptyClient(live: boolean): ClientData {
  return {
    live, hasProject: false, projectId: null, project: "", statusLabel: "", phaseLabel: "",
    nextPhase: null, pct: 0, phases: [], total: gbp(0), paid: gbp(0), outstanding: gbp(0),
    paidPct: 0, dueInvoiceId: null, dueLabel: "", invoices: [], documents: [], approvals: [], messages: [],
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
  const managedDocs = await safeQuery<{ label: string; url: string; created_at: string }>(
    `select label, url, created_at from documents where project_id = $1 order by created_at desc`, [p.id]
  );

  const paidCents = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount_cents, 0);
  // The next thing the client can pay = the first invoice that's actually due
  // (deposit first, then balance/full once raised).
  const nextDue = invoices.find((i) => i.status === "due");
  const payWord: Record<string, string> = { deposit: "deposit", balance: "balance" };
  const dueLabel = nextDue
    ? `Pay ${payWord[nextDue.type] ? payWord[nextDue.type] + " · " : ""}${gbp(nextDue.amount_cents)} →`
    : "";
  const done = phases.filter((x) => x.state === "done").length;
  const pct = phases.length ? Math.round((done / phases.length) * 100) : 0;
  const paidPct = p.total_cents > 0 ? Math.round((paidCents / p.total_cents) * 100) : 0;
  const nextPhase = phases.find((x) => x.state === "active")?.name || phases.find((x) => x.state === "upcoming")?.name || null;

  const invLabel: Record<string, string> = { deposit: "Deposit invoice", balance: "Balance invoice", full: "Full payment" };
  // Admin-added documents first, then the auto contract/proposal artefacts.
  const documents: { label: string; meta: string; href: string | null }[] = [
    ...managedDocs.map((d) => ({ label: d.label, meta: `Added ${dayMonth(d.created_at)}`, href: d.url })),
    ...docRows.flatMap((d) => {
      const out: { label: string; meta: string; href: string | null }[] = [];
      if (d.signed_at) out.push({ label: "Signed agreement", meta: `Signed ${dayMonthYear(d.signed_at)}`, href: `/proposal/${d.token}` });
      out.push({ label: "Project proposal", meta: d.title, href: `/proposal/${d.token}` });
      return out;
    }),
  ];

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
    dueInvoiceId: nextDue?.id ?? null,
    dueLabel,
    invoices: invoices.map((i) => ({
      id: i.id, label: invLabel[i.type] || i.type, amount: gbp(i.amount_cents),
      status: label(i.status), badge: i.status === "paid" ? "b-ok" : i.status === "due" ? "b-warn" : "b-mute",
    })),
    documents,
    approvals: approvalRows.map((a) => ({ id: a.id, item: a.item, status: a.status, when: dayMonth(a.created_at) })),
    messages: messageRows.map((m) => ({ author: m.author, body: m.body, when: dayMonth(m.created_at) })),
  };
}

/* ───────── PAYMENT LINKS ───────── */
export async function getPaymentLink(token: string): Promise<{ description: string; amount: string; status: string; clientName: string | null } | null> {
  const rows = await safeQuery<{ description: string; amount_cents: number; status: string; client_name: string | null }>(
    `select description, amount_cents, status, client_name from payment_links where token = $1`,
    [token]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return { description: r.description, amount: gbp(r.amount_cents), status: r.status, clientName: r.client_name };
}

export type PaymentLinkRow = { token: string; description: string; amount: string; status: string; badge: string; client: string; when: string };
export async function getPaymentLinks(): Promise<PaymentLinkRow[]> {
  const rows = await safeQuery<{ token: string; description: string; amount_cents: number; status: string; client_email: string | null; created_at: string; paid_at: string | null }>(
    `select token, description, amount_cents, status, client_email, created_at, paid_at from payment_links order by created_at desc limit 50`
  );
  return rows.map((r) => ({
    token: r.token,
    description: r.description,
    amount: gbp(r.amount_cents),
    status: label(r.status),
    badge: r.status === "paid" ? "b-ok" : r.status === "void" ? "b-mute" : "b-warn",
    client: r.client_email || "—",
    when: dayMonth(r.paid_at || r.created_at),
  }));
}

/* ───────── RETAINERS ───────── */
const periodSuffix: Record<string, string> = { monthly: "/mo", quarterly: "/qtr", yearly: "/yr" };
export const periodWord: Record<string, string> = { monthly: "month", quarterly: "quarter", yearly: "year" };

export type RetainerRow = {
  id: string; title: string; client: string; project: string;
  amount: string; period: string; status: string; statusLabel: string; badge: string;
  nextDue: string; collected: string;
  projectId: string | null; amountCents: number; rawPeriod: string; rawStatus: string;
};
export async function getRetainers(): Promise<{ live: boolean; rows: RetainerRow[] }> {
  const rows = await safeQuery<{
    id: string; title: string; amount_cents: number; period: string; status: string; next_due: string | null;
    project_id: string | null; client_name: string | null; client_email: string | null; project_name: string | null; collected: number;
  }>(`
    select r.id, r.title, r.amount_cents, r.period, r.status, r.next_due, r.project_id,
           (select name from users u where u.id = r.client_id) as client_name,
           (select email from users u where u.id = r.client_id) as client_email,
           (select name from projects p where p.id = r.project_id) as project_name,
           coalesce((select sum(amount_cents) from retainer_payments rp where rp.retainer_id = r.id),0) as collected
      from retainers r order by r.created_at desc
  `);
  return {
    live: dbConfigured,
    rows: rows.map((r) => ({
      id: r.id, title: r.title, client: r.client_name || r.client_email || "—", project: r.project_name || "—",
      amount: `${gbp(r.amount_cents)}${periodSuffix[r.period] || ""}`, period: periodWord[r.period] || r.period,
      status: label(r.status), statusLabel: label(r.status),
      badge: r.status === "active" ? "b-ok" : r.status === "paused" ? "b-warn" : "b-mute",
      nextDue: r.status === "active" ? dayMonthYear(r.next_due) : "—", collected: gbp(r.collected),
      projectId: r.project_id, amountCents: r.amount_cents, rawPeriod: r.period, rawStatus: r.status,
    })),
  };
}

export async function getProjectOptions(): Promise<{ id: string; label: string }[]> {
  const rows = await safeQuery<{ id: string; name: string; client: string | null }>(
    `select p.id, p.name, (select name from users u where u.id = p.client_id) as client from projects p order by p.created_at desc`
  );
  return rows.map((p) => ({ id: p.id, label: p.client ? `${p.name} — ${p.client}` : p.name }));
}

export type ClientRetainer = {
  id: string; title: string; amount: string; period: string; status: string; statusLabel: string;
  nextDue: string; active: boolean; payments: { amount: string; label: string; when: string }[];
};
export async function getClientRetainer(clientId?: string): Promise<ClientRetainer | null> {
  if (!clientId || !dbConfigured) return null;
  const rows = await safeQuery<{ id: string; title: string; amount_cents: number; period: string; status: string; next_due: string | null }>(
    `select id, title, amount_cents, period, status, next_due from retainers where client_id = $1 and status <> 'ended' order by created_at desc limit 1`,
    [clientId]
  );
  if (!rows.length) return null;
  const r = rows[0];
  const pays = await safeQuery<{ amount_cents: number; period_label: string | null; paid_at: string }>(
    `select amount_cents, period_label, paid_at from retainer_payments where retainer_id = $1 order by paid_at desc limit 12`,
    [r.id]
  );
  return {
    id: r.id, title: r.title, amount: `${gbp(r.amount_cents)}${periodSuffix[r.period] || ""}`,
    period: periodWord[r.period] || r.period, status: r.status, statusLabel: label(r.status),
    nextDue: dayMonthYear(r.next_due), active: r.status === "active",
    payments: pays.map((p) => ({ amount: gbp(p.amount_cents), label: p.period_label || "Retainer", when: dayMonth(p.paid_at) })),
  };
}

/* ───────── ADMIN MESSAGES (inbox) ───────── */
const whenFull = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export type AdminThread = {
  projectId: string; project: string; client: string;
  last: string; lastAuthor: string; when: string; count: number; awaitingReply: boolean;
};

export async function getAdminThreads(): Promise<{ live: boolean; threads: AdminThread[]; awaiting: number }> {
  const rows = await safeQuery<{
    project_id: string; name: string; client_name: string | null;
    last_body: string; last_author: string; last_at: string; cnt: string;
    last_client_at: string | null; last_team_at: string | null;
  }>(`
    select p.id as project_id, p.name,
           (select name from users u where u.id = p.client_id) as client_name,
           m.body as last_body, m.author as last_author, m.created_at as last_at,
           (select count(*) from messages mm where mm.project_id = p.id) as cnt,
           (select max(created_at) from messages mm where mm.project_id = p.id and mm.author = 'client') as last_client_at,
           (select max(created_at) from messages mm where mm.project_id = p.id and mm.author = 'team') as last_team_at
      from projects p
      join lateral (
        select body, author, created_at from messages where project_id = p.id order by created_at desc limit 1
      ) m on true
     order by m.created_at desc
  `);

  const threads: AdminThread[] = rows.map((r) => ({
    projectId: r.project_id,
    project: r.name,
    client: r.client_name || "—",
    last: r.last_body,
    lastAuthor: r.last_author,
    when: whenFull(r.last_at),
    count: Number(r.cnt),
    awaitingReply: r.last_client_at != null && (r.last_team_at == null || new Date(r.last_client_at) > new Date(r.last_team_at)),
  }));

  return { live: dbConfigured, threads, awaiting: threads.filter((t) => t.awaitingReply).length };
}

export async function getAdminThread(projectId: string): Promise<{ project: string; client: string; messages: ClientMessage[] } | null> {
  const proj = await safeQuery<{ name: string; client_name: string | null }>(
    `select p.name, (select name from users u where u.id = p.client_id) as client_name from projects p where p.id = $1`,
    [projectId]
  );
  if (!proj.length) return null;
  const rows = await safeQuery<{ author: string; body: string; created_at: string }>(
    `select author, body, created_at from messages where project_id = $1 order by created_at asc limit 100`,
    [projectId]
  );
  return {
    project: proj[0].name,
    client: proj[0].client_name || "—",
    messages: rows.map((m) => ({ author: m.author, body: m.body, when: dayMonth(m.created_at) })),
  };
}

