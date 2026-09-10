# Eastside league chat — how to poke

## 1) Supabase SQL (required once)
1. Open https://supabase.com/dashboard → project `yqnbeksemcgmggframnd`
2. SQL Editor → New query
3. Paste and run: `supabase/league-chat.sql` from the laptop clone
4. If `alter publication ... add table` errors as “already member”, ignore
5. Database → Publications / Realtime: confirm `league_chat_messages` is enabled for Realtime

## 2) Auth settings
- Authentication → Providers → Email: enable Email OTP / magic link
- Authentication → URL config: allow `http://localhost:8080` (and `http://127.0.0.1:8080`)

## 3) Local app
```powershell
cd C:\Users\rober\src\otter-prairie-urban-forge
npm run dev
```
Open http://localhost:8080 → **Chat** tab
- Logged out: Sign-in CTA, board still works on Board tab
- Sign in via magic link → auto-join if under 12/12 → post messages; live updates for other signed-in members

## Cap
Participants show `n/12`. At 12/12 new accounts cannot join or post.
