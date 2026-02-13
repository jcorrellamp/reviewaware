import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, TOPUP_PACKS, isSubscriptionActive } from "@/lib/stripe";

/**
 * POST /api/stripe/topup
 * Body: { "emails": 250 | 500 | 1000 }
 * Creates a one-time Checkout session for a top-up pack.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { emails?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pack = TOPUP_PACKS.find((p) => p.emails === body.emails);
  if (!pack) {
    return NextResponse.json(
      { error: "Invalid pack. Choose 250, 500, or 1000." },
      { status: 400 }
    );
  }

  const priceId = process.env[pack.envVar];
  if (!priceId) {
    return NextResponse.json(
      { error: `${pack.envVar} not configured` },
      { status: 500 }
    );
  }

  // Look up account
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

  if (!isSubscriptionActive(account.subscription_status)) {
    return NextResponse.json(
      { error: "Active subscription required to purchase top-ups." },
      { status: 400 }
    );
  }

  if (!account.stripe_customer_id) {
    return NextResponse.json(
      { error: "No Stripe customer on file." },
      { status: 400 }
    );
  }

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    customer: account.stripe_customer_id,
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      account_id: account.id,
      topup_emails: String(pack.emails),
    },
    success_url: `${baseUrl}/app/billing?topup=success`,
    cancel_url: `${baseUrl}/app/billing`,
  });

  return NextResponse.json({ url: session.url });
}
