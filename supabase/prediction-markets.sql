-- Eastside Legends Sim — in-house prediction markets (Yes/No + multi-outcome)
-- User-facing currency: "E$L coin$" (exact). Tables/RPCs: eesl_*.
-- Simulation only — NOT real money, NOT Kalshi, NOT Polymarket.
-- Run in Supabase SQL Editor for project yqnbeksemcgmggframnd.
-- Client uses anon key only — no service role in the app.
--
-- Depends on:
--   league-chat.sql  → is_eastside_chat_member, league_chat_members
--   eesl-challenges.sql → eesl_balances, ensure_eesl_balance, _eesl_lock_balance
--
-- ---------------------------------------------------------------------------
-- PAYOUT FORMULA (thin fixed-odds / pari-mutuel pool)
-- ---------------------------------------------------------------------------
-- Each buy_eesl_market deducts `stake` and inserts a position on one outcome.
--
--   pool(o) = Σ stake on outcome o
--   pot     = Σ pool(o) over all outcomes
--
-- On admin_resolve_eesl_market(id, winning_outcome_id) — never invent outcome:
--   If pool(winner) = 0: VOID — refund every position's stake.
--   Else for each winning position i with stake_i:
--     payout_i = stake_i * (pot / pool(winner))
--              = stake_i + stake_i * ((pot - pool(winner)) / pool(winner))
--     (stake back + proportional share of all losing pools)
--   Losing positions receive 0 (stake already deducted at buy).
--
-- DK American odds on outcome labels are REFERENCE ONLY — payouts use this
-- pool formula, not DraftKings odds.
-- ---------------------------------------------------------------------------
-- ADMIN GATE (Prototype)
-- ---------------------------------------------------------------------------
-- Client: VITE_EASTSIDE_ADMIN_EMAILS comma-list → isEastsideAdmin(email)
-- SQL:    is_eastside_admin() checks auth.users.email ∈ eastside_admin_emails
-- Seed your sign-in email in SQL Editor — do NOT hardcode secrets in app source.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Admin email allow-list (RPC enforcement; seed manually after apply)
-- ---------------------------------------------------------------------------
create table if not exists public.eastside_admin_emails (
  email text primary key,
  created_at timestamptz not null default now(),
  check (position('@' in email) > 1)
);

alter table public.eastside_admin_emails enable row level security;

drop policy if exists eastside_admin_emails_select on public.eastside_admin_emails;
create policy eastside_admin_emails_select
  on public.eastside_admin_emails for select
  to authenticated
  using (true);

-- Seed step (run once — replace with Rob's Supabase magic-link email):
--   insert into public.eastside_admin_emails (email)
--   values (lower('YOUR_EMAIL@example.com'))
--   on conflict do nothing;

create or replace function public.is_eastside_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  em text;
begin
  if uid is null then
    return false;
  end if;

  select lower(trim(email)) into em
  from auth.users
  where id = uid;

  if em is null or em = '' then
    return false;
  end if;

  return exists (
    select 1
    from public.eastside_admin_emails a
    where lower(trim(a.email)) = em
  );
end;
$$;

revoke all on function public.is_eastside_admin() from public;
grant execute on function public.is_eastside_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Markets
-- ---------------------------------------------------------------------------
create table if not exists public.eesl_markets (
  id uuid primary key default gen_random_uuid(),
  league_id text not null default 'eastside-legends',
  question text not null
    check (char_length(trim(question)) > 0 and char_length(question) <= 280),
  rules text not null default ''
    check (char_length(rules) <= 2000),
  status text not null
    check (status in ('pending', 'live', 'rejected', 'resolved', 'canceled')),
  -- nullable for house/seed markets (no auth user)
  created_by uuid null references auth.users (id),
  created_at timestamptz not null default now(),
  closes_at timestamptz null,
  approved_by uuid null references auth.users (id),
  resolved_outcome_id uuid null, -- FK added after outcomes table
  reject_reason text null,
  seed_key text null unique -- idempotent house seeds (e.g. superbowl-2026-top6)
);

-- Migrate older Yes/No schema if present
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'eesl_markets'
      and column_name = 'resolved_outcome'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'eesl_markets'
      and column_name = 'resolved_outcome_id'
  ) then
    alter table public.eesl_markets add column resolved_outcome_id uuid null;
    alter table public.eesl_markets drop column if exists resolved_outcome;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'eesl_markets'
      and column_name = 'seed_key'
  ) then
    alter table public.eesl_markets add column seed_key text null;
    begin
      alter table public.eesl_markets add constraint eesl_markets_seed_key_key unique (seed_key);
    exception when duplicate_object then null;
    end;
  end if;
  -- allow null created_by for house seeds
  begin
    alter table public.eesl_markets alter column created_by drop not null;
  exception when others then null;
  end;
