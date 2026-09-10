-- Eastside Legends Sim — E$L coin$ side-bet challenges
-- User-facing label: "E$L coin$" (exact). Tables/RPCs: eesl_*.
-- Run in Supabase SQL Editor for project yqnbeksemcgmggframnd.
-- Client uses anon key only — no service role in the app.
-- Depends on: league_chat_members + is_eastside_chat_member (league-chat.sql)
--
-- Balance rule: every signed-in user starts with 100 E$L ONCE.
-- ensure_eesl_balance INSERTS 100 only when no row exists — never adds +100 again.
-- Matches client STARTING_BANKROLL = 100 in src/lib/betting/store.ts.
-- Simulation only — not real money.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Balances (one row per user; seed 100 once)
-- ---------------------------------------------------------------------------
create table if not exists public.eesl_balances (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance numeric(12,2) not null default 100 check (balance >= 0),
  updated_at timestamptz not null default now()
);

alter table public.eesl_balances enable row level security;

drop policy if exists eesl_balances_select on public.eesl_balances;
create policy eesl_balances_select
  on public.eesl_balances for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists eesl_balances_update on public.eesl_balances;
create policy eesl_balances_update
  on public.eesl_balances for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Insert own row on first touch (defense in depth; prefer ensure_eesl_balance RPC)
drop policy if exists eesl_balances_insert on public.eesl_balances;
create policy eesl_balances_insert
  on public.eesl_balances for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Challenges
