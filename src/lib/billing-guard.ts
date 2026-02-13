import { createAdminClient } from "@/lib/supabase/admin";
import { computeAvailable, isSubscriptionActive } from "@/lib/stripe";

export interface BillingStatus {
  eligible: boolean;
  reason?: string;
  subscriptionStatus: string;
  available: number;
}

/**
 * Check whether an account is eligible to send emails.
 * Use in server components / API routes before performing sending actions.
 *
 * @param accountId - The account UUID
 * @returns BillingStatus with eligibility and reason
 */
export async function checkSendEligibility(
  accountId: string
): Promise<BillingStatus> {
  const admin = createAdminClient();
  const { data: account } = await admin
    .from("accounts")
    .select("subscription_status, sent_count, topup_quota")
    .eq("id", accountId)
    .single();

  if (!account) {
    return {
      eligible: false,
      reason: "Account not found",
      subscriptionStatus: "none",
      available: 0,
    };
  }

  const { subscription_status, sent_count, topup_quota } = account;

  if (!isSubscriptionActive(subscription_status)) {
    return {
      eligible: false,
      reason: "Subscription is not active. Please start or renew your subscription.",
      subscriptionStatus: subscription_status,
      available: computeAvailable(sent_count, topup_quota),
    };
  }

  const available = computeAvailable(sent_count, topup_quota);
  if (available <= 0) {
    return {
      eligible: false,
      reason: "Email quota exhausted. Purchase a top-up pack to continue sending.",
      subscriptionStatus: subscription_status,
      available: 0,
    };
  }

  return {
    eligible: true,
    subscriptionStatus: subscription_status,
    available,
  };
}
