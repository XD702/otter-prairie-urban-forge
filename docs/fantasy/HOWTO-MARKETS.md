# HOWTO — Eastside in-house Markets

Simulation only — **not real money**, **not Kalshi**, **not Polymarket**.  
User-facing currency: **E$L coin$** (exact). Same `eesl_balances` as Board / E$L challenges.

Banner (always show):  
`E$L coin$ · simulation only · not real money · not Kalshi or Polymarket`

## Product flow

1. Signed-in chat member **proposes** a market (default Yes/No) → status `pending`
2. **Admin (Rob)** approves → `live` (or rejects)
3. Members **buy** an outcome with E$L coin$ (stake deducted into the pool)
4. Admin **resolves** with an explicit winning outcome → winners paid from pot
5. Never auto-approve; never invent a resolution

House seed (applied with SQL): **Who will win Super Bowl?** already `live` with exact DK top-6 team strings.

## Payout formula (thin pool)

```
pool(o) = Σ stake on outcome o
pot     = Σ pool(o)

If pool(winner) = 0 → VOID / refund all stakes
Else payout_i = stake_i × (pot / pool(winner))
              = stake back + proportional share of losing pools
```

DK American odds on labels (e.g. `Los Angeles Rams (+500)`) are **reference only** — E$L does **not** pay DK odds.

## Admin setup (required)

### A) Client env (`.env.local`)

Prototype gate — client-visible is OK. Put the email Rob uses for Supabase magic link:

```env
# Example — replace with Rob's real sign-in email (do not commit secrets):
VITE_EASTSIDE_ADMIN_EMAILS=you@example.com
```

Comma-list supported: `a@x.com,b@y.com`  
Helper: `isEastsideAdmin(email)` in `src/lib/supabase/markets.ts`.

### B) SQL admin allow-list (RPC enforcement)

After applying `prediction-markets.sql`, in Supabase SQL Editor:

```sql
insert into public.eastside_admin_emails (email)
values (lower('you@example.com'))  -- same address as VITE_EASTSIDE_ADMIN_EMAILS
on conflict do nothing;
```

Without this row, `admin_approve_*` / `admin_resolve_*` raise `eesl_forbidden`.

## Auth / SQL checklist

1. Open https://supabase.com/dashboard → project `yqnbeksemcgmggframnd`
2. Confirm **league-chat.sql** and **eesl-challenges.sql** already applied  
   (`is_eastside_chat_member`, `ensure_eesl_balance`, `eesl_balances`)
3. SQL Editor → paste and run `supabase/prediction-markets.sql`  
   - Seeds Super Bowl market (`seed_key = superbowl-2026-top6`) as **live**
4. Seed admin email (step B above)
5. Restart `npm run dev` after editing `.env.local`

## Copy into laptop clone

```powershell
cd C:\Users\rober\src\otter-prairie-urban-forge
```

| From `eastside-markets/` | Into clone |
|---|---|
| `src/lib/supabase/markets.ts` | `src/lib/supabase/markets.ts` |
| `src/components/sportsbook/markets-board.tsx` | `src/components/sportsbook/markets-board.tsx` |
| `supabase/prediction-markets.sql` | `supabase/prediction-markets.sql` |
| `public/odds/superbowl-top6-latest.json` | `public/odds/superbowl-top6-latest.json` |

Optional reference copy also lives at `src/lib/supabase/superbowl-top6-latest.json`.

## Wire steps

1. `patches/store-booktab.txt` — add `"markets"` to `BookTab`
2. `patches/app-shell.md` — Landmark icon, label `Markets`, `<MarketsBoard />`
3. Or run: `node …/eastside-markets/patch-markets-tab.mjs`
4. Add `VITE_EASTSIDE_ADMIN_EMAILS` to `.env.local`

## Super Bowl seed outcomes (exact JSON team strings)

From `public/odds/superbowl-top6-latest.json`:

1. Los Angeles Rams (+500)
2. Buffalo Bills (+1000)
3. Baltimore Ravens (+1000)
4. Seattle Seahawks (+1300)
5. Kansas City Chiefs (+1600)
6. New England Patriots (+1650)

## Poke

```powershell
npm run dev
```

Open http://localhost:8080 → **Markets** tab  
- See Super Bowl market live with six teams  
- Buy with E$L coin$; admin resolves later  

## Do NOT

- Real money / Kalshi / Polymarket integration
- Wellness features
- Auto-approve all proposals
- Invent resolutions
- Wipe Arcade / Board / Chat / E$L challenges