-- ---------------------------------------------------------------------------
create table if not exists public.eesl_challenges (
  id uuid primary key default gen_random_uuid(),
  league_id text not null default 'eastside-legends',
  challenger_id uuid not null references auth.users (id),
  opponent_id uuid not null references auth.users (id),
  stake numeric(12,2) not null check (stake > 0),
  terms text not null check (char_length(trim(terms)) > 0 and char_length(terms) <= 280),
  status text not null check (status in ('open','accepted','declined','settled','canceled')),
  winner_id uuid null references auth.users (id), -- null if push / unsettled
  settled_as text null check (settled_as is null or settled_as in ('challenger','opponent','push')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (challenger_id <> opponent_id)
);

create index if not exists eesl_challenges_league_status_idx
  on public.eesl_challenges (league_id, status, created_at desc);

create index if not exists eesl_challenges_challenger_idx
  on public.eesl_challenges (challenger_id, created_at desc);

create index if not exists eesl_challenges_opponent_idx
  on public.eesl_challenges (opponent_id, created_at desc);

alter table public.eesl_challenges enable row level security;

-- Participants can select their challenges
drop policy if exists eesl_challenges_select on public.eesl_challenges;
create policy eesl_challenges_select
  on public.eesl_challenges for select
  to authenticated
  using (
    auth.uid() = challenger_id
    or auth.uid() = opponent_id
  );

-- Challenger insert (RPC preferred; policy is defense in depth)
drop policy if exists eesl_challenges_insert on public.eesl_challenges;
create policy eesl_challenges_insert
  on public.eesl_challenges for insert
  to authenticated
  with check (
    auth.uid() = challenger_id
    and public.is_eastside_chat_member(league_id)
  );

-- Opponent accept/decline; either participant settle when accepted; challenger cancel open
-- Direct client updates are limited; balance-moving paths must use RPCs below.
drop policy if exists eesl_challenges_update on public.eesl_challenges;
create policy eesl_challenges_update
  on public.eesl_challenges for update
  to authenticated
  using (
    auth.uid() = challenger_id
    or auth.uid() = opponent_id
  )
  with check (
    auth.uid() = challenger_id
    or auth.uid() = opponent_id
  );

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.eesl_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists eesl_balances_touch on public.eesl_balances;
create trigger eesl_balances_touch
  before update on public.eesl_balances
  for each row execute function public.eesl_touch_updated_at();

drop trigger if exists eesl_challenges_touch on public.eesl_challenges;
create trigger eesl_challenges_touch
  before update on public.eesl_challenges
  for each row execute function public.eesl_touch_updated_at();

-- Lock + read balance row (must already exist)
create or replace function public._eesl_lock_balance(p_user uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  bal numeric(12,2);
begin
  select balance into bal
  from public.eesl_balances
  where user_id = p_user
  for update;
  if bal is null then
    raise exception 'eesl_balance_missing';
  end if;
  return bal;
end;
$$;

revoke all on function public._eesl_lock_balance(uuid) from public;

-- ---------------------------------------------------------------------------
-- ensure_eesl_balance() → numeric
-- Create row with 100 ONLY if missing. Never credit +100 again on later calls.
-- ---------------------------------------------------------------------------
create or replace function public.ensure_eesl_balance()
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  bal numeric(12,2);
begin
  if uid is null then
    raise exception 'eesl_unauth';
  end if;

  select balance into bal
  from public.eesl_balances
  where user_id = uid;

  if bal is not null then
    return bal;
  end if;

  -- First touch only: seed STARTING_BANKROLL = 100 (never re-add)
  insert into public.eesl_balances (user_id, balance)
  values (uid, 100)
  on conflict (user_id) do nothing;

  select balance into bal
  from public.eesl_balances
  where user_id = uid;

  return bal;
end;
$$;

revoke all on function public.ensure_eesl_balance() from public;
grant execute on function public.ensure_eesl_balance() to authenticated;

-- ---------------------------------------------------------------------------
-- create_eesl_challenge(opponent, stake, terms) → uuid
-- RULE: check challenger balance >= stake but do NOT deduct until accept.
-- ---------------------------------------------------------------------------
create or replace function public.create_eesl_challenge(
  p_opponent uuid,
  p_stake numeric,
  p_terms text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  bal numeric(12,2);
  trimmed text := trim(coalesce(p_terms, ''));
  new_id uuid;
begin
  if uid is null then
    raise exception 'eesl_unauth';
  end if;

  if p_opponent is null or p_opponent = uid then
    raise exception 'eesl_invalid_opponent';
  end if;

  if p_stake is null or p_stake <= 0 then
    raise exception 'eesl_invalid_stake';
  end if;

  if char_length(trimmed) = 0 or char_length(trimmed) > 280 then
    raise exception 'eesl_invalid_terms';
  end if;

  if not public.is_eastside_chat_member('eastside-legends') then
    raise exception 'eesl_not_member';
  end if;

  -- Opponent must also be a chat member
  if not exists (
    select 1 from public.league_chat_members
    where league_id = 'eastside-legends' and user_id = p_opponent
  ) then
    raise exception 'eesl_opponent_not_member';
  end if;

  -- Ensure own balance row exists (100 once), then check funds — no deduct yet
  bal := public.ensure_eesl_balance();
  if bal < p_stake then
    raise exception 'eesl_insufficient';
  end if;

  insert into public.eesl_challenges (
    league_id, challenger_id, opponent_id, stake, terms, status
  ) values (
    'eastside-legends', uid, p_opponent, p_stake, trimmed, 'open'
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.create_eesl_challenge(uuid, numeric, text) from public;
grant execute on function public.create_eesl_challenge(uuid, numeric, text) to authenticated;

-- ---------------------------------------------------------------------------
-- accept_eesl_challenge(id)
-- Each puts up `stake`; pot = 2*stake. Reject if either insufficient.
-- ---------------------------------------------------------------------------
create or replace function public.accept_eesl_challenge(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  ch public.eesl_challenges%rowtype;
  bal_c numeric(12,2);
  bal_o numeric(12,2);
begin
  if uid is null then
    raise exception 'eesl_unauth';
  end if;

  select * into ch
  from public.eesl_challenges
  where id = p_id
  for update;

  if not found then
    raise exception 'eesl_not_found';
  end if;

  if ch.status <> 'open' then
    raise exception 'eesl_bad_status';
  end if;

  if uid <> ch.opponent_id then
    raise exception 'eesl_forbidden';
  end if;

  -- Ensure both have balance rows (seed 100 once each if missing)
  perform public.ensure_eesl_balance();
  -- Opponent just ensured; seed challenger row if somehow missing without changing amount
  insert into public.eesl_balances (user_id, balance)
  values (ch.challenger_id, 100)
  on conflict (user_id) do nothing;

  bal_c := public._eesl_lock_balance(ch.challenger_id);
  bal_o := public._eesl_lock_balance(ch.opponent_id);

  if bal_c < ch.stake then
    raise exception 'eesl_challenger_insufficient';
  end if;
  if bal_o < ch.stake then
    raise exception 'eesl_insufficient';
  end if;

  update public.eesl_balances
  set balance = balance - ch.stake
  where user_id = ch.challenger_id;

  update public.eesl_balances
  set balance = balance - ch.stake
  where user_id = ch.opponent_id;

  update public.eesl_challenges
  set status = 'accepted'
  where id = p_id;
end;
$$;

revoke all on function public.accept_eesl_challenge(uuid) from public;
grant execute on function public.accept_eesl_challenge(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- decline_eesl_challenge(id) — opponent only; no balance change
-- ---------------------------------------------------------------------------
create or replace function public.decline_eesl_challenge(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  ch public.eesl_challenges%rowtype;
begin
  if uid is null then
    raise exception 'eesl_unauth';
  end if;

  select * into ch
  from public.eesl_challenges
  where id = p_id
  for update;

  if not found then
    raise exception 'eesl_not_found';
  end if;

  if ch.status <> 'open' then
    raise exception 'eesl_bad_status';
  end if;

  if uid <> ch.opponent_id then
    raise exception 'eesl_forbidden';
  end if;

  update public.eesl_challenges
  set status = 'declined'
  where id = p_id;
end;
$$;

revoke all on function public.decline_eesl_challenge(uuid) from public;
grant execute on function public.decline_eesl_challenge(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- cancel_eesl_challenge(id) — challenger only while open; no balance change
-- ---------------------------------------------------------------------------
create or replace function public.cancel_eesl_challenge(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  ch public.eesl_challenges%rowtype;
begin
  if uid is null then
    raise exception 'eesl_unauth';
  end if;

  select * into ch
  from public.eesl_challenges
  where id = p_id
  for update;

  if not found then
    raise exception 'eesl_not_found';
  end if;

  if ch.status <> 'open' then
    raise exception 'eesl_bad_status';
  end if;

  if uid <> ch.challenger_id then
    raise exception 'eesl_forbidden';
  end if;

  update public.eesl_challenges
  set status = 'canceled'
  where id = p_id;
end;
$$;

revoke all on function public.cancel_eesl_challenge(uuid) from public;
grant execute on function public.cancel_eesl_challenge(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- settle_eesl_challenge(id, result) — challenger|opponent|push
-- Only participants; status must be accepted.
-- Winner gets 2*stake; push refunds stake to each.
-- ---------------------------------------------------------------------------
create or replace function public.settle_eesl_challenge(
  p_id uuid,
  p_result text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  ch public.eesl_challenges%rowtype;
  res text := lower(trim(coalesce(p_result, '')));
  pot numeric(12,2);
  win uuid;
begin
  if uid is null then
    raise exception 'eesl_unauth';
  end if;

  if res not in ('challenger', 'opponent', 'push') then
    raise exception 'eesl_invalid_result';
  end if;

  select * into ch
  from public.eesl_challenges
  where id = p_id
  for update;

  if not found then
    raise exception 'eesl_not_found';
  end if;

  if ch.status <> 'accepted' then
    raise exception 'eesl_bad_status';
  end if;

  if uid <> ch.challenger_id and uid <> ch.opponent_id then
    raise exception 'eesl_forbidden';
  end if;

  -- Ensure rows exist (no re-seed of funds beyond missing-row insert)
  insert into public.eesl_balances (user_id, balance)
  values (ch.challenger_id, 100)
  on conflict (user_id) do nothing;
  insert into public.eesl_balances (user_id, balance)
  values (ch.opponent_id, 100)
  on conflict (user_id) do nothing;

  perform public._eesl_lock_balance(ch.challenger_id);
  perform public._eesl_lock_balance(ch.opponent_id);

  pot := ch.stake * 2;

  if res = 'push' then
    update public.eesl_balances
    set balance = balance + ch.stake
    where user_id = ch.challenger_id;

    update public.eesl_balances
    set balance = balance + ch.stake
    where user_id = ch.opponent_id;

    update public.eesl_challenges
    set status = 'settled',
        settled_as = 'push',
        winner_id = null
    where id = p_id;
    return;
  end if;

  if res = 'challenger' then
    win := ch.challenger_id;
  else
    win := ch.opponent_id;
  end if;

  update public.eesl_balances
  set balance = balance + pot
  where user_id = win;

  update public.eesl_challenges
  set status = 'settled',
      settled_as = res,
      winner_id = win
  where id = p_id;
end;
$$;

revoke all on function public.settle_eesl_challenge(uuid, text) from public;
grant execute on function public.settle_eesl_challenge(uuid, text) to authenticated;
