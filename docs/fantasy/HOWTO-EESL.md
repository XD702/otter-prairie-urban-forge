# HOWTO â€” E$L coin$ side-bet challenges (Eastside)

Simulation only â€” not real money.  
User-facing currency spelling is exact: **E$L coin$** (with dollar signs).  
Code/table ids stay `eesl_*`. Tab path: **Club** → **E$L**.

## One balance rule

- Board sim bets and challenges share the same signed-in balance (`eesl_balances`).
- Every signed-in user starts with **100 E$L coin$ once** (`ensure_eesl_balance` INSERT only when no row â€” never +100 again).
- Matches `STARTING_BANKROLL = 100` in `src/lib/betting/store.ts`.
- Logged out: Board keeps local zustand bankroll; challenges require sign-in.

## Escrow rules (SQL RPCs)

| Action | Balance |
|---|---|
| Create | Check challenger â‰¥ stake; **do not** deduct |
| Accept | Each puts up `stake`; pot = 2Ã—stake; reject if opponent insufficient |
| Decline | No change |
| Cancel (open only, challenger) | No change |
| Settle challenger/opponent | Winner gets 2Ã—stake |
| Settle push | Refund `stake` to each |

No auto-grade from Yahoo. Manual settle by either participant.

## Auth / SQL checklist

1. Open https://supabase.com/dashboard â†’ project `yqnbeksemcgmggframnd`
2. Confirm **league-chat.sql** already applied (`is_eastside_chat_member` exists)
3. SQL Editor â†’ New query â†’ paste and run `supabase/eesl-challenges.sql`
4. Authentication â†’ Email OTP / magic link enabled; URL allow `http://localhost:8080`
5. Client uses **anon key only** â€” never service role in the app

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

1. `patches/store-booktab.txt` â€” add `"challenges"` to `BookTab`
2. `patches/app-shell.md` â€” Coins icon, tab label `E$L`, `<EeslChallenges />`
3. Or run `node â€¦/eastside-eesl/patch-eesl-tab.mjs` on the laptop
4. `patches/chip-counter-label.md` â€” show **E$L coin$** on chip/bankroll labels; keep sim disclaimer
5. Optional: pass `setLocalBankroll` so Board chip counter tracks remote balance when signed in

## Poke

```powershell
npm run dev
```

Open http://localhost:8080 → **Club** → **E$L**
- Logged out: Sign-in CTA + â€œSimulation only â€” not real money.â€  
- Signed in: balance shows `N E$L coin$`, create/accept/decline/settle challenges  

## Do NOT

- Real money
- Auto-grade from Yahoo
- Service role in client
- Wipe Board / Chat / League / other features
- Re-seed +100 on every login

## Redirect URLs (Supabase Auth)

Allow these in Authentication → URL configuration → Redirect URLs:

- `http://localhost:8080/**`
- `http://127.0.0.1:8080/**`
- `https://otter-prairie-urban-forge.grok.me/**`



