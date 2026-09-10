/**
 * Keeper stubs for League of Eastside Legends.
 *
 * Never invent player names. Rows start empty (playerId/name null).
 * Optional localStorage (`eastside-keepers-v1`) stores only players the user
 * picks from existing TEAMS seed roster ids/names.
 *
 * PROTOTYPE. Simulation only. No real money.
 */

import { TEAMS, getTeamById } from "./league-data";
import type { FantasyPlayer, LineupSlot } from "./types";

export const KEEPER_SLOTS_PER_TEAM = 1;

export const KEEPERS_STORAGE_KEY = "eastside-keepers-v1";

export interface KeeperEntry {
  teamId: string;
  playerId: string | null;
  playerName: string | null;
  note: string | null;
}

/** One empty stub row per team — no invented keepers. */
export const KEEPERS: KeeperEntry[] = TEAMS.map((t) => ({
  teamId: t.id,
  playerId: null,
  playerName: null,
  note: null,
}));

export function listKeepersForTeam(
  teamId: string,
  entries: KeeperEntry[] = KEEPERS,
): KeeperEntry[] {
  return entries.filter((e) => e.teamId === teamId);
}

function playersFromSlots(slots: LineupSlot[]): FantasyPlayer[] {
  const out: FantasyPlayer[] = [];
  for (const s of slots) {
    if (s.player) out.push(s.player);
  }
  return out;
}

/** Roster players available to mark as keeper (seed data only). */
export function rosterPlayersForTeam(teamId: string): FantasyPlayer[] {
  const team = getTeamById(teamId);
  if (!team) return [];
  const { slots, bench, ir } = team.roster;
  const seen = new Set<string>();
  const all = [...playersFromSlots(slots), ...playersFromSlots(bench), ...playersFromSlots(ir)];
  return all.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

export type KeepersMap = Record<string, { playerId: string; playerName: string } | null>;

export function loadKeepersFromStorage(): KeepersMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEEPERS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: KeepersMap = {};
    for (const [teamId, val] of Object.entries(parsed as Record<string, unknown>)) {
      if (!TEAMS.some((t) => t.id === teamId)) continue;
      if (val === null) {
        out[teamId] = null;
        continue;
      }
      if (
        val &&
        typeof val === "object" &&
        typeof (val as { playerId?: unknown }).playerId === "string" &&
        typeof (val as { playerName?: unknown }).playerName === "string"
      ) {
        const playerId = (val as { playerId: string }).playerId;
        const playerName = (val as { playerName: string }).playerName;
        // Only accept ids that exist on that team's seeded roster
        const allowed = rosterPlayersForTeam(teamId);
        if (allowed.some((p) => p.id === playerId && p.name === playerName)) {
          out[teamId] = { playerId, playerName };
        }
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function saveKeepersToStorage(map: KeepersMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEEPERS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota / private mode
  }
}

export function setKeeperForTeam(
  map: KeepersMap,
  teamId: string,
  player: FantasyPlayer | null,
): KeepersMap {
  const next = { ...map };
  if (!player) {
    next[teamId] = null;
  } else {
    const allowed = rosterPlayersForTeam(teamId);
    if (!allowed.some((p) => p.id === player.id)) {
      return map;
    }
    next[teamId] = { playerId: player.id, playerName: player.name };
  }
  return next;
}

/** Merge seed stubs with localStorage picks for display. */
export function mergeKeepersWithStorage(
  stored: KeepersMap,
  stubs: KeeperEntry[] = KEEPERS,
): KeeperEntry[] {
  return stubs.map((stub) => {
    const pick = stored[stub.teamId];
    if (!pick) {
      return { ...stub, playerId: null, playerName: null };
    }
    return {
      ...stub,
      playerId: pick.playerId,
      playerName: pick.playerName,
      note: stub.note,
    };
  });
}
