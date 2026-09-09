/**
 * Canonical scores contract.
 *
 * UI must depend on these types + ScoresProvider only. ESPN public
 * scoreboard and a future paid feed (The Odds API scores, or similar)
 * both map into GameScore so the ticker, game cards, and tickets never
 * change when the feed is swapped.
 *
 * Prototype statuses:
 *   snapshot — frozen score from a bake
 *   pending  — on the slate (pregame or in progress)
 *   final    — game complete
 *
 * PROTOTYPE: unofficial ESPN feed, no paid data, no real money.
 * Production: paid live feed + Supabase.
 */

import type { TeamAbbr } from "@/lib/nfl/teams";
import type { FeedStatus } from "@/lib/odds/types";

export type ScorePhase = "snapshot" | "pending" | "final";

export type ScoresSourceId = "snapshot" | "espn" | "the-odds-api";

export interface GameScore {
  gameId: string;
  home: TeamAbbr;
  away: TeamAbbr;
  homeScore: number | null;
  awayScore: number | null;
  phase: ScorePhase;
  inProgress: boolean;
  clock: string | null;
  quarter: string | null;
}

export interface ScoreBoard {
  status: FeedStatus;
  reason: string | null;
  asOf: string | null;
  games: GameScore[];
}

export interface ScoresProvider {
  readonly id: ScoresSourceId;
  readonly label: string;
  peekBoard(): ScoreBoard;
  getBoard(): Promise<ScoreBoard>;
}

export const EMPTY_SCORE_BOARD: ScoreBoard = {
  status: "unavailable",
  reason: "Scores unavailable",
  asOf: null,
  games: [],
};

export const SCORES_UNAVAILABLE = "Scores unavailable";

export function unavailableScoreBoard(): ScoreBoard {
  return {
    status: "error",
    reason: SCORES_UNAVAILABLE,
    asOf: null,
    games: [],
  };
}

export function boardHasInProgress(board: ScoreBoard): boolean {
  return board.games.some((game) => game.inProgress);
}
