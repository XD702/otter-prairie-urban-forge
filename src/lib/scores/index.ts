/**
 * Scores module — the only import path the UI should use.
 *
 * Swap ACTIVE_SCORES_PROVIDER to `theOddsApiScoresProvider` when a paid
 * feed is wired. Ticker / cards / slips consume ScoreBoard and never ESPN
 * or snapshot files.
 *
 * PROTOTYPE: ESPN public scoreboard (unofficial). Production: paid scores
 * feed (The Odds API or similar) + Supabase.
 */

import { espnScoresProvider } from "./espn-provider";
import type { ScoreBoard, ScoresProvider } from "./types";

export type {
  GameScore,
  ScoreBoard,
  ScorePhase,
  ScoresProvider,
  ScoresSourceId,
} from "./types";

export {
  EMPTY_SCORE_BOARD,
  SCORES_UNAVAILABLE,
  boardHasInProgress,
  unavailableScoreBoard,
} from "./types";
export { liveLine, scorePair } from "./format";
export { theOddsApiScoresProvider } from "./live-provider";
export { snapshotScoresProvider } from "./snapshot-provider";
export { espnScoresProvider };

/** Active feed. Change this one binding to replace ESPN with a paid source. */
export const ACTIVE_SCORES_PROVIDER: ScoresProvider = espnScoresProvider;

export function peekScoreBoard(): ScoreBoard {
  return ACTIVE_SCORES_PROVIDER.peekBoard();
}

export function loadScoreBoard(): Promise<ScoreBoard> {
  return ACTIVE_SCORES_PROVIDER.getBoard();
}
