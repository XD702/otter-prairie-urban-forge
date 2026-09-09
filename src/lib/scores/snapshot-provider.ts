import { SNAPSHOT_SCORES } from "./snapshot";
import type { ScoreBoard, ScoresProvider } from "./types";

export const snapshotScoresProvider: ScoresProvider = {
  id: "snapshot",
  label: "Go Birds score snapshot",
  peekBoard(): ScoreBoard {
    return SNAPSHOT_SCORES;
  },
  async getBoard(): Promise<ScoreBoard> {
    return SNAPSHOT_SCORES;
  },
};
