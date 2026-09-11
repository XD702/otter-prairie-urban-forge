# Eastside league chat — how to poke

## 1) Supabase SQL (required once)
1. Open https://supabase.com/dashboard → project `yqnbeksemcgmggframnd`
2. SQL Editor → New query
3. Paste and run: `supabase/league-chat.sql` from the laptop clone
4. If `alter publication ... add table` errors as “already member”, ignore
5. Database → Publications / Realtime: confirm `league_chat_messages` is enabled for Realtime

## 2) Auth settings
- Authentication → Providers → Email: enable Email OTP / magic link
- **Site URL** (production): current live grok.me host (ocean-crane or the host this Publish minted)
- Authentication → URL configuration → Redirect URLs — allow ALL of:

```
http://localhost:8080/**
http://127.0.0.1:8080/**
https://ocean-crane-pepper-lark.grok.me/**
https://otter-prairie-urban-forge.grok.me/**
https://summit-leaf-blend-aurora.grok.me/**
https://<this-publish-host>.grok.me/**
```

Magic-link `emailRedirectTo` is always `${window.location.origin}/join?code=EASTSIDE`.

## 3) App env (required for chat on grok.me)
Set at **build** (anon only — never `service_role` in the client):

- `VITE_SUPABASE_URL` = `https://yqnbeksemcgmggframnd.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = project anon public key from Supabase → Settings → API

Without the anon key, `/join?code=EASTSIDE` shows the chat-lock plaque.

## 4) Local / preview
Open `/join?code=EASTSIDE` → magic link → auto-join if under 12/12 → claim a Yahoo team name → Open Chat.

## Cap
Participants show `n/12`. At 12/12 new accounts cannot join or post.

## Auth split
- `/join?code=EASTSIDE` = Supabase OTP (required for chat RLS `auth.uid()`)
- `/login` = club profile (Better Auth). It does **not** land in league chat.
