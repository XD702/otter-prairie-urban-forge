/**
 * Fantasy roster contract.
 *
 * Slots exist so the tracker UI can render a lineup card even when no
 * players have been provided. Do not invent player names or points.
 *
 * PROTOTYPE. Production: roster from league source, persisted in Supabase.
 * Points overlay: Go Birds Yahoo dump (see scrape-types / scrape-ingest).
 */

import type { TeamAbbr } from "@/lib/nfl/teams";

export type FantasyPosition = "QB" | "RB" | "WR" | "TE" | "FLEX" | "K" | "DEF" | "BN" | "IR";

export type FantasyFeedStatus = "ready" | "unavailable";

export interface FantasyPlayer {
  id: string;
  name: string;
  team: TeamAbbr | null;
  position: Exclude<FantasyPosition, "FLEX" | "BN" | "IR">;
  /** Injury / availability as provided. Do not invent. */
  status: string | null;
  /** From Go Birds dump when present — never invent. */
  projectedPts?: number | null;
  /** From Go Birds dump when present — never invent. */
  actualPts?: number | null;
}

export interface LineupSlot {
  id: string;
  position: FantasyPosition;
  label: string;
  note: string | null;
  player: FantasyPlayer | null;
}

export interface FantasyRoster {
  status: FantasyFeedStatus;
  reason: string | null;
  league: string;
  yahooId: string | null;
  ownerLabel: string | null;
  /** Yahoo fantasy team display name */
  teamName: string | null;
  /** Manager / owner label from Yahoo */
  manager: string | null;
  slots: LineupSlot[];
  bench: LineupSlot[];
  ir: LineupSlot[];
  /** Team totals from dump matchup scores when present. */
  projectedTotal?: number | null;
  actualTotal?: number | null;
  /** Dump pulledAt when last overlay applied. */
  scrapeScrapedAt?: string | null;
}

export const EMPTY_LINEUP: LineupSlot[] = [
  { id: "qb", position: "QB", label: "QB", note: null, player: null },
  { id: "rb1", position: "RB", label: "RB", note: null, player: null },
  { id: "rb2", position: "RB", label: "RB", note: null, player: null },
  { id: "wr1", position: "WR", label: "WR", note: null, player: null },
  { id: "wr2", position: "WR", label: "WR", note: null, player: null },
  { id: "te", position: "TE", label: "TE", note: null, player: null },
  { id: "flex", position: "FLEX", label: "FLEX", note: null, player: null },
  { id: "k", position: "K", label: "K", note: null, player: null },
  { id: "def", position: "DEF", label: "DEF", note: null, player: null },
];

export const EMPTY_ROSTER: FantasyRoster = {
  status: "unavailable",
  reason: "Fantasy roster was not provided at build time.",
  league: "League of Eastside Legends",
  yahooId: null,
  ownerLabel: null,
  teamName: null,
  manager: null,
  slots: EMPTY_LINEUP,
  bench: [],
  ir: [],
  projectedTotal: null,
  actualTotal: null,
  scrapeScrapedAt: null,
};
