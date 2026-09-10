/**
 * Append-only arcade history in localStorage key `eastside-arcade-v1`.
 * Simulation only — not real money.
 */

import {
  ARCADE_HISTORY_KEY,
  type ArcadeOutcome,
  type ArcadeResult,
} from "./types";

const MAX_ENTRIES = 200;

function readRaw(): ArcadeResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ARCADE_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as ArcadeResult[];
  } catch {
    return [];
  }
}

function writeRaw(entries: ArcadeResult[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      ARCADE_HISTORY_KEY,
      JSON.stringify(entries.slice(0, MAX_ENTRIES)),
    );
  } catch {
    /* quota / private mode — ignore */
  }
}

export function loadArcadeHistory(): ArcadeResult[] {
  return readRaw();
}

/** Append one result (newest first). */
export function appendArcadeResult(result: ArcadeResult): void {
  const next = [result, ...readRaw()].slice(0, MAX_ENTRIES);
  writeRaw(next);
}

/** Update an existing pending entry (e.g. grade pick'em / matchup-dodge). */
export function updateArcadeResult(
  id: string,
  patch: Partial<Pick<ArcadeResult, "outcome" | "payout" | "detail" | "meta">>,
): ArcadeResult | null {
  const list = readRaw();
  const idx = list.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const updated: ArcadeResult = { ...list[idx], ...patch };
  list[idx] = updated;
  writeRaw(list);
  return updated;
}

export function listPending(): ArcadeResult[] {
  return readRaw().filter((r) => r.outcome === "pending");
}

export function listByGame(gameId: ArcadeResult["gameId"]): ArcadeResult[] {
  return readRaw().filter((r) => r.gameId === gameId);
}

export type { ArcadeOutcome, ArcadeResult };
