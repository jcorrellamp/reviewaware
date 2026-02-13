-- ============================================================
-- Segment 3 — Billing & quota fields on accounts
-- ============================================================

alter table public.accounts
  add column stripe_customer_id    text unique,
  add column stripe_subscription_id text unique,
  add column subscription_status   text not null default 'none',
  add column period_start          timestamptz,
  add column period_end            timestamptz,
  add column sent_count            integer not null default 0,
  add column topup_quota           integer not null default 0;

-- Index for webhook lookups by Stripe customer / subscription
create index idx_accounts_stripe_customer_id on public.accounts (stripe_customer_id);
create index idx_accounts_stripe_subscription_id on public.accounts (stripe_subscription_id);

comment on column public.accounts.subscription_status is
  'Stripe subscription status: none | trialing | active | past_due | canceled | unpaid';

comment on column public.accounts.sent_count is
  'Emails sent in the current billing period';

comment on column public.accounts.topup_quota is
  'Additional emails purchased via top-up packs for the current period';
