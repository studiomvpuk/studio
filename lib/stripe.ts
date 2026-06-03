import Stripe from "stripe";

export const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!_stripe) {
    // Use the SDK's pinned API version (avoids a literal-type bump on SDK upgrades).
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}
