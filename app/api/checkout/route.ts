import { NextResponse } from "next/server";
import { dbConfigured, query } from "@/lib/db";
import { getStripe, stripeConfigured } from "@/lib/stripe";

/**
 * Create a Stripe Checkout session for an invoice.
 * Body: { invoiceId } (preferred) OR { amount, reference } for the marketing pay card.
 */
export async function POST(req: Request) {
  if (!stripeConfigured) {
    return NextResponse.json(
      { error: "Payments aren't configured yet. Set STRIPE_SECRET_KEY." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  const stripe = getStripe();

  let amountCents: number;
  let reference: string;
  let invoiceId: string | null = null;

  if (body.invoiceId && dbConfigured) {
    const rows = await query<{ id: string; amount_cents: number; type: string; project: string }>(
      `select i.id, i.amount_cents, i.type, p.name as project
         from invoices i join projects p on p.id = i.project_id
        where i.id = $1 and i.status = 'due'`,
      [body.invoiceId]
    );
    if (!rows.length) return NextResponse.json({ error: "Invoice not found or already paid." }, { status: 404 });
    amountCents = rows[0].amount_cents;
    reference = `${rows[0].project} — ${rows[0].type} invoice`;
    invoiceId = rows[0].id;
  } else {
    amountCents = Math.round(Number(body.amount) * 100);
    reference = String(body.reference || "StudioMVP payment");
    if (!Number.isFinite(amountCents) || amountCents < 100) {
      return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: { name: reference },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: { invoiceId: invoiceId ?? "", reference },
    success_url: `${base}/dashboard?paid=1`,
    cancel_url: `${base}/dashboard?canceled=1`,
  });

  if (invoiceId && dbConfigured) {
    await query(`update invoices set stripe_session_id = $1 where id = $2`, [session.id, invoiceId]);
  }

  return NextResponse.json({ url: session.url });
}
