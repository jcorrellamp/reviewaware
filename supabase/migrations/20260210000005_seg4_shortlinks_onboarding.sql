-- ============================================================
-- Segment 4 — Short links, onboarding, QR
-- Adds business fields + short_code to locations,
-- automation settings to account_settings.
-- ============================================================

-- ─── locations: business details + short link code ──────────
alter table public.locations
  add column short_code        text unique,
  add column business_phone    text,
  add column business_email    text,
  add column google_review_url text,
  add column contact_us_url    text;

create unique index idx_locations_short_code
  on public.locations (short_code)
  where short_code is not null;

-- ─── account_settings: automation defaults ──────────────────
alter table public.account_settings
  add column send_delay_minutes  integer  not null default 60,
  add column reminder1_days      integer  not null default 3,
  add column reminder2_enabled   boolean  not null default true,
  add column reminder2_days      integer  not null default 7,
  add column cooldown_days       integer  not null default 30,
  add column send_window_start   time     not null default '09:00',
  add column send_window_end     time     not null default '19:00';
