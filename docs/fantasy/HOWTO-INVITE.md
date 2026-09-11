# Eastside invite + team claim — how to poke

## Auth checklist (Supabase project yqnbeksemcgmggframnd)

1. **Site URL:** current live grok.me origin (not localhost-only)
2. **Redirect URLs:**
   - `http://localhost:8080/**`
   - `http://127.0.0.1:8080/**`
   - `https://ocean-crane-pepper-lark.grok.me/**`
   - `https://otter-prairie-urban-forge.grok.me/**`
   - `https://summit-leaf-blend-aurora.grok.me/**`
   - `https://<this-publish-host>.grok.me/**`
3. **Email provider:** Authentication → Providers → Email → enabled (magic link / OTP)
4. Apply SQL:
   - Existing: `supabase/league-chat.sql` (members + messages + `join_eastside_league_chat`)
   - New: `supabase/team-claims.sql` (`league_team_claims` + `claim_eastside_team` + seed invite `EASTSIDE`)
5. **Invite URL:** `${origin}/join?code=EASTSIDE` (never localhost on a live host)
6. **Build env:** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (anon only)

## Auth split (important)

| Path | Auth |
|---|---|
| `/login` | Club profile — Better Auth email+password. Does **not** open chat. |
| `/join?code=EASTSIDE` | **Supabase** `signInWithOtp` via `InviteBar` — required for chat RLS (`auth.uid()`) |
| `/chat` | Deep link → League Chat tab |

AccountBar “Join chat” goes to `/join?code=EASTSIDE`.  
`emailRedirectTo = ${origin}/join?code=EASTSIDE`.

Do **not** invent users/emails. Do **not** put the service role key in the client.

## Flow

1. Copy invite from Chat header (`InvitePanel`) — live origin, not localhost
2. Friend opens link → real email → magic link
3. Lands back on `/join?code=EASTSIDE` signed in (Supabase session)
4. Auto `joinLeagueChat` (cap 12)
5. Team picker lists exact Yahoo **names** only
6. Claim → RPC `claim_eastside_team`. First claim wins.
7. Open Chat → League tab (Chat sub) or `/chat`

## Invite code

- Client hardcoded: `INVITE_CODE = 'EASTSIDE'` in `src/lib/supabase/invite.ts`
- Optional DB seed: `league_invites` row `EASTSIDE` in `team-claims.sql`