end $$;

create index if not exists eesl_markets_league_status_idx
  on public.eesl_markets (league_id, status, created_at desc);

create index if not exists eesl_markets_created_by_idx
  on public.eesl_markets (created_by, created_at desc);

alter table public.eesl_markets enable row level security;

drop policy if exists eesl_markets_select on public.eesl_markets;
create policy eesl_markets_select
  on public.eesl_markets for select
  to authenticated
  using (
    public.is_eastside_admin()
    or (
      public.is_eastside_chat_member(league_id)
      and (
        status in ('live', 'resolved', 'canceled')
        or created_by = auth.uid()
      )
    )
  );

drop policy if exists eesl_markets_insert on public.eesl_markets;
drop policy if exists eesl_markets_update on public.eesl_markets;
drop policy if exists eesl_markets_delete on public.eesl_markets;

-- ---------------------------------------------------------------------------
-- Outcomes (Yes/No or multi — e.g. Super Bowl teams)
-- label = exact display string from source (team name). ref_odds = DK ref only.
-- ---------------------------------------------------------------------------
create table if not exists public.eesl_market_outcomes (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.eesl_markets (id) on delete cascade,
  label text not null
    check (char_length(trim(label)) > 0 and char_length(label) <= 120),
  ref_odds text null
    check (ref_odds is null or char_length(ref_odds) <= 16),
  sort_order int not null default 0,
  unique (market_id, label)
);

create index if not exists eesl_market_outcomes_market_idx
  on public.eesl_market_outcomes (market_id, sort_order);

alter table public.eesl_market_outcomes enable row level security;

drop policy if exists eesl_market_outcomes_select on public.eesl_market_outcomes;
create policy eesl_market_outcomes_select
  on public.eesl_market_outcomes for select
  to authenticated
  using (
    exists (
      select 1 from public.eesl_markets m
      where m.id = market_id
        and (
          public.is_eastside_admin()
          or (
            public.is_eastside_chat_member(m.league_id)
            and (
              m.status in ('live', 'resolved', 'canceled')
              or m.created_by = auth.uid()
            )
          )
        )
    )
  );

-- FK markets.resolved_outcome_id → outcomes (deferred create)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'eesl_markets_resolved_outcome_id_fkey'
  ) then
    alter table public.eesl_markets
      add constraint eesl_markets_resolved_outcome_id_fkey
      foreign key (resolved_outcome_id)
      references public.eesl_market_outcomes (id);
  end if;
exception when others then null;
end $$;

-- ---------------------------------------------------------------------------
-- Positions
-- ---------------------------------------------------------------------------
create table if not exists public.eesl_market_positions (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.eesl_markets (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  outcome_id uuid not null references public.eesl_market_outcomes (id),
  stake numeric(12,2) not null check (stake > 0),
  created_at timestamptz not null default now()
);

-- Migrate older side yes|no column if present
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'eesl_market_positions'
      and column_name = 'side'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'eesl_market_positions'
      and column_name = 'outcome_id'
  ) then
    -- old binary schema incompatible with multi; drop empty or rebuild
    alter table public.eesl_market_positions add column outcome_id uuid null;
    -- cannot map side→outcome safely without market outcomes; wipe orphan rows
    delete from public.eesl_market_positions where outcome_id is null;
    alter table public.eesl_market_positions
      alter column outcome_id set not null;
    alter table public.eesl_market_positions drop column side;
  end if;
end $$;

create index if not exists eesl_market_positions_market_idx
  on public.eesl_market_positions (market_id, outcome_id);

create index if not exists eesl_market_positions_user_idx
  on public.eesl_market_positions (user_id, created_at desc);

