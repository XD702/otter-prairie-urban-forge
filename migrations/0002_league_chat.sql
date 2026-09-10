-- Eastside league group chat. Membership is capped at 12 in application code.
-- user_id is TEXT to match Better Auth ids.

create table if not exists league_chat_members (
  league_id text not null,
  user_id text not null,
  display_name text not null,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create table if not exists league_chat_messages (
  id text primary key,
  league_id text not null,
  user_id text not null,
  display_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists league_chat_messages_league_created_idx
  on league_chat_messages (league_id, created_at);
