/**
 * Stub for The Odds API.
 *
 * Swap ACTIVE_ODDS_PROVIDER in ./index.ts to this object when a live key
 * exists. Map API events onto GameLine (home/away TeamAbbr, American odds,
 * spread line + juice, total line + juice). Do not change board UI.
 *
 * PROTOTYPE: not wired. No paid feed. Production: live The Odds API +
 * Supabase for persistence.
 */

import { EMPTY_ODDS_BOARD } from "./types";
import type { OddsBoard, OddsProvider } from "./types";

const UNAVAILABLE: OddsBoard = {
  ...EMPTY_ODDS_BOARD,
  status: "unavailable",
  reason: "The Odds API is not wired in this prototype.",
  sourceBooks: [],
};

export const theOddsApiProvider: OddsProvider = {
  id: "the-odds-api",
  label: "The Odds API",
  peekBoard(): OddsBoard {
    return UNAVAILABLE;
  },
  async getBoard(): Promise<OddsBoard> {
    return UNAVAILABLE;
  },
};
