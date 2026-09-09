/**
 * Current live scores source — ESPN public scoreboard (unofficial).
 *
 * Swap ACTIVE_SCORES_PROVIDER in ./index.ts to `theOddsApiScoresProvider`
 * (or another ScoresProvider) without touching ticker / cards / slips.
 * Fail-soft: errors never throw.
 */

import { fetchEspnScoreBoard } from "./fetch-espn";
import { unavailableScoreBoard, type ScoresProvider } from "./types";

const IDLE = unavailableScoreBoard();

export const espnScoresProvider: ScoresProvider = {
  id: "espn",
  label: "ESPN scoreboard",
  peekBoard() {
    return IDLE;
  },
  async getBoard() {
    try {
      return await fetchEspnScoreBoard();
    } catch {
      return unavailableScoreBoard();
    }
  },
};
