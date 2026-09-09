/**
 * Odds module — the only import path the UI should use.
 *
 * Swap ACTIVE_ODDS_PROVIDER to `theOddsApiProvider` when going live.
 * Board / slip / tickets consume OddsBoard and never the snapshot file.
 *
 * PROTOTYPE. Production: The Odds API + Supabase.
 */

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

/** Active feed. Change this one binding to replace snapshot with live odds. */
export const ACTIVE_ODDS_PROVIDER: OddsProvider = snapshotOddsProvider;

export function peekOddsBoard(): OddsBoard {
  return ACTIVE_ODDS_PROVIDER.peekBoard();
}

export function loadOddsBoard(): Promise<OddsBoard> {
  return ACTIVE_ODDS_PROVIDER.getBoard();
}
