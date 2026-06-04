import { NextResponse } from "next/server";
import { dbConfigured, query } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Admin: update / adjust a proposal or a signed contract.
export async function PATCH(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Admins only." }, { status: 403 });
  if (!dbConfigured) return NextResponse.json({ error: "Database isn't connected." }, { status: 503 });

  const { token } = await params;
  const rows = await query<{ id: string; status: string }>(`select id, status from proposals where token = $1`, [token]);
  if (!rows.length) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  const proposalId = rows[0].id;
  const wasSigned = rows[0].status === "signed";

  const b = await req.json().catch(() => ({}));
  const clientName = String(b.clientName || "").trim();
  const clientEmail = String(b.clientEmail || "").trim();
  const title = String(b.title || "").trim();
  const scope = String(b.scope || "").trim();
  const priceCents = Math.round(Number(b.priceGBP) * 100);
  const plan = ["full", "deposit", "milestones"].includes(b.paymentPlan) ? b.paymentPlan : "deposit";
  const depositPct = Math.min(90, Math.max(10, Number(b.depositPct) || 50));

  if (!clientEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clientEmail)) {
    return NextResponse.json({ error: "Valid client email required." }, { status: 400 });
  }
  if (!title || !Number.isFinite(priceCents) || priceCents < 100) {
    return NextResponse.json({ error: "Title and a valid price are required." }, { status: 400 });
  }

  await query(
    `update proposals set client_name = $1, client_email = $2, title = $3, scope = $4,
            price_cents = $5, payment_plan = $6, deposit_pct = $7
       where id = $8`,
    [clientName || null, clientEmail, title, scope || null, priceCents, plan, depositPct, proposalId]
  );

  // If this is a signed contract, keep the live project + unpaid invoices in sync
  // so the client's dashboard reflects the renegotiated terms.
  if (wasSigned) {
    const link = await query<{ project_id: string | null }>(
      `select project_id from contracts where proposal_id = $1 order by signed_at desc limit 1`,
      [proposalId]
    );
    const projectId = link[0]?.project_id;
    if (projectId) {
      await query(`update projects set name = $1, total_cents = $2, deposit_pct = $3 where id = $4`, [title, priceCents, depositPct, projectId]);

      const invs = await query<{ id: string; amount_cents: number; type: string; status: string }>(
        `select id, amount_cents, type, status from invoices where project_id = $1`, [projectId]
      );
      const paidSum = invs.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount_cents, 0);
      const unpaidDeposit = invs.find((i) => i.type === "deposit" && i.status !== "paid");
      const unpaidBalance = invs.find((i) => (i.type === "balance" || i.type === "full") && i.status !== "paid");
      const deposit = Math.round((priceCents * depositPct) / 100);

      if (unpaidDeposit) {
        await query(`update invoices set amount_cents = $1 where id = $2`, [deposit, unpaidDeposit.id]);
        if (unpaidBalance) await query(`update invoices set amount_cents = $1 where id = $2`, [Math.max(0, priceCents - deposit), unpaidBalance.id]);
      } else if (unpaidBalance) {
        // deposit already paid (or none) → the remaining invoice covers the new balance
        await query(`update invoices set amount_cents = $1 where id = $2`, [Math.max(0, priceCents - paidSum), unpaidBalance.id]);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
