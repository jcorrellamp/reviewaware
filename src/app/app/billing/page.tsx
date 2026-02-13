import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BASE_QUOTA, computeAvailable, isSubscriptionActive } from "@/lib/stripe";
import SubscribeButton from "./subscribe-button";
import TopUpButton from "./topup-button";
import ManageBillingButton from "./manage-billing-button";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_id")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/signin");

  const { data: account } = await supabase
    .from("accounts")
    .select(
      "subscription_status, period_start, period_end, sent_count, topup_quota"
    )
    .eq("id", profile.account_id)
    .single();

  const status = account?.subscription_status ?? "none";
  const active = isSubscriptionActive(status);
  const sentCount = account?.sent_count ?? 0;
  const topupQuota = account?.topup_quota ?? 0;
  const available = computeAvailable(sentCount, topupQuota);
  const periodStart = account?.period_start
    ? new Date(account.period_start).toLocaleDateString()
    : "—";
  const periodEnd = account?.period_end
    ? new Date(account.period_end).toLocaleDateString()
    : "—";

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Billing &amp; Quota
      </h1>

      {/* ─── Subscription Status ──────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Subscription
        </h2>
        <dl className="mt-4 space-y-3">
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Status
            </dt>
            <dd className="mt-1">
              <StatusBadge status={status} />
            </dd>
          </div>
          {active && (
            <>
              <div>
                <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Current Period
                </dt>
                <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                  {periodStart} — {periodEnd}
                </dd>
              </div>
            </>
          )}
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          {!active && <SubscribeButton />}
          {active && <ManageBillingButton />}
        </div>
      </div>

      {/* ─── Quota ────────────────────────────────────────────── */}
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Email Quota
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <QuotaStat label="Base Included" value={BASE_QUOTA.toLocaleString()} />
          <QuotaStat label="Top-up Bonus" value={topupQuota.toLocaleString()} />
          <QuotaStat label="Sent This Period" value={sentCount.toLocaleString()} />
          <QuotaStat
            label="Available"
            value={Math.max(0, available).toLocaleString()}
            highlight={available <= 0}
          />
        </dl>

        {active && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Purchase Top-Up Packs
            </h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              One-time, stackable. Expire at the end of the current billing
              period.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <TopUpButton emails={250} label="+250 emails" price="$5" />
              <TopUpButton emails={500} label="+500 emails" price="$7" />
              <TopUpButton emails={1000} label="+1,000 emails" price="$10" />
            </div>
          </div>
        )}

        {!active && (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Start a subscription to unlock email sending and top-ups.
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    trialing:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    past_due:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    canceled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    none: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  };
  const label: Record<string, string> = {
    active: "Active",
    trialing: "Trial",
    past_due: "Past Due",
    canceled: "Canceled",
    none: "No Subscription",
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? colors.none}`}
    >
      {label[status] ?? status}
    </span>
  );
}

function QuotaStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd
        className={`mt-1 text-2xl font-bold ${
          highlight
            ? "text-red-600 dark:text-red-400"
            : "text-zinc-900 dark:text-zinc-100"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
