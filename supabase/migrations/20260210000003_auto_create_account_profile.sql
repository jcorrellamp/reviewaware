-- ============================================================
-- Segment 2 — Auto-create account + profile on signup
-- Triggered by insert into auth.users (Supabase auth).
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_account_id uuid;
begin
  -- Create a new account for this user
  insert into public.accounts (id)
  values (gen_random_uuid())
  returning id into new_account_id;

  -- Create the profile linking the auth user to the account
  insert into public.profiles (user_id, account_id)
  values (new.id, new_account_id);

  -- Create default account_settings row
  insert into public.account_settings (account_id)
  values (new_account_id);

  return new;
end;
$$;

-- Trigger fires after a new user is inserted into auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
