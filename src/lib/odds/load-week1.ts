/**
 * Fail-soft loader for Go Birds DraftKings Week-1 dump.
 *
 * Fetches /odds/week1-latest.json (Vite public asset). Never invents lines.
 * On miss/parse failure returns ok:false so the UI can keep the BetMGM snapshot.
 *
 * Laptop drop-in:
 *   C:\Users\rober\src\otter-prairie-urban-forge\src\lib\odds\load-week1.ts
 */

import {
  parseGoBirdsOddsDump,
  type GoBirdsDumpGame,
  type GoBirdsOddsDump,
} from "./go-birds-dump";
import {
  boardNoteFromDump,
  mapDumpToOddsBoard,
  type GameLineWithLive,
} from "./map-dump-to-board";
import type { OddsBoard } from "@/lib/odds/types";

export const WEEK1_ODDS_URL = "/odds/week1-latest.json";

export interface Week1OddsLoad {
  ok: boolean;
  pulledAt: string | null;
  book: string | null;
  games: GameLineWithLive[];
  liveCount: number;
  note: string;
  /** Present when ok — ready OddsBoard for the provider. */
  board: OddsBoard | null;
  /** Raw dump when parse succeeded (even if 0 games). */
  dump: GoBirdsOddsDump | null;
  error?: string;
}

const FAIL = (note: string, error: string): Week1OddsLoad => ({
  ok: false,
  pulledAt: null,
  book: null,
  games: [],
  liveCount: 0,
  note,
  board: null,
  dump: null,
  error,
});

/**
 * Fetch + parse Go Birds dump. Fail-soft: network/JSON/shape errors → ok:false.
 */
export async function loadWeek1Odds(
  url: string = WEEK1_ODDS_URL,
  init?: RequestInit,
): Promise<Week1OddsLoad> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      ...init,
    });
    if (!res.ok) {
      return FAIL(
        "Go Birds dump unavailable — keeping existing snapshot",
        `HTTP ${res.status}`,
      );
    }
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      return FAIL(
        "Go Birds dump unreadable — keeping existing snapshot",
        "invalid JSON",
      );
    }
    const dump = parseGoBirdsOddsDump(json);
    if (!dump) {
      return FAIL(
        "Go Birds dump shape unrecognized — keeping existing snapshot",
        "parse failed",
      );
    }
    const book = dump.book?.trim() || dump.source?.trim() || "DraftKings";
    const board = mapDumpToOddsBoard(dump);
    const games = board.games as GameLineWithLive[];
    const liveCount = games.filter((g) => g.live).length;
    const note = boardNoteFromDump(dump);
    if (board.status !== "ready" || games.length === 0) {
      return {
        ok: false,
        pulledAt: dump.pulledAt,
        book,
        games: [],
        liveCount: 0,
        note,
        board: null,
        dump,
        error: board.reason ?? "no games",
      };
    }
    return {
      ok: true,
      pulledAt: dump.pulledAt,
      book,
      games,
      liveCount,
      note,
      board,
      dump,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "fetch failed";
    return FAIL(
      "Go Birds dump fetch failed — keeping existing snapshot",
      message,
    );
  }
}

/** Sync helper when raw dump JSON is already in hand (tests / SSR). */
export function week1FromDumpJson(raw: unknown): Week1OddsLoad {
  const dump = parseGoBirdsOddsDump(raw);
  if (!dump) {
    return FAIL(
      "Go Birds dump shape unrecognized — keeping existing snapshot",
      "parse failed",
    );
  }
  const book = dump.book?.trim() || dump.source?.trim() || "DraftKings";
  const board = mapDumpToOddsBoard(dump);
  const games = board.games as GameLineWithLive[];
  const liveCount = games.filter((g) => g.live).length;
  const note = boardNoteFromDump(dump);
  if (board.status !== "ready" || games.length === 0) {
    return {
      ok: false,
      pulledAt: dump.pulledAt,
      book,
      games: [],
      liveCount: 0,
      note,
      board: null,
      dump,
      error: board.reason ?? "no games",
    };
  }
  return {
    ok: true,
    pulledAt: dump.pulledAt,
    book,
    games,
    liveCount,
    note,
    board,
    dump,
  };
}

export type { GoBirdsDumpGame, GoBirdsOddsDump };
