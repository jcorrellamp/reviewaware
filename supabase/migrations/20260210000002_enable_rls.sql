-- ============================================================
-- Segment 2 — Row-Level Security policies
-- Pattern: allow access only when the authenticated user has a
-- profile row linking them to the same account_id as the row.
-- ============================================================

-- Helper: returns the account_id for the currently authenticated user.
create or replace function public.current_account_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select account_id
    from public.profiles
   where user_id = auth.uid()
   limit 1;
$$;

-- ─── accounts ────────────────────────────────────────────────
alter table public.accounts enable row level security;

create policy "Users can view own account"
  on public.accounts for select
  using (id = public.current_account_id());

create policy "Users can update own account"
  on public.accounts for update
  using (id = public.current_account_id());

-- ─── profiles ────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (user_id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  using (user_id = auth.uid());

-- ─── locations ───────────────────────────────────────────────
alter table public.locations enable row level security;

create policy "Users can view own locations"
  on public.locations for select
  using (account_id = public.current_account_id());

create policy "Users can insert own locations"
  on public.locations for insert
  with check (account_id = public.current_account_id());

create policy "Users can update own locations"
  on public.locations for update
  using (account_id = public.current_account_id());

create policy "Users can delete own locations"
  on public.locations for delete
  using (account_id = public.current_account_id());

-- ─── contacts ────────────────────────────────────────────────
alter table public.contacts enable row level security;

create policy "Users can view own contacts"
  on public.contacts for select
  using (account_id = public.current_account_id());

create policy "Users can insert own contacts"
  on public.contacts for insert
  with check (account_id = public.current_account_id());

create policy "Users can update own contacts"
  on public.contacts for update
  using (account_id = public.current_account_id());

create policy "Users can delete own contacts"
  on public.contacts for delete
  using (account_id = public.current_account_id());

-- ─── jobs ────────────────────────────────────────────────────
alter table public.jobs enable row level security;

create policy "Users can view own jobs"
  on public.jobs for select
  using (account_id = public.current_account_id());

create policy "Users can insert own jobs"
  on public.jobs for insert
  with check (account_id = public.current_account_id());

create policy "Users can update own jobs"
  on public.jobs for update
  using (account_id = public.current_account_id());

create policy "Users can delete own jobs"
  on public.jobs for delete
  using (account_id = public.current_account_id());

-- ─── review_requests ────────────────────────────────────────
alter table public.review_requests enable row level security;

create policy "Users can view own review_requests"
  on public.review_requests for select
  using (account_id = public.current_account_id());

create policy "Users can insert own review_requests"
  on public.review_requests for insert
  with check (account_id = public.current_account_id());

create policy "Users can update own review_requests"
  on public.review_requests for update
  using (account_id = public.current_account_id());

create policy "Users can delete own review_requests"
  on public.review_requests for delete
  using (account_id = public.current_account_id());

-- ─── link_events ─────────────────────────────────────────────
alter table public.link_events enable row level security;

create policy "Users can view own link_events"
  on public.link_events for select
  using (account_id = public.current_account_id());

create policy "Users can insert own link_events"
  on public.link_events for insert
  with check (account_id = public.current_account_id());

-- ─── unsubscribes ────────────────────────────────────────────
alter table public.unsubscribes enable row level security;

create policy "Users can view own unsubscribes"
  on public.unsubscribes for select
  using (account_id = public.current_account_id());

create policy "Users can insert own unsubscribes"
  on public.unsubscribes for insert
  with check (account_id = public.current_account_id());

-- ─── account_settings ───────────────────────────────────────
alter table public.account_settings enable row level security;

create policy "Users can view own account_settings"
  on public.account_settings for select
  using (account_id = public.current_account_id());

create policy "Users can insert own account_settings"
  on public.account_settings for insert
  with check (account_id = public.current_account_id());

create policy "Users can update own account_settings"
  on public.account_settings for update
  using (account_id = public.current_account_id());

-- ─── api_keys ────────────────────────────────────────────────
alter table public.api_keys enable row level security;

create policy "Users can view own api_keys"
  on public.api_keys for select
  using (account_id = public.current_account_id());

create policy "Users can insert own api_keys"
  on public.api_keys for insert
  with check (account_id = public.current_account_id());

create policy "Users can update own api_keys"
  on public.api_keys for update
  using (account_id = public.current_account_id());
