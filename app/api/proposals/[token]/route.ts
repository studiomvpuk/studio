import { NextResponse } from "next/server";
import { dbConfigured, query } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Admin: update / adjust a proposal (only while it's unsigned).
export async function PATCH(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Admins only." }, { status: 403 });
  if (!dbConfigured) return NextResponse.json({ error: "Database isn't connected." }, { status: 503 });

  const { token } = await params;
  const rows = await query<{ id: string; status: string }>(`select id, status from proposals where token = $1`, [token]);
  if (!rows.length) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  if (rows[0].status === "signed") {
    return NextResponse.json({ error: "This contract is signed and can't be edited." }, { status: 409 });
  }

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
       where token = $8`,
    [clientName || null, clientEmail, title, scope || null, priceCents, plan, depositPct, token]
  );

  return NextResponse.json({ ok: true });
}
