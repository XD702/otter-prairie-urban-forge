/**
 * Fantasy module — UI imports roster / league data from here only.
 *
 * PROTOTYPE. Production: live roster + Supabase.
 * Points overlay: Go Birds Yahoo dump via scrape-ingest (fail-soft).
 */

import { ROSTER } from "./roster";
import {
  DEFAULT_TEAM_ID,
  getWeek1Matchups,
  loadRosterForTeam,
  LEAGUE,
  MATCHUPS,
  TEAMS,
} from "./league-data";
import type { FantasyRoster } from "./types";

export type {
  FantasyFeedStatus,
  FantasyPlayer,
  FantasyPosition,
  FantasyRoster,
  LineupSlot,
} from "./types";

export type { LeagueTeam, WeekMatchup } from "./league-data";

export type {
  YahooLeagueDump,
  YahooTeam,
  YahooRosterPlayer,
  YahooMatchup,
  YahooMatchupScores,
  ScrapeFetchResult,
  MatchupWithScrapeTotals,
  MatchupSideTotals,
} from "./scrape-types";

export { EMPTY_LINEUP, EMPTY_ROSTER } from "./types";
export {
  DEFAULT_TEAM_ID,
  getWeek1Matchups,
  loadRosterForTeam,
  LEAGUE,
  MATCHUPS,
  TEAMS,
  getTeamById,
  getTeamByName,
} from "./league-data";

export {
  SCRAPE_URL,
  fetchScrape,
  parseLeagueDump,
  findScrapeTeam,
  mergeRosterWithScrape,
  mergeMatchupsWithScrape,
  formatScrapeAge,
  applyPulledAt,
} from "./scrape-ingest";

export { SCORING_SETTINGS } from "./scoring-settings";

/** Default left-rail roster (Go birds / Roberto). */
export function loadRoster(): FantasyRoster {
  return ROSTER;
}

export function loadRosterByTeamId(teamId?: string): FantasyRoster {
  return loadRosterForTeam(teamId ?? DEFAULT_TEAM_ID);
}

export {
  EMPTY_MATCHUP_RESULTS,
  buildStandingsFromResults,
  standingsArePlaceholders,
} from "./standings";
export type { StandingRow, MatchupResult } from "./standings";

export {
  PLAYOFF_WEEKS,
  PLAYOFF_TEAM_COUNT,
  buildEmptyBracket,
  roundLabel,
  slotsForWeek,
} from "./playoffs";
export type { BracketSlot } from "./playoffs";

export {
  KEEPER_SLOTS_PER_TEAM,
  listKeepersForTeam,
  loadKeepersFromStorage,
  mergeKeepersWithStorage,
  rosterPlayersForTeam,
  saveKeepersToStorage,
  setKeeperForTeam,
} from "./keepers";
export type { KeeperEntry, KeepersMap } from "./keepers";
