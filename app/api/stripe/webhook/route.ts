import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { dbConfigured, query } from "@/lib/db";
import { getStripe, stripeConfigured } from "@/lib/stripe";

// Stripe needs the raw body to verify the signature.
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!stripeConfigured || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig as string, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature failed: ${(err as Error).message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = session.metadata?.invoiceId;

    if (dbConfigured && invoiceId) {
      // Never trust amount/state from the client — driven by the verified webhook.
      const inv = await query<{ id: string; project_id: string; type: string }>(
        `update invoices
            set status = 'paid', paid_at = now(),
                stripe_payment_intent = $2
          where id = $1
        returning id, project_id, type`,
        [invoiceId, String(session.payment_intent ?? "")]
      );

      if (inv.length) {
        const { project_id, type } = inv[0];
        await query(`insert into events (type, payload) values ('invoice.paid', $1)`, [
          JSON.stringify({ invoiceId, type, project_id }),
        ]);

        // Auto: deposit paid → activate project; balance paid → mark project completed-ready.
        if (type === "deposit") {
          await query(`update projects set status = 'active' where id = $1 and status = 'signed'`, [project_id]);
        }
        if (type === "balance" || type === "full") {
          await query(`insert into events (type, payload) values ('project.balance_settled', $1)`, [
            JSON.stringify({ project_id }),
          ]);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
