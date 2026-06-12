import { NextResponse } from "next/server";
import { dbConfigured, query } from "@/lib/db";
import { getStripe, stripeConfigured } from "@/lib/stripe";

/**
 * Create a Stripe Checkout session.
 * Body: { invoiceId } (project invoice) OR { paymentLinkToken } (admin-generated
 * link) OR { amount, reference } (marketing pay card).
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
  let paymentLinkId: string | null = null;
  let retainerId: string | null = null;
  let successUrl = `${base}/dashboard?paid=1`;
  let cancelUrl = `${base}/dashboard?canceled=1`;

  if (body.retainerId && dbConfigured) {
    const rows = await query<{ id: string; amount_cents: number; title: string }>(
      `select id, amount_cents, title from retainers where id = $1 and status = 'active'`,
      [String(body.retainerId)]
    );
    if (!rows.length) return NextResponse.json({ error: "Retainer not found or not active." }, { status: 404 });
    amountCents = rows[0].amount_cents;
    reference = `${rows[0].title} — retainer`;
    retainerId = rows[0].id;
    // include the session id so the retainer page can reconcile even if the webhook is delayed/unset
    successUrl = `${base}/dashboard/retainer?paid=1&session_id={CHECKOUT_SESSION_ID}`;
    cancelUrl = `${base}/dashboard/retainer?canceled=1`;
  } else if (body.paymentLinkToken && dbConfigured) {
    const rows = await query<{ id: string; amount_cents: number; description: string; token: string }>(
      `select id, amount_cents, description, token from payment_links where token = $1 and status = 'open'`,
      [String(body.paymentLinkToken)]
    );
    if (!rows.length) return NextResponse.json({ error: "This payment link is invalid or already paid." }, { status: 404 });
    amountCents = rows[0].amount_cents;
    reference = rows[0].description;
    paymentLinkId = rows[0].id;
    successUrl = `${base}/pay/${rows[0].token}?paid=1`;
    cancelUrl = `${base}/pay/${rows[0].token}?canceled=1`;
  } else if (body.invoiceId && dbConfigured) {
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
    metadata: { invoiceId: invoiceId ?? "", paymentLinkId: paymentLinkId ?? "", retainerId: retainerId ?? "", reference },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  if (invoiceId && dbConfigured) {
    await query(`update invoices set stripe_session_id = $1 where id = $2`, [session.id, invoiceId]);
  }
  if (paymentLinkId && dbConfigured) {
    await query(`update payment_links set stripe_session_id = $1 where id = $2`, [session.id, paymentLinkId]);
  }

  return NextResponse.json({ url: session.url });
}