alter table public.eesl_market_positions enable row level security;

drop policy if exists eesl_market_positions_select on public.eesl_market_positions;
create policy eesl_market_positions_select
  on public.eesl_market_positions for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_eastside_admin()
    or exists (
      select 1 from public.eesl_markets m
      where m.id = market_id
        and public.is_eastside_chat_member(m.league_id)
        and m.status in ('live', 'resolved', 'canceled')
    )
  );

drop policy if exists eesl_market_positions_insert on public.eesl_market_positions;
drop policy if exists eesl_market_positions_update on public.eesl_market_positions;
drop policy if exists eesl_market_positions_delete on public.eesl_market_positions;

-- ---------------------------------------------------------------------------
-- propose_eesl_market(question, rules, closes_at, outcomes jsonb)
-- outcomes: [{"label":"Yes"},{"label":"No"}] or multi team labels.
-- Default outcomes = Yes / No when null or empty.
-- Status pending — admin must approve (no auto-approve).
-- ---------------------------------------------------------------------------
create or replace function public.propose_eesl_market(
  p_question text,
  p_rules text default '',
  p_closes_at timestamptz default null,
  p_outcomes jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  q text := trim(coalesce(p_question, ''));
  r text := trim(coalesce(p_rules, ''));
  new_id uuid;
  elem jsonb;
  i int := 0;
  lab text;
  odds text;
begin
  if uid is null then
    raise exception 'eesl_unauth';
  end if;

  if not public.is_eastside_chat_member('eastside-legends') then
    raise exception 'eesl_not_member';
  end if;

  if char_length(q) = 0 or char_length(q) > 280 then
    raise exception 'eesl_invalid_question';
  end if;

  if char_length(r) > 2000 then
    raise exception 'eesl_invalid_rules';
  end if;

  if p_closes_at is not null and p_closes_at <= now() then
    raise exception 'eesl_invalid_closes_at';
  end if;

  if p_outcomes is null
     or jsonb_typeof(p_outcomes) <> 'array'
     or jsonb_array_length(p_outcomes) < 2 then
    p_outcomes := '[{"label":"Yes"},{"label":"No"}]'::jsonb;
  end if;

  if jsonb_array_length(p_outcomes) > 32 then
    raise exception 'eesl_invalid_outcomes';
  end if;

  perform public.ensure_eesl_balance();

  insert into public.eesl_markets (
    league_id, question, rules, status, created_by, closes_at
  ) values (
    'eastside-legends', q, r, 'pending', uid, p_closes_at
  )
  returning id into new_id;

  for elem in select * from jsonb_array_elements(p_outcomes)
  loop
    lab := trim(coalesce(elem->>'label', ''));
    odds := nullif(trim(coalesce(elem->>'ref_odds', '')), '');
    if char_length(lab) = 0 or char_length(lab) > 120 then
      raise exception 'eesl_invalid_outcomes';
    end if;
    insert into public.eesl_market_outcomes (market_id, label, ref_odds, sort_order)
    values (new_id, lab, odds, i);
    i := i + 1;
  end loop;

  return new_id;
end;
$$;

-- Drop older 3-arg overload if present
drop function if exists public.propose_eesl_market(text, text, timestamptz);

revoke all on function public.propose_eesl_market(text, text, timestamptz, jsonb) from public;
grant execute on function public.propose_eesl_market(text, text, timestamptz, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_approve_eesl_market(id) — pending → live
-- ---------------------------------------------------------------------------
create or replace function public.admin_approve_eesl_market(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  m public.eesl_markets%rowtype;
begin
  if uid is null then
    raise exception 'eesl_unauth';
  end if;

  if not public.is_eastside_admin() then
    raise exception 'eesl_forbidden';
  end if;

  select * into m from public.eesl_markets where id = p_id for update;
  if not found then raise exception 'eesl_not_found'; end if;
  if m.status <> 'pending' then raise exception 'eesl_bad_status'; end if;

  update public.eesl_markets
  set status = 'live',
      approved_by = uid,
      reject_reason = null
  where id = p_id;
end;
$$;

revoke all on function public.admin_approve_eesl_market(uuid) from public;
grant execute on function public.admin_approve_eesl_market(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_reject_eesl_market(id, reason) — pending → rejected
-- ---------------------------------------------------------------------------
create or replace function public.admin_reject_eesl_market(
  p_id uuid,
  p_reason text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  m public.eesl_markets%rowtype;
  reason text := left(trim(coalesce(p_reason, '')), 500);
begin
  if uid is null then raise exception 'eesl_unauth'; end if;
  if not public.is_eastside_admin() then raise exception 'eesl_forbidden'; end if;

  select * into m from public.eesl_markets where id = p_id for update;
  if not found then raise exception 'eesl_not_found'; end if;
  if m.status <> 'pending' then raise exception 'eesl_bad_status'; end if;

  update public.eesl_markets
  set status = 'rejected',
      reject_reason = nullif(reason, '')
  where id = p_id;
end;
$$;

revoke all on function public.admin_reject_eesl_market(uuid, text) from public;
grant execute on function public.admin_reject_eesl_market(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- buy_eesl_market(id, outcome_id, stake)
-- ---------------------------------------------------------------------------
create or replace function public.buy_eesl_market(
  p_id uuid,
  p_outcome_id uuid,
  p_stake numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  m public.eesl_markets%rowtype;
  bal numeric(12,2);
  pos_id uuid;
  oc_ok boolean;
begin
  if uid is null then raise exception 'eesl_unauth'; end if;
  if not public.is_eastside_chat_member('eastside-legends') then
    raise exception 'eesl_not_member';
  end if;
  if p_stake is null or p_stake <= 0 then raise exception 'eesl_invalid_stake'; end if;
  if p_outcome_id is null then raise exception 'eesl_invalid_outcome'; end if;

  select * into m from public.eesl_markets where id = p_id for update;
  if not found then raise exception 'eesl_not_found'; end if;
  if m.status <> 'live' then raise exception 'eesl_bad_status'; end if;
  if m.closes_at is not null and m.closes_at <= now() then
    raise exception 'eesl_market_closed';
  end if;

  select exists (
    select 1 from public.eesl_market_outcomes
    where id = p_outcome_id and market_id = p_id
  ) into oc_ok;
  if not oc_ok then raise exception 'eesl_invalid_outcome'; end if;

  bal := public.ensure_eesl_balance();
  bal := public._eesl_lock_balance(uid);
  if bal < p_stake then raise exception 'eesl_insufficient'; end if;

  update public.eesl_balances
  set balance = balance - p_stake
  where user_id = uid;

  insert into public.eesl_market_positions (market_id, user_id, outcome_id, stake)
  values (p_id, uid, p_outcome_id, p_stake)
  returning id into pos_id;

  return pos_id;
end;
$$;

-- Drop older (uuid, text, numeric) buy if present
drop function if exists public.buy_eesl_market(uuid, text, numeric);

revoke all on function public.buy_eesl_market(uuid, uuid, numeric) from public;
grant execute on function public.buy_eesl_market(uuid, uuid, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_resolve_eesl_market(id, outcome_id) — never invent outcome
-- ---------------------------------------------------------------------------
create or replace function public.admin_resolve_eesl_market(
  p_id uuid,
  p_outcome_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  m public.eesl_markets%rowtype;
  win_pool numeric(12,2);
  pot numeric(12,2);
  r record;
  payout numeric(12,2);
  oc_ok boolean;
begin
  if uid is null then raise exception 'eesl_unauth'; end if;
  if not public.is_eastside_admin() then raise exception 'eesl_forbidden'; end if;
  if p_outcome_id is null then raise exception 'eesl_invalid_outcome'; end if;

  select * into m from public.eesl_markets where id = p_id for update;
  if not found then raise exception 'eesl_not_found'; end if;
  if m.status <> 'live' then raise exception 'eesl_bad_status'; end if;

  select exists (
    select 1 from public.eesl_market_outcomes
    where id = p_outcome_id and market_id = p_id
  ) into oc_ok;
  if not oc_ok then raise exception 'eesl_invalid_outcome'; end if;

  select coalesce(sum(stake), 0) into pot
  from public.eesl_market_positions where market_id = p_id;

  select coalesce(sum(stake), 0) into win_pool
  from public.eesl_market_positions
  where market_id = p_id and outcome_id = p_outcome_id;

  for r in
    select distinct user_id from public.eesl_market_positions where market_id = p_id
  loop
    insert into public.eesl_balances (user_id, balance)
    values (r.user_id, 100)
    on conflict (user_id) do nothing;
    perform public._eesl_lock_balance(r.user_id);
  end loop;

  if win_pool <= 0 then
    -- Nobody on winning outcome → void / refund all
    for r in
      select user_id, stake from public.eesl_market_positions where market_id = p_id
    loop
      update public.eesl_balances
      set balance = balance + r.stake
      where user_id = r.user_id;
    end loop;
  else
    for r in
      select user_id, stake from public.eesl_market_positions
      where market_id = p_id and outcome_id = p_outcome_id
    loop
      payout := round(r.stake * (pot / win_pool), 2);
      update public.eesl_balances
      set balance = balance + payout
      where user_id = r.user_id;
    end loop;
  end if;

  update public.eesl_markets
  set status = 'resolved',
      resolved_outcome_id = p_outcome_id,
      approved_by = coalesce(approved_by, uid)
  where id = p_id;
end;
$$;

-- Drop older text-outcome resolve if present
drop function if exists public.admin_resolve_eesl_market(uuid, text);

revoke all on function public.admin_resolve_eesl_market(uuid, uuid) from public;
grant execute on function public.admin_resolve_eesl_market(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_cancel_eesl_market(id) — live → canceled; refund all stakes
-- ---------------------------------------------------------------------------
create or replace function public.admin_cancel_eesl_market(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  m public.eesl_markets%rowtype;
  r record;
begin
  if uid is null then raise exception 'eesl_unauth'; end if;
  if not public.is_eastside_admin() then raise exception 'eesl_forbidden'; end if;

  select * into m from public.eesl_markets where id = p_id for update;
  if not found then raise exception 'eesl_not_found'; end if;
  if m.status <> 'live' then raise exception 'eesl_bad_status'; end if;

  for r in
    select distinct user_id from public.eesl_market_positions where market_id = p_id
  loop
    insert into public.eesl_balances (user_id, balance)
    values (r.user_id, 100)
    on conflict (user_id) do nothing;
    perform public._eesl_lock_balance(r.user_id);
  end loop;

  for r in
    select user_id, stake from public.eesl_market_positions where market_id = p_id
  loop
    update public.eesl_balances
    set balance = balance + r.stake
    where user_id = r.user_id;
  end loop;

  update public.eesl_markets
  set status = 'canceled',
      resolved_outcome_id = null
  where id = p_id;
end;
$$;

revoke all on function public.admin_cancel_eesl_market(uuid) from public;
grant execute on function public.admin_cancel_eesl_market(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- SEED: Super Bowl Winner — already live (admin-approved house market)
-- Exact team strings from public/odds/superbowl-top6-latest.json
-- DK odds = reference labels only; E$L uses sim pool payouts.
-- Idempotent via seed_key.
-- ---------------------------------------------------------------------------
do $$
declare
  mid uuid;
begin
  select id into mid from public.eesl_markets
  where seed_key = 'superbowl-2026-top6';

  if mid is null then
    insert into public.eesl_markets (
      league_id, question, rules, status, created_by, approved_by, seed_key
    ) values (
      'eastside-legends',
      'Who will win Super Bowl?',
      'Eastside house market. Stake E$L coin$ on one team. Pool payout on resolve (not DraftKings odds). Simulation only — not real money — not Kalshi or Polymarket. DK American odds shown as reference labels only. Source: DraftKings Super Bowl Winner top 6.',
      'live',
      null,
      null,
      'superbowl-2026-top6'
    )
    returning id into mid;

    insert into public.eesl_market_outcomes (market_id, label, ref_odds, sort_order) values
      (mid, 'Los Angeles Rams', '+500', 1),
      (mid, 'Buffalo Bills', '+1000', 2),
      (mid, 'Baltimore Ravens', '+1000', 3),
      (mid, 'Seattle Seahawks', '+1300', 4),
      (mid, 'Kansas City Chiefs', '+1600', 5),
      (mid, 'New England Patriots', '+1650', 6);
  end if;
end $$;
