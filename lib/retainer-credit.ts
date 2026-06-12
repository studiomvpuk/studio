import { dbConfigured, query } from "./db";
import { getStripe, stripeConfigured } from "./stripe";
import { dispatch } from "./automations";

/**
 * Record a single retainer period payment and roll `next_due` forward.
 * Idempotent: keyed on the Stripe payment_intent, so the webhook AND the
 * return-from-checkout reconciliation can both run without double-counting.
 * Returns true if it actually recorded a new payment.
 */
export async function creditRetainerPayment(retainerId: string, paymentIntent: string): Promise<boolean> {
  if (!dbConfigured || !retainerId) return false;

  // Already recorded by the other path? Skip.
  if (paymentIntent) {
    const existing = await query(
      `select 1 from retainer_payments where retainer_id = $1 and stripe_payment_intent = $2 limit 1`,
      [retainerId, paymentIntent]
    );
    if (existing.length) return false;
  }

  const r = await query<{ amount_cents: number; period: string; email: string | null; name: string | null }>(
    `select r.amount_cents, r.period,
            (select email from users u where u.id = r.client_id) as email,
            (select name  from users u where u.id = r.client_id) as name
       from retainers r where r.id = $1`,
    [retainerId]
  );
  if (!r.length) return false;

  await query(
    `insert into retainer_payments (retainer_id, amount_cents, period_label, stripe_payment_intent)
     select id, amount_cents, to_char(coalesce(next_due, current_date), 'FMMon YYYY'), $2 from retainers where id = $1`,
    [retainerId, paymentIntent]
  );
  await query(
    `update retainers set next_due = (greatest(coalesce(next_due, current_date), current_date)
       + case period when 'yearly' then interval '1 year' when 'halfyearly' then interval '6 months' when 'quarterly' then interval '3 months' else interval '1 month' end)::date
     where id = $1`,
    [retainerId]
  );
  await dispatch("invoice.paid", { retainerId, reference: "retainer", email: r[0].email, name: r[0].name || "there" });
  return true;
}

/**
 * Recovery / safety net: scan recent Stripe Checkout Sessions and credit any
 * paid retainer payment that hasn't been recorded yet (e.g. made while the
 * webhook was misconfigured). Idempotent. Returns how many it newly recorded.
 */
export async function syncRetainersFromStripe(): Promise<number> {
  if (!stripeConfigured || !dbConfigured) return 0;
  const stripe = getStripe();
  let credited = 0;
  const sessions = await stripe.checkout.sessions.list({ limit: 100 });
  for (const s of sessions.data) {
    const retainerId = s.metadata?.retainerId;
    if (retainerId && s.payment_status === "paid") {
      if (await creditRetainerPayment(retainerId, String(s.payment_intent ?? ""))) credited++;
    }
  }
  return credited;
}

/**
 * Fallback for when the Stripe webhook is delayed or not configured: when the
 * client returns to the retainer page after paying, verify the Checkout Session
 * straight from Stripe and credit it. Safe to call on every page load — it no-ops
 * unless the session is genuinely paid and not yet recorded.
 */
export async function confirmRetainerSession(sessionId: string): Promise<boolean> {
  if (!sessionId || !stripeConfigured || !dbConfigured) return false;
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const retainerId = session.metadata?.retainerId;
    if (!retainerId || session.payment_status !== "paid") return false;
    return await creditRetainerPayment(retainerId, String(session.payment_intent ?? ""));
  } catch (err) {
    console.warn("[retainer confirm] failed:", (err as Error).message);
    return false;
  }
}
