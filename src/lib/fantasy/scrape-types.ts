/**
 * Go Birds Yahoo dump types (league-288732-latest.json).
 * Screenshot seed remains baseline; this is overlay-only.
 * Do not invent points — missing → null / —.
 */

export type YahooRosterSlot = "start" | "bench" | string;

export interface YahooRosterPlayer {
  name: string;
  pos: string;
  nflTeam: string;
  slot: YahooRosterSlot;
  status: string;
  /** Optional — only when Go Birds emits; never invent. */
  projectedPts?: number | null;
  /** Optional — only when Go Birds emits; never invent. */
  actualPts?: number | null;
  /** Optional stable id if Go Birds adds later. */
  id?: string | null;
}

export interface YahooTeam {
  teamId: string;
  name: string;
  manager: string;
  roster: YahooRosterPlayer[];
}

/**
 * Matchup scores — usually {}.
 * Optional keys when available (number | null only).
 */
export interface YahooMatchupScores {
  leftProjected?: number | null;
  leftActual?: number | null;
  rightProjected?: number | null;
  rightActual?: number | null;
  [key: string]: unknown;
}

export interface YahooMatchup {
  week: number;
  leftTeamId: string;
  rightTeamId: string;
  scores: YahooMatchupScores;
}

export interface YahooLeagueDump {
  leagueId: string;
  leagueKey: string;
  pulledAt: string | null;
  source: string;
  settings: Record<string, unknown>;
  teams: YahooTeam[];
  matchups: YahooMatchup[];
  standings: unknown[];
}

export type ScrapeFetchOk = {
  ok: true;
  reason: null;
  scrapedAt: string | null;
  data: YahooLeagueDump;
};

export type ScrapeFetchErr = {
  ok: false;
  reason: string;
  scrapedAt: null;
  data: null;
};

export type ScrapeFetchResult = ScrapeFetchOk | ScrapeFetchErr;

/** Enriched matchup side totals from dump scores (null when absent). */
export interface MatchupSideTotals {
  teamId: string;
  projectedTotal: number | null;
  actualTotal: number | null;
}

export interface MatchupWithScrapeTotals {
  week: number;
  a: MatchupSideTotals;
  b: MatchupSideTotals;
}
