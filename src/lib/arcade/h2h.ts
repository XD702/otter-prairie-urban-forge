/**
 * Head-to-head Arcade side bets via the existing E$L challenges ledger.
 *
 * Rules (same as E$L tab / eesl_challenges RPCs):
 * - Challenger proposes stake + terms; funds checked, NOT deducted on create.
 * - Opponent accept → each puts up stake; pot = 2×stake.
 * - Decline / cancel (open) → no balance change.
 * - Settle challenger|opponent → winner gets 2×stake; push → refund stake each.
 * - Reject insufficient; both must be Eastside chat members.
 * - STARTING_BANKROLL / seed = 100 E$L coin$ once. Simulation only.
 *
 * Solo Arcade games keep optional personal stake vs house (useBook bankroll).
 * H2H uses this ledger — do not double-spend local bankroll for the same pot.
 */

import {
  acceptChallenge,
  cancelChallenge,
  createChallenge,
  declineChallenge,
  listChallenges,
  listOpponentOptions,
  settleChallenge,
  type EeslChallenge,
  type EeslOpponentOption,
  type EeslSettleResult,
  EESL_LABEL,
  EESL_SIM_DISCLAIMER,
} from "@/lib/supabase/eesl";
import type { ArcadeGameId } from "./types";

export const ARCADE_H2H_PREFIX = "Arcade";

export { EESL_LABEL, EESL_SIM_DISCLAIMER };
export type { EeslChallenge, EeslOpponentOption, EeslSettleResult };

const GAME_LABEL: Partial<Record<ArcadeGameId, string>> = {
  "matchup-dodge": "Matchup Dodge",
  pong: "Pong",
  chess: "Chess",
  "tic-tac-toe": "Tic-Tac-Toe",
  "coin-toss": "Coin Toss",
  "endless-runner": "Endless Runner",
};

/** Terms for generic classic / sports H2H (≤280). */
export function arcadeH2HTerms(
  gameId: ArcadeGameId,
  extra: string,
): string {
  const label = GAME_LABEL[gameId] ?? gameId;
  const raw = `${ARCADE_H2H_PREFIX} ${label} · ${extra}`;
  return raw.length <= 280 ? raw : raw.slice(0, 277) + "...";
}

/** Build terms string embedding matchup + pick (≤280 chars). */
export function matchupDodgeTerms(opts: {
  matchupId: string;
  aName: string;
  bName: string;
  pickTeamId: string;
  pickName: string;
}): string {
  return arcadeH2HTerms(
    "matchup-dodge",
    `${opts.matchupId} · ${opts.aName} vs ${opts.bName} · pick:${opts.pickTeamId} (${opts.pickName})`,
  );
}

export function isArcadeChallenge(c: EeslChallenge): boolean {
  return c.terms.startsWith(ARCADE_H2H_PREFIX);
}

export function isArcadeMatchupChallenge(c: EeslChallenge): boolean {
  return c.terms.startsWith(`${ARCADE_H2H_PREFIX} Matchup Dodge`);
}

export function parsePickFromTerms(terms: string): string | null {
  const m = terms.match(/pick:([a-z0-9-]+)/i);
  return m?.[1] ?? null;
}

/** Propose H2H stake. Stake must be > 0 (RPC rule). */
export async function proposeArcadeChallenge(
  opponentId: string,
  stake: number,
  gameId: ArcadeGameId,
  extra: string,
): Promise<string> {
  if (!(stake > 0)) {
    throw new Error(`H2H stake must be greater than zero ${EESL_LABEL}.`);
  }
  return createChallenge(opponentId, stake, arcadeH2HTerms(gameId, extra));
}

export async function proposeMatchupDodgeChallenge(
  opponentId: string,
  stake: number,
  termsOpts: Parameters<typeof matchupDodgeTerms>[0],
): Promise<string> {
  if (!(stake > 0)) {
    throw new Error(`H2H stake must be greater than zero ${EESL_LABEL}.`);
  }
  return createChallenge(opponentId, stake, matchupDodgeTerms(termsOpts));
}

export async function listArcadeH2HChallenges(): Promise<EeslChallenge[]> {
  const all = await listChallenges(["open", "accepted", "settled"]);
  return all.filter(isArcadeChallenge);
}

export {
  acceptChallenge,
  cancelChallenge,
  declineChallenge,
  settleChallenge,
  listOpponentOptions,
};

/**
 * Map graded outcome onto EeslSettleResult relative to challenger.
 * Never invent — caller only when a real winner (or push) is known.
 */
export function settleResultForPick(opts: {
  challengerPickTeamId: string;
  winnerTeamId: string | null;
}): EeslSettleResult {
  if (opts.winnerTeamId == null) return "push";
  return opts.winnerTeamId === opts.challengerPickTeamId
    ? "challenger"
    : "opponent";
}
