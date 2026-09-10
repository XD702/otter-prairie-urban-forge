# HOWTO — E$L coin$ side-bet challenges (Eastside)

Simulation only — not real money.  
User-facing currency spelling is exact: **E$L coin$** (with dollar signs).  
Code/table ids stay `eesl_*`. Tab label: **E$L**.

## One balance rule

- Board sim bets and challenges share the same signed-in balance (`eesl_balances`).
- Every signed-in user starts with **100 E$L coin$ once** (`ensure_eesl_balance` INSERT only when no row — never +100 again).
- Matches `STARTING_BANKROLL = 100` in `src/lib/betting/store.ts`.
- Logged out: Board keeps local zustand bankroll; challenges require sign-in.

## Escrow rules (SQL RPCs)

| Action | Balance |
|---|---|
| Create | Check challenger ≥ stake; **do not** deduct |
| Accept | Each puts up `stake`; pot = 2×stake; reject if opponent insufficient |
| Decline | No change |
| Cancel (open only, challenger) | No change |
| Settle challenger/opponent | Winner gets 2×stake |
| Settle push | Refund `stake` to each |

No auto-grade from Yahoo. Manual settle by either participant.

## Auth / SQL checklist

1. Open https://supabase.com/dashboard → project `yqnbeksemcgmggframnd`
2. Confirm **league-chat.sql** already applied (`is_eastside_chat_member` exists)
3. SQL Editor → New query → paste and run `supabase/eesl-challenges.sql`
4. Authentication → Email OTP / magic link enabled; URL allow `http://localhost:8080`
5. Client uses **anon key only** — never service role in the app

## Copy into laptop clone

```powershell
cd C:\Users\rober\src\otter-prairie-urban-forge
```

| From `eastside-eesl/` | Into clone |
|---|---|
| `src/lib/supabase/eesl.ts` | `src/lib/supabase/eesl.ts` |
| `src/components/sportsbook/eesl-challenges.tsx` | `src/components/sportsbook/eesl-challenges.tsx` |
| `supabase/eesl-challenges.sql` | `supabase/eesl-challenges.sql` |

## Wire steps

1. `patches/store-booktab.txt` — add `"challenges"` to `BookTab`
2. `patches/app-shell.md` — Coins icon, tab label `E$L`, `<EeslChallenges />`
3. Or run `node …/eastside-eesl/patch-eesl-tab.mjs` on the laptop
4. `patches/chip-counter-label.md` — show **E$L coin$** on chip/bankroll labels; keep sim disclaimer
5. Optional: pass `setLocalBankroll` so Board chip counter tracks remote balance when signed in

## Poke

```powershell
npm run dev
```

Open http://localhost:8080 → **E$L** tab  
- Logged out: Sign-in CTA + “Simulation only — not real money.”  
- Signed in: balance shows `N E$L coin$`, create/accept/decline/settle challenges  

## Do NOT

- Real money
- Auto-grade from Yahoo
- Service role in client
- Wipe Board / Chat / League / other features
- Re-seed +100 on every login
