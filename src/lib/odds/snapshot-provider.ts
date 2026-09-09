import { SNAPSHOT_BOARD } from "./snapshot";
import type { OddsBoard, OddsProvider } from "./types";

export const snapshotOddsProvider: OddsProvider = {
  id: "snapshot",
  label: "BetMGM snapshot",
  peekBoard(): OddsBoard {
    return SNAPSHOT_BOARD;
  },
  async getBoard(): Promise<OddsBoard> {
    return SNAPSHOT_BOARD;
  },
};
