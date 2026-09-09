/**
 * Score snapshot baked at build time.
 *
 * Leave empty until a real snapshot is inserted. Do not invent scores.
 *
 * PROTOTYPE. Production: swap ./index.ts to a live scores API. Supabase
 * planned for persisted finals / ticket settlement.
 */

import { EMPTY_SCORE_BOARD } from "./types";
import type { ScoreBoard } from "./types";

export const SNAPSHOT_SCORES: ScoreBoard = {
  ...EMPTY_SCORE_BOARD,
  status: "unavailable",
  reason: "Score snapshot was not provided at build time.",
  games: [],
};
