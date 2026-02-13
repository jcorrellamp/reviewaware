import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for the base subscription ($19/mo, 14-day trial).
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look up account via profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "No account found" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: account } = await admin
    .from("accounts")
    .select("id, stripe_customer_id, subscription_status")
    .eq("id", profile.account_id)
    .single();

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 400 });
  }

  // Don't allow checkout if already subscribed
  if (
    account.subscription_status === "active" ||
    account.subscription_status === "trialing"
  ) {
    return NextResponse.json(
      { error: "Already subscribed. Use the billing portal to manage." },
      { status: 400 }
    );
  }

  // Create or reuse Stripe customer
  let customerId = account.stripe_customer_id;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email ?? undefined,
      metadata: { account_id: account.id },
    });
    customerId = customer.id;

    await admin
      .from("accounts")
      .update({ stripe_customer_id: customerId })
      .eq("id", account.id);
  }

  const priceId = process.env.STRIPE_PRICE_BASE_MONTHLY;
  if (!priceId) {
    return NextResponse.json(
      { error: "STRIPE_PRICE_BASE_MONTHLY not configured" },
      { status: 500 }
    );
  }

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { account_id: account.id },
    },
    success_url: `${baseUrl}/app/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/app/billing`,
  });

  return NextResponse.json({ url: session.url });
}
