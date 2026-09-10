/**
 * Thin arcade bankroll wrappers against useBook getState().bankroll.
 *
 * Currency: **E$L coin$**. STARTING_BANKROLL = 100 (same as Board).
 * Simulation only — not real money.
 *
 * ## Calling set without breaking zustand persist
 *
 * Prefer the injected get/set from inside a store action, OR the store API:
 *
 *   import { useBook } from "@/lib/betting/store";
 *   import { canStake, spendStake, creditWin } from "@/lib/arcade/bankroll";
 *
 *   const get = useBook.getState;
 *   // useBook.setState merges into the persisted slice; partialize still
 *   // writes bankroll. Do NOT replace the whole store object.
 *   const set = useBook.setState;
 *
 *   if (!canStake(stake, get)) return;
 *   spendStake(stake, get, set);           // deduct on lock
 *   // … later when graded win (even money):
 *   creditWin(stake, get, set);            // +stake (stake was already spent)
 *   // push: creditWin(stake, …) refunds the spent stake
 *   // loss: do nothing (stake already spent)
 *
 * Optional: add setBankroll / adjustBankroll on BookState itself and pass
 * those instead — same persist behavior as long as you only patch `bankroll`.
 */

export type BookGet = () => { bankroll: number };
export type BookSet = (
  partial:
    | { bankroll: number }
    | ((state: { bankroll: number }) => { bankroll: number }),
) => void;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** True when bankroll >= stake (stake 0 always ok). */
export function canStake(stake: number, get: BookGet): boolean {
  if (!Number.isFinite(stake) || stake < 0) return false;
  return get().bankroll >= stake;
}

/**
 * Deduct stake on lock / immediate play.
 * Returns false if bankroll < stake (no mutation).
 */
export function spendStake(stake: number, get: BookGet, set: BookSet): boolean {
  if (!canStake(stake, get)) return false;
  if (stake === 0) return true;
  const next = round2(get().bankroll - stake);
  set({ bankroll: next });
  return true;
}

/**
 * Credit a win (even money) or push refund.
 * After spendStake(stake), a win pays +stake (net even); a push also +stake.
 * Do not call on loss.
 */
export function creditWin(amount: number, get: BookGet, set: BookSet): void {
  if (!Number.isFinite(amount) || amount <= 0) return;
  set({ bankroll: round2(get().bankroll + amount) });
}

/** Settle helper: won → credit stake; push → refund stake; lost/void → no credit. */
export function settleStake(
  outcome: "won" | "lost" | "push" | "void",
  stake: number,
  get: BookGet,
  set: BookSet,
): number {
  if (outcome === "won" || outcome === "push") {
    creditWin(stake, get, set);
    return stake;
  }
  return 0;
}
