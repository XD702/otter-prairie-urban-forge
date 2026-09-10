# HOWTO — Eastside Arcade

Simulation only — not real money.  
Currency spelling is exact: **E$L coin$**.  
Shares Board sim bankroll (`STARTING_BANKROLL = 100` in `src/lib/betting/store.ts`).

## Stake rules

| Mode | Ledger | Spend | Settle |
|---|---|---|---|
| **Solo** (vs house) | `useBook` zustand bankroll | Spend on lock / start | Win = even-money `creditWin(stake)`; push refund; loss keeps spent stake |
| **H2H** (1v1) | `eesl_challenges` RPCs (same as E$L tab) | Propose checks funds, **no deduct**; Accept = each puts up stake, pot 2× | Manual or grade-when-known: challenger / opponent / push |

- Stake **0** allowed for solo.
- Reject if bankroll < stake (`canStake`).
- H2H stake must be **> 0** (SQL/RPC).
- Never invent odds, players, scores, or injuries.
- Pending games (Pick'em / Matchup Dodge / H2H) stay pending until real scores or manual settle.

### Zustand persist (solo)

```ts
import { useBook } from "@/lib/betting/store";
import { canStake, spendStake, creditWin } from "@/lib/arcade/bankroll";

const get = useBook.getState;
const set = useBook.setState; // merges; partialize still persists bankroll
if (!canStake(stake, get)) return;
spendStake(stake, get, set);
// on win/push:
creditWin(stake, get, set);
```

## Games

### Sports
1. **NFL Quick Pick'em** — odds board away/home; empty state if no odds; grade from scores when `phase === "final"`.
2. **Higher / Lower** — 3 rounds; `|spread|` or `projectedPts` only; skip if missing.
3. **Speed Trivia** — 60s static pack (team names, NFL rules, go-birds roster facts).
4. **Matchup Dodge** — random Week 1 `MATCHUPS`; solo pending OK; **H2H E$L** via challenges ledger.

### Classics
5. **Pong** — canvas vs CPU (first to 5) + optional H2H E$L side-bet.
6. **Chess** — thin legal moves, local 2P or random-legal CPU + optional E$L challenge.
7. **Tic-Tac-Toe** — vs CPU / local 2P / H2H E$L.
8. **Coin Toss Flick** — timing charge + flick; house 0–5 or friend H2H 1–5 E$L.
9. **Endless Runner** — jump/dodge; buy-in prize table 400 even / 800×2 / 1500×3 (sim-only).

## Copy into laptop clone

```powershell
cd C:\Users\rober\src\otter-prairie-urban-forge
```

| From `eastside-arcade/` | Into clone |
|---|---|
| `src/lib/arcade/*` | `src/lib/arcade/` |
| `src/components/sportsbook/arcade-hub.tsx` | `src/components/sportsbook/arcade-hub.tsx` |
| `src/components/sportsbook/arcade/*` | `src/components/sportsbook/arcade/` |

Requires already-wired: `@/lib/odds`, `@/lib/scores`, `@/lib/fantasy` (MATCHUPS/TEAMS), `@/lib/betting/store` (`useBook`), `@/lib/supabase/eesl` (H2H), `useSupabaseSession`.

## Wire steps

1. Copy files (table above).
2. `patches/store-booktab.md` — add `"arcade"` to `BookTab`.
3. `patches/app-shell.md` — `Gamepad2` icon, tab `{ id: "arcade", label: "Arcade", icon: Gamepad2 }` → `<ArcadeHub />`.
4. Or run the CRLF-aware patcher: `node …\eastside-arcade\patch-arcade-tab.mjs` on the laptop (ROOT defaults to `C:/Users/rober/src/otter-prairie-urban-forge`).
5. Confirm E$L SQL (`eesl-challenges.sql`) already applied for H2H.

## Poke

```powershell
npm run dev
```

Open http://localhost:8080 → **Arcade** tab.  
Solo stake default 0. H2H needs sign-in + chat membership.

## Do NOT

- Real money
- Invent odds / scores / injuries / prize outcomes beyond the documented sim table
- Double-spend local bankroll for the same H2H pot (H2H = ledger only)
- Wipe Board / Chat / League / E$L / other features
- Wellness content
