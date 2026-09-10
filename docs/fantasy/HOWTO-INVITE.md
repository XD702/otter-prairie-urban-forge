# Eastside invite + team claim â€” how to poke

## Auth checklist (Supabase project yqnbeksemcgmggframnd)

1. **Site URL:** `http://localhost:8080`
2. **Redirect URLs:**  
   - `http://localhost:8080/**`  
   - `http://127.0.0.1:8080/**`
   - `https://otter-prairie-urban-forge.grok.me/**`
3. **Email provider:** Authentication â†’ Providers â†’ Email â†’ enabled (magic link / OTP)
4. Apply SQL:
   - Existing: `supabase/league-chat.sql` (members + messages + `join_eastside_league_chat`)
   - New: `supabase/team-claims.sql` (`league_team_claims` + `claim_eastside_team` + seed invite `EASTSIDE`)
5. **Invite URL:** `http://localhost:8080/join?code=EASTSIDE`

## Auth split (important)

| Path | Auth |
|---|---|
| `/login` | May still be **better-auth** email+password on the laptop clone |
| `/join?code=EASTSIDE` | **Supabase** `signInWithOtp` via `InviteBar` â€” required for chat RLS (`auth.uid()`) |

AccountBar may still deep-link to `/login`. Join handles invite OTP itself with  
`emailRedirectTo = ${origin}/join?code=EASTSIDE`.

Do **not** invent users/emails. Do **not** put the service role key in the client.

## Flow

1. Rob copies invite link from Chat header (`InvitePanel`) or shares  
   `http://localhost:8080/join?code=EASTSIDE`
2. Friend opens link â†’ enters **real** email â†’ magic link
3. Lands back on `/join?code=EASTSIDE` signed in (Supabase session)
4. Auto `joinLeagueChat` (cap 12)
5. **Team picker** lists exact Yahoo **names** only (never â€œTeam 1â€“12â€):
   - Go birds D**k head  
   - Gibb it to me Baby  
   - Goodwrench  
   - APACHEDOGS  
   - Juice & Booze  
   - Taylor Gang  
   - Cheesehead hooligans  
   - Zenahc cool arrows  
   - TDsInYoFace  
   - Such a Burden  
   - Cheese me!  
   - WSTD MNGMNT  
6. Claim â†’ RPC `claim_eastside_team` (stable `team_id` under the hood). First claim wins.
7. **Open Chat → `sessionStorage eastside-open-chat=1` → `/` League tab (Chat sub)

## Local app

```powershell
cd C:\Users\rober\src\otter-prairie-urban-forge
npm run dev
```

Open http://localhost:8080/join?code=EASTSIDE

## Invite code

- Client hardcoded: `INVITE_CODE = 'EASTSIDE'` in `src/lib/supabase/invite.ts`
- Optional DB seed: `league_invites` row `EASTSIDE` in `team-claims.sql`  
  Either is enough; client does not require the table to validate the code.


