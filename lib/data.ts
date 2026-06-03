import { dbConfigured, safeQuery } from "./db";

const gbp = (cents: number) => "£" + (cents / 100).toLocaleString("en-GB");

export type AdminData = {
  live: boolean;
  stats: { k: string; v: string; delta: string; warn?: boolean }[];
  projects: { name: string; phase: string; pay: string; badge: string; status: string }[];
  leads: { name: string; status: string; est: string }[];
};

export async function getAdminData(): Promise<AdminData> {
  if (!dbConfigured) return { ...demoAdmin, live: false };

  const projects = await safeQuery<{
    name: string; current_phase: string; total_cents: number; paid_cents: number;
  }>(`
    select p.name, p.current_phase, p.total_cents,
           coalesce((select sum(amount_cents) from invoices i where i.project_id = p.id and i.status='paid'),0) as paid_cents
      from projects p where p.status in ('active','signed') order by p.created_at desc
  `);
  const leads = await safeQuery<{ name: string; status: string; est_cents: number | null }>(
    `select name, status, est_cents from leads order by created_at desc limit 6`
  );
  const totals = await safeQuery<{ pipeline: number; collected: number; outstanding: number; active: number }>(`
    select
      coalesce((select sum(est_cents) from leads where status in ('new','call_booked','proposal')),0) as pipeline,
      coalesce((select sum(amount_cents) from invoices where status='paid'),0) as collected,
      coalesce((select sum(amount_cents) from invoices where status='due'),0) as outstanding,
      (select count(*) from projects where status='active') as active
  `);

  if (!projects.length && !leads.length) return { ...demoAdmin, live: dbConfigured };

  const t = totals[0] || { pipeline: 0, collected: 0, outstanding: 0, active: 0 };
  return {
    live: true,
    stats: [
      { k: "Pipeline value", v: gbp(t.pipeline), delta: "leads + proposals" },
      { k: "Collected", v: gbp(t.collected), delta: "paid invoices" },
      { k: "Outstanding", v: gbp(t.outstanding), delta: "balances due", warn: t.outstanding > 0 },
      { k: "Active projects", v: String(t.active), delta: "in production" },
    ],
    projects: projects.map((p) => {
      const paid = p.paid_cents >= p.total_cents && p.total_cents > 0;
      return {
        name: p.name, phase: p.current_phase,
        pay: `${gbp(p.paid_cents)} / ${gbp(p.total_cents)}`,
        badge: paid ? "b-ok" : "b-warn",
        status: paid ? "Paid in full" : "Balance due",
      };
    }),
    leads: leads.map((l) => ({ name: l.name || l.status, status: l.status, est: l.est_cents ? gbp(l.est_cents) : "—" })),
  };
}

export type ClientData = {
  live: boolean;
  project: string;
  phaseLabel: string;
  pct: number;
  phases: { name: string; state: "done" | "active" | "upcoming" }[];
  total: string;
  paid: string;
  outstanding: string;
  balanceInvoiceId: string | null;
};

export async function getClientData(clientId?: string): Promise<ClientData> {
  if (!dbConfigured) return { ...demoClient, live: false };

  const proj = await safeQuery<{ id: string; name: string; current_phase: string; total_cents: number; est_launch: string | null }>(
    clientId
      ? `select id, name, current_phase, total_cents, est_launch from projects where client_id = $1 order by created_at desc limit 1`
      : `select id, name, current_phase, total_cents, est_launch from projects order by created_at desc limit 1`,
    clientId ? [clientId] : []
  );
  if (!proj.length) return { ...demoClient, live: dbConfigured };

  const p = proj[0];
  const phaseRows = await safeQuery<{ name: string; status: "done" | "active" | "upcoming" }>(
    `select name, status from phases where project_id = $1 order by ord`,
    [p.id]
  );
  const phases = phaseRows.map((x) => ({ name: x.name, state: x.status }));
  const invoices = await safeQuery<{ id: string; amount_cents: number; type: string; status: string }>(
    `select id, amount_cents, type, status from invoices where project_id = $1`,
    [p.id]
  );

  const paidCents = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount_cents, 0);
  const dueBalance = invoices.find((i) => i.status === "due" && (i.type === "balance" || i.type === "full"));
  const done = phases.filter((x) => x.state === "done").length;
  const pct = phases.length ? Math.round((done / phases.length) * 100) : 0;

  return {
    live: true,
    project: p.name,
    phaseLabel: `${p.current_phase}${p.est_launch ? ` · Estimated launch ${new Date(p.est_launch).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}`,
    pct,
    phases: phases.length ? phases : demoClient.phases,
    total: gbp(p.total_cents),
    paid: gbp(paidCents),
    outstanding: gbp(p.total_cents - paidCents),
    balanceInvoiceId: dueBalance?.id ?? null,
  };
}

/* ── demo fallbacks (match the original static mockups) ── */
const demoAdmin: AdminData = {
  live: false,
  stats: [
    { k: "Pipeline value", v: "£42,500", delta: "£12k this month" },
    { k: "Collected (MTD)", v: "£18,000", delta: "3 payments" },
    { k: "Outstanding", v: "£9,000", delta: "2 balances due", warn: true },
    { k: "Active projects", v: "4", delta: "1 launching soon" },
  ],
  projects: [
    { name: "NaijaEats", phase: "Build", pay: "£4k / £8k", badge: "b-warn", status: "Balance due" },
    { name: "KinCare", phase: "Design", pay: "£5k / £10k", badge: "b-info", status: "On track" },
    { name: "Mira", phase: "—", pay: "£0 / £6k", badge: "b-warn", status: "Deposit due" },
    { name: "Cove", phase: "Test", pay: "£7k / £7k", badge: "b-ok", status: "Paid in full" },
  ],
  leads: [
    { name: "QuickFix", status: "new", est: "£6k" },
    { name: "Lumi", status: "call_booked", est: "£9k" },
  ],
};

const demoClient: ClientData = {
  live: false,
  project: "NaijaEats — Food delivery app",
  phaseLabel: "Phase 3 of 5 · Estimated launch 12 Aug 2026",
  pct: 62,
  phases: [
    { name: "Discovery & brief", state: "done" },
    { name: "Design", state: "done" },
    { name: "Build", state: "active" },
    { name: "Testing & QA", state: "upcoming" },
    { name: "Launch & handover", state: "upcoming" },
  ],
  total: "£8,000",
  paid: "£4,000",
  outstanding: "£4,000",
  balanceInvoiceId: null,
};
