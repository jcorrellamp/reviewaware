-- ============================================================
-- Segment 2 — Core schema for ReviewAware
-- ============================================================

-- 1. accounts
create table public.accounts (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- 2. profiles  (1-to-1 with auth.users)
create table public.profiles (
  user_id    uuid primary key references auth.users on delete cascade,
  account_id uuid not null references public.accounts on delete cascade,
  created_at timestamptz not null default now()
);

create index idx_profiles_account_id on public.profiles (account_id);

-- 3. locations
create table public.locations (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid not null references public.accounts on delete cascade,
  name            text not null,
  google_place_id text,
  address         text,
  created_at      timestamptz not null default now()
);

create index idx_locations_account_id on public.locations (account_id);

-- 4. contacts
create table public.contacts (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts on delete cascade,
  location_id uuid references public.locations on delete set null,
  full_name   text,
  email       text,
  phone       text,
  created_at  timestamptz not null default now()
);

create index idx_contacts_account_id on public.contacts (account_id);
create index idx_contacts_location_id on public.contacts (location_id);

-- 5. jobs
create table public.jobs (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid not null references public.accounts on delete cascade,
  contact_id      uuid references public.contacts on delete set null,
  completed_at    timestamptz,
  job_external_id text,
  created_at      timestamptz not null default now()
);

create index idx_jobs_account_id on public.jobs (account_id);
create index idx_jobs_contact_id on public.jobs (contact_id);

-- 6. review_requests
create table public.review_requests (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references public.accounts on delete cascade,
  job_id       uuid references public.jobs on delete set null,
  contact_id   uuid references public.contacts on delete set null,
  scheduled_at timestamptz,
  sent_at      timestamptz,
  status       text not null default 'pending',
  created_at   timestamptz not null default now()
);

create index idx_review_requests_account_id on public.review_requests (account_id);
create index idx_review_requests_job_id on public.review_requests (job_id);
create index idx_review_requests_contact_id on public.review_requests (contact_id);

-- 7. link_events
create table public.link_events (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts on delete cascade,
  location_id uuid references public.locations on delete set null,
  contact_id  uuid references public.contacts on delete set null,
  source      text,
  created_at  timestamptz not null default now()
);

create index idx_link_events_account_id on public.link_events (account_id);

-- 8. unsubscribes
create table public.unsubscribes (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts on delete cascade,
  contact_id uuid not null references public.contacts on delete cascade,
  created_at timestamptz not null default now()
);

create index idx_unsubscribes_account_id on public.unsubscribes (account_id);
create index idx_unsubscribes_contact_id on public.unsubscribes (contact_id);

-- 9. account_settings
create table public.account_settings (
  account_id uuid primary key references public.accounts on delete cascade,
  created_at timestamptz not null default now()
);

-- 10. api_keys
create table public.api_keys (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts on delete cascade,
  hashed_key text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index idx_api_keys_account_id on public.api_keys (account_id);
