/**
 * Odds module — the only import path the UI should use.
 *
 * Swap ACTIVE_ODDS_PROVIDER to `theOddsApiProvider` when going live.
 * Board / slip / tickets consume OddsBoard and never the snapshot file.
 *
 * PROTOTYPE. Production: The Odds API + Supabase.
 */

import { goBirdsOddsProvider } from "./go-birds-provider";
import { snapshotOddsProvider } from "./snapshot-provider";
import type { OddsBoard, OddsProvider } from "./types";

export type {
  FeedStatus,
  GameLine,
  MoneylineMarket,
  OddsBoard,
  OddsProvider,
  OddsSourceId,
  SpreadMarket,
  TotalMarket,
} from "./types";

export { EMPTY_ODDS_BOARD } from "./types";
export { theOddsApiProvider } from "./live-provider";
export { snapshotOddsProvider };
export { goBirdsOddsProvider } from "./go-birds-provider";
export { loadWeek1Odds, WEEK1_ODDS_URL } from "./load-week1";
export { parseGoBirdsOddsDump } from "./go-birds-dump";
export { mapDumpToOddsBoard, boardNoteFromDump } from "./map-dump-to-board";

/** Active feed. Prefer Go Birds DK dump; peek falls back to BetMGM until first successful getBoard(). */
export const ACTIVE_ODDS_PROVIDER: OddsProvider = goBirdsOddsProvider;

export function peekOddsBoard(): OddsBoard {
  return ACTIVE_ODDS_PROVIDER.peekBoard();
}

export function loadOddsBoard(): Promise<OddsBoard> {
  return ACTIVE_ODDS_PROVIDER.getBoard();
}
