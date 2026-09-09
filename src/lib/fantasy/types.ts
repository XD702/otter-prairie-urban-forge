/**
 * Fantasy roster contract.
 *
 * Slots exist so the tracker UI can render a lineup card even when no
 * players have been provided. Do not invent player names.
 *
 * PROTOTYPE. Production: roster from league source, persisted in Supabase.
 */

import type { TeamAbbr } from "@/lib/nfl/teams";

export type FantasyPosition = "QB" | "RB" | "WR" | "TE" | "FLEX" | "K" | "DEF" | "BN";

export type FantasyFeedStatus = "ready" | "unavailable";

export interface FantasyPlayer {
  id: string;
  name: string;
  team: TeamAbbr | null;
  position: Exclude<FantasyPosition, "FLEX" | "BN">;
  /** Injury / availability as provided. Do not invent. */
  status: string | null;
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
  slots: LineupSlot[];
  bench: LineupSlot[];
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
  slots: EMPTY_LINEUP,
  bench: [],
};
