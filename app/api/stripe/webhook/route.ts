import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { dbConfigured, query } from "@/lib/db";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { dispatch } from "@/lib/automations";

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
    const paymentLinkId = session.metadata?.paymentLinkId;

    // Admin-generated payment link → mark it paid.
    if (dbConfigured && paymentLinkId) {
      const rows = await query<{ id: string; description: string; client_email: string | null; client_name: string | null }>(
        `update payment_links set status = 'paid', paid_at = now(), stripe_payment_intent = $2
          where id = $1 and status = 'open'
        returning id, description, client_email, client_name`,
        [paymentLinkId, String(session.payment_intent ?? "")]
      );
      if (rows.length) {
        await dispatch("invoice.paid", {
          paymentLinkId,
          reference: rows[0].description,
          email: rows[0].client_email,
          name: rows[0].client_name || "there",
        });
      }
    }

    if (dbConfigured && invoiceId) {
      // Never trust amount/state from the client — driven by the verified webhook.
      const inv = await query<{ id: string; project_id: string; type: string; email: string | null; name: string | null }>(
        `update invoices i
            set status = 'paid', paid_at = now(), stripe_payment_intent = $2
           from projects p left join users u on u.id = p.client_id
          where i.id = $1 and p.id = i.project_id
        returning i.id, i.project_id, i.type, u.email, u.name`,
        [invoiceId, String(session.payment_intent ?? "")]
      );

      if (inv.length) {
        const { project_id, type, email, name } = inv[0];
        await dispatch("invoice.paid", { invoiceId, type, project_id, email, name: name || "there" });

        // Auto: deposit paid → activate project + raise the balance so the
        // client can pay it next.
        if (type === "deposit") {
          await query(`update projects set status = 'active' where id = $1 and status = 'signed'`, [project_id]);
          await query(`update invoices set status = 'due' where project_id = $1 and type = 'balance' and status = 'draft'`, [project_id]);
          await dispatch("project.activated", { project_id });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
