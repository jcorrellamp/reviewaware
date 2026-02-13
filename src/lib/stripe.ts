import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Lazy-initialized Stripe client. Throws at first use if STRIPE_SECRET_KEY is missing (allows build without env). */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable");
    }
    _stripe = new Stripe(key, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return _stripe;
}

/** Included emails per billing period (base plan). */
export const BASE_QUOTA = 1000;

/** Price env var names mapped to top-up amounts. */
export const TOPUP_PACKS = [
  { emails: 250, envVar: "STRIPE_PRICE_TOPUP_250", label: "+250 emails", price: "$5" },
  { emails: 500, envVar: "STRIPE_PRICE_TOPUP_500", label: "+500 emails", price: "$7" },
  { emails: 1000, envVar: "STRIPE_PRICE_TOPUP_1000", label: "+1,000 emails", price: "$10" },
] as const;

/** Returns the available email quota for an account. */
export function computeAvailable(sentCount: number, topupQuota: number): number {
  return BASE_QUOTA + topupQuota - sentCount;
}

/** Whether the subscription status allows sending. */
export function isSubscriptionActive(status: string): boolean {
  return status === "active" || status === "trialing";
}
