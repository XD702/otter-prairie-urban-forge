/**
 * Drop-in OddsProvider: prefer Go Birds DK dump; else BetMGM snapshot.
 *
 * Wire by swapping ACTIVE_ODDS_PROVIDER in src/lib/odds/index.ts, or by
 * following use-feeds-patch.md (async prefer dump, sync peek stays snapshot
 * until first successful load).
 *
 * Laptop path:
 *   C:\Users\rober\src\otter-prairie-urban-forge\src\lib\odds\go-birds-provider.ts
 */

import { snapshotOddsProvider } from "./snapshot-provider";
import { SNAPSHOT_BOARD } from "./snapshot";
import { loadWeek1Odds } from "./load-week1";
import type { OddsBoard, OddsProvider } from "./types";

let cached: OddsBoard | null = null;

export const goBirdsOddsProvider: OddsProvider = {
  id: "snapshot", // keep OddsSourceId union stable; dump is still a file feed
  label: "Go Birds DraftKings dump",
  peekBoard(): OddsBoard {
    return cached ?? SNAPSHOT_BOARD;
  },
  async getBoard(): Promise<OddsBoard> {
    const loaded = await loadWeek1Odds();
    if (loaded.ok && loaded.board) {
      cached = loaded.board;
      return loaded.board;
    }
    // Fail-soft: keep existing USA Today / BetMGM snapshot. Never invent.
    return cached ?? snapshotOddsProvider.peekBoard();
  },
};

/** Test helper — clear in-memory dump cache. */
export function resetGoBirdsOddsCache(): void {
  cached = null;
}
