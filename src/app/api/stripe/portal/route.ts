import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/stripe/portal
 * Creates a Stripe billing portal session for the current user's account.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    .select("stripe_customer_id")
    .eq("id", profile.account_id)
    .single();

  if (!account?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account. Start a trial first." },
      { status: 400 }
    );
  }

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

  const session = await getStripe().billingPortal.sessions.create({
    customer: account.stripe_customer_id,
    return_url: `${baseUrl}/app/billing`,
  });

  return NextResponse.json({ url: session.url });
}
