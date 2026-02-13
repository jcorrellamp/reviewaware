import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events for subscription and top-up lifecycle.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const headerStore = await headers();
  const sig = headerStore.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    // ─── Subscription created or updated ──────────────────────
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const accountId =
        subscription.metadata?.account_id ??
        (await lookupAccountByCustomer(admin, customerId));

      if (!accountId) {
        console.error("No account for customer", customerId);
        break;
      }

      // In the 2026-01-28 API, current_period is on SubscriptionItem
      const firstItem = subscription.items?.data?.[0];
      const periodStart = firstItem?.current_period_start;
      const periodEnd = firstItem?.current_period_end;

      const prevPeriodStart = await getPreviousPeriodStart(admin, accountId);
      const newPeriodStart = periodStart
        ? new Date(periodStart * 1000).toISOString()
        : null;

      const updates: Record<string, unknown> = {
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
      };

      if (newPeriodStart) {
        updates.period_start = newPeriodStart;
      }
      if (periodEnd) {
        updates.period_end = new Date(periodEnd * 1000).toISOString();
      }

      // Reset counters when a new billing period starts
      if (
        prevPeriodStart &&
        newPeriodStart &&
        prevPeriodStart !== newPeriodStart
      ) {
        updates.sent_count = 0;
        updates.topup_quota = 0;
      }

      await admin.from("accounts").update(updates).eq("id", accountId);
      break;
    }

    // ─── Subscription deleted ─────────────────────────────────
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const accountId =
        subscription.metadata?.account_id ??
        (await lookupAccountByCustomer(admin, customerId));

      if (accountId) {
        await admin
          .from("accounts")
          .update({ subscription_status: "canceled" })
          .eq("id", accountId);
      }
      break;
    }

    // ─── One-time top-up payment succeeded ────────────────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Only handle one-time payment (top-ups)
      if (session.mode !== "payment") break;

      const accountId = session.metadata?.account_id;
      const topupEmails = parseInt(session.metadata?.topup_emails ?? "0", 10);

      if (!accountId || !topupEmails) {
        console.error("Top-up checkout missing metadata", session.id);
        break;
      }

      // Increment topup_quota
      const { data: account } = await admin
        .from("accounts")
        .select("topup_quota")
        .eq("id", accountId)
        .single();

      if (account) {
        await admin
          .from("accounts")
          .update({ topup_quota: account.topup_quota + topupEmails })
          .eq("id", accountId);
      }
      break;
    }

    // ─── Invoice paid — also fires on renewal ─────────────────
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;

      // Get the subscription from the new parent.subscription_details
      const subDetails = invoice.parent?.subscription_details;
      if (!subDetails) break;

      const subscriptionId =
        typeof subDetails.subscription === "string"
          ? subDetails.subscription
          : subDetails.subscription.id;

      const subscription =
        await getStripe().subscriptions.retrieve(subscriptionId);

      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const accountId =
        subscription.metadata?.account_id ??
        (await lookupAccountByCustomer(admin, customerId));

      if (!accountId) break;

      // Use invoice period_start/period_end as authoritative for the billing period
      const prevPeriodStart = await getPreviousPeriodStart(admin, accountId);
      const newPeriodStart = new Date(
        invoice.period_start * 1000
      ).toISOString();

      const updates: Record<string, unknown> = {
        subscription_status: subscription.status,
        period_start: newPeriodStart,
        period_end: new Date(invoice.period_end * 1000).toISOString(),
      };

      // New period → reset counters
      if (prevPeriodStart && prevPeriodStart !== newPeriodStart) {
        updates.sent_count = 0;
        updates.topup_quota = 0;
      }

      await admin.from("accounts").update(updates).eq("id", accountId);
      break;
    }

    default:
      // Unhandled event type — that's fine
      break;
  }

  return NextResponse.json({ received: true });
}

// ─── Helpers ──────────────────────────────────────────────────

async function lookupAccountByCustomer(
  admin: ReturnType<typeof createAdminClient>,
  customerId: string
): Promise<string | null> {
  const { data } = await admin
    .from("accounts")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();
  return data?.id ?? null;
}

async function getPreviousPeriodStart(
  admin: ReturnType<typeof createAdminClient>,
  accountId: string
): Promise<string | null> {
  const { data } = await admin
    .from("accounts")
    .select("period_start")
    .eq("id", accountId)
    .single();
  return data?.period_start ?? null;
}
