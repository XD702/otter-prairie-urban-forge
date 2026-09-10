/**
 * Canonical odds board contract.
 *
 * UI must depend on these types + OddsProvider only. Snapshot JSON and a
 * future The Odds API client both map into GameLine so the board, bet slip,
 * and tickets never change when the feed is swapped.
 *
 * PROTOTYPE: dated snapshot, no live paid data, no real money. Production
 * will use The Odds API (live moneylines/spreads/totals) and persist tickets
 * in Supabase.
 */

import type { TeamAbbr } from "@/lib/nfl/teams";

export type OddsSourceId = "snapshot" | "the-odds-api";

export type FeedStatus = "ready" | "unavailable" | "loading" | "error";

export interface MoneylineMarket {
  home: number | null;
  away: number | null;
  draw: number | null;
}

export interface SpreadMarket {
  homeLine: number | null;
  awayLine: number | null;
  homeJuice: number | null;
  awayJuice: number | null;
}

export interface TotalMarket {
  line: number | null;
  overJuice: number | null;
  underJuice: number | null;
}

export interface GameLine {
  id: string;
  startTime: string | null;
  kickoffLabel: string | null;
  week: number | null;
  home: TeamAbbr;
  away: TeamAbbr;
  book: string | null;
  venue: string | null;
  neutralSite: boolean;
  opener: boolean;
  /** True when lines are live/in-game (not kickoff). From Go Birds dump. */
  live?: boolean;
  moneyline: MoneylineMarket;
  spread: SpreadMarket;
  total: TotalMarket;
}

export interface OddsBoard {
  status: FeedStatus;
  reason: string | null;
  asOf: string | null;
  /** Citation printed on the board. Do not paraphrase. */
  sourceLabel: string | null;
  week: number | null;
  sourceBooks: string[];
  games: GameLine[];
}

export interface OddsProvider {
  readonly id: OddsSourceId;
  readonly label: string;
  /** Sync read for the baked snapshot. Live API may return EMPTY until fetched. */
  peekBoard(): OddsBoard;
  getBoard(): Promise<OddsBoard>;
}

export const EMPTY_ODDS_BOARD: OddsBoard = {
  status: "unavailable",
  reason: "Wednesday snapshot was not provided at build time.",
  asOf: null,
  sourceLabel: null,
  week: null,
  sourceBooks: [],
  games: [],
};
