import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { dbConfigured, query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { dispatch } from "@/lib/automations";

// Admin: create + send a proposal.
export async function POST(req: Request) {
  const session = await getSession();
  if (dbConfigured && session?.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
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

  const token = randomBytes(24).toString("hex");
  const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;

  if (!dbConfigured) {
    return NextResponse.json({ ok: true, demo: true, url: `${base}/proposal/${token}` });
  }

  await query(
    `insert into proposals (client_email, client_name, title, scope, price_cents, payment_plan, deposit_pct, status, token)
     values ($1,$2,$3,$4,$5,$6,$7,'sent',$8)`,
    [clientEmail, clientName || null, title, scope || null, priceCents, plan, depositPct, token]
  );
  await dispatch("proposal.sent", { email: clientEmail, name: clientName || "there", token });

  return NextResponse.json({ ok: true, url: `${base}/proposal/${token}` });
}
