-- Eastside Legends Sim — team claims (one Yahoo team per chat member)
-- Run in Supabase SQL Editor for project yqnbeksemcgmggframnd.
-- Client uses anon key only — no service role in the app.
-- Depends on: league_chat_members + is_eastside_chat_member (league-chat.sql)

create extension if not exists "pgcrypto";

-- Optional invite codes (seed EASTSIDE). Client also hardcodes INVITE_CODE='EASTSIDE'.
create table if not exists public.league_invites (
  code text primary key,
  league_id text not null default 'eastside-legends',
  created_at timestamptz not null default now()
);

insert into public.league_invites (code, league_id)
values ('EASTSIDE', 'eastside-legends')
on conflict (code) do nothing;

alter table public.league_invites enable row level security;

drop policy if exists league_invites_select on public.league_invites;
create policy league_invites_select
  on public.league_invites for select
  to authenticated, anon
  using (true);

-- One claim per team; one claim per user within a league. First insert wins.
create table if not exists public.league_team_claims (
  league_id text not null default 'eastside-legends',
  team_id text not null,
  team_name text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  claimed_at timestamptz not null default now(),
  primary key (league_id, team_id),
  unique (league_id, user_id)
);

create index if not exists league_team_claims_user_idx
  on public.league_team_claims (league_id, user_id);

alter table public.league_team_claims enable row level security;

-- Members can see all claims in their league
drop policy if exists league_team_claims_select on public.league_team_claims;
create policy league_team_claims_select
  on public.league_team_claims for select
  to authenticated
  using (public.is_eastside_chat_member(league_id));

-- Insert own claim only if chat member (RPC is preferred; policy is defense in depth)
drop policy if exists league_team_claims_insert on public.league_team_claims;
create policy league_team_claims_insert
  on public.league_team_claims for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_eastside_chat_member(league_id)
  );

-- No update of others' claims (and no update of own team_id — release + re-claim instead)
drop policy if exists league_team_claims_update on public.league_team_claims;
create policy league_team_claims_update
  on public.league_team_claims for update
  to authenticated
  using (false);

-- User may delete (release) own claim only
drop policy if exists league_team_claims_delete on public.league_team_claims;
create policy league_team_claims_delete
  on public.league_team_claims for delete
  to authenticated
  using (auth.uid() = user_id);

-- Allowed Yahoo team ids for Eastside (must match client TEAMS)
create or replace function public.eastside_valid_team_id(p_team_id text)
returns boolean
language sql
immutable
as $$
  select p_team_id in (
    'go-birds',
    'gibb-it-to-me-baby',
    'goodwrench',
    'apache-dogs',
    'juice-booze',
    'taylor-gang',
    'cheesehead-hooligans',
    'zenahc-cool-arrows',
    'tds-in-yo-face',
    'such-a-burden',
    'cheese-me',
    'wstd-mngmnt'
  );
$$;

revoke all on function public.eastside_valid_team_id(text) from public;
grant execute on function public.eastside_valid_team_id(text) to authenticated;

-- First insert wins (unique on team_id). If user already has a claim, return 'already' without changing.
create or replace function public.claim_eastside_team(p_team_id text, p_team_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  tid text := lower(trim(p_team_id));
  tname text := trim(p_team_name);
begin
  if uid is null then
    return 'unauth';
  end if;

  if tid is null or tid = '' or tname is null or tname = '' then
    return 'invalid';
  end if;

  if not public.eastside_valid_team_id(tid) then
    return 'invalid';
  end if;

  if not public.is_eastside_chat_member('eastside-legends') then
    return 'not_member';
  end if;

  if exists (
    select 1 from public.league_team_claims
    where league_id = 'eastside-legends' and user_id = uid
  ) then
    return 'already';
  end if;

  if exists (
    select 1 from public.league_team_claims
    where league_id = 'eastside-legends' and team_id = tid
  ) then
    return 'taken';
  end if;

  begin
    insert into public.league_team_claims (league_id, team_id, team_name, user_id)
    values ('eastside-legends', tid, tname, uid);
  exception
    when unique_violation then
      -- Race: another user claimed the team (or user raced themselves)
      if exists (
        select 1 from public.league_team_claims
        where league_id = 'eastside-legends' and user_id = uid
      ) then
        return 'already';
      end if;
      return 'taken';
  end;

  return 'ok';
end;
$$;

revoke all on function public.claim_eastside_team(text, text) from public;
grant execute on function public.claim_eastside_team(text, text) to authenticated;

-- Optional: release own claim
create or replace function public.release_eastside_team()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return 'unauth';
  end if;
  delete from public.league_team_claims
  where league_id = 'eastside-legends' and user_id = uid;
  if not found then
    return 'none';
  end if;
  return 'ok';
end;
$$;

revoke all on function public.release_eastside_team() from public;
grant execute on function public.release_eastside_team() to authenticated;
