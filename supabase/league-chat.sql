-- Eastside Legends Sim — league group chat (12-member cap)
-- Run in Supabase SQL Editor for project yqnbeksemcgmggframnd.
-- Client uses anon key only — no service role in the app.

create extension if not exists "pgcrypto";

create table if not exists public.league_chat_members (
  league_id text not null default 'eastside-legends',
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create table if not exists public.league_chat_messages (
  id uuid primary key default gen_random_uuid(),
  league_id text not null default 'eastside-legends',
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists league_chat_messages_league_created_idx
  on public.league_chat_messages (league_id, created_at);

alter table public.league_chat_members enable row level security;
alter table public.league_chat_messages enable row level security;

-- Avoid RLS recursion when policies check membership
create or replace function public.is_eastside_chat_member(p_league text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.league_chat_members
    where league_id = p_league and user_id = auth.uid()
  );
$$;

revoke all on function public.is_eastside_chat_member(text) from public;
grant execute on function public.is_eastside_chat_member(text) to authenticated;

drop policy if exists league_chat_members_select on public.league_chat_members;
create policy league_chat_members_select
  on public.league_chat_members for select
  to authenticated
  using (public.is_eastside_chat_member(league_id));

drop policy if exists league_chat_members_insert on public.league_chat_members;
create policy league_chat_members_insert
  on public.league_chat_members for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (
      select count(*) from public.league_chat_members m
      where m.league_id = league_chat_members.league_id
    ) < 12
  );

drop policy if exists league_chat_messages_select on public.league_chat_messages;
create policy league_chat_messages_select
  on public.league_chat_messages for select
  to authenticated
  using (public.is_eastside_chat_member(league_id));

drop policy if exists league_chat_messages_insert on public.league_chat_messages;
create policy league_chat_messages_insert
  on public.league_chat_messages for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_eastside_chat_member(league_id)
  );

-- Realtime (ignore error if already added)
do $$
begin
  alter publication supabase_realtime add table public.league_chat_messages;
exception
  when duplicate_object then null;
  when others then
    -- older PG may use different SQLSTATE for "already member"
    null;
end $$;

create or replace function public.join_eastside_league_chat(p_display_name text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  n int;
begin
  if uid is null then
    return false;
  end if;
  if exists (
    select 1 from public.league_chat_members
    where league_id = 'eastside-legends' and user_id = uid
  ) then
    return true;
  end if;
  select count(*) into n from public.league_chat_members
  where league_id = 'eastside-legends';
  if n >= 12 then
    return false;
  end if;
  insert into public.league_chat_members (league_id, user_id, display_name)
  values (
    'eastside-legends',
    uid,
    coalesce(nullif(trim(p_display_name), ''), 'Member')
  );
  return true;
end;
$$;

revoke all on function public.join_eastside_league_chat(text) from public;
grant execute on function public.join_eastside_league_chat(text) to authenticated;
