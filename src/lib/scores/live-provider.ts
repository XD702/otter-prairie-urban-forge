/**
 * Stub for a paid scores feed (The Odds API scores, or similar).
 *
 * Swap ACTIVE_SCORES_PROVIDER in ./index.ts to this object when a live key
 * exists. Map API events onto GameScore (home/away TeamAbbr, phase, clock,
 * quarter, scores). Do not change ticker, game cards, or tickets.
 *
 * PROTOTYPE: not wired. Current live source is espnScoresProvider.
 * Production: paid scores feed + Supabase.
 */

import { unavailableScoreBoard, type ScoreBoard, type ScoresProvider } from "./types";

const UNAVAILABLE: ScoreBoard = unavailableScoreBoard();

export const theOddsApiScoresProvider: ScoresProvider = {
  id: "the-odds-api",
  label: "The Odds API scores",
  peekBoard(): ScoreBoard {
    return UNAVAILABLE;
  },
  async getBoard(): Promise<ScoreBoard> {
    return UNAVAILABLE;
  },
};
