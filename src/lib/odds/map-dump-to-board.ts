/**
 * Map Go Birds DK dump → Prototype OddsBoard / GameLine.
 *
 * Preserves SNAPSHOT_BOARD game ids (wk1-…) when away/home match so ESPN
 * score overlay (slateGameId) keeps working. Never invents missing juice /
 * spreads / totals — leave null.
 *
 * live=true games are IN-GAME lines (not kickoff). Flagged via GameLine.live
 * (see types-live-patch.md) and kickoffLabel.
 *
 * Laptop drop-in path:
 *   C:\Users\rober\src\otter-prairie-urban-forge\src\lib\odds\map-dump-to-board.ts
 */

import { isTeamAbbr, type TeamAbbr } from "@/lib/nfl/teams";
import { SNAPSHOT_BOARD } from "@/lib/odds/snapshot";
import type { GameLine, OddsBoard } from "@/lib/odds/types";
import type { GoBirdsDumpGame, GoBirdsOddsDump } from "./go-birds-dump";

/** Thin board game (task contract) — useful for adapters / tests. */
export interface BoardGame {
  id: string;
  away: { name: string; abbr: string };
  home: { name: string; abbr: string };
  spread: {
    away: number | null;
    home: number | null;
    awayJuice: number | null;
    homeJuice: number | null;
  };
  total: {
    line: number | null;
    overJuice: number | null;
    underJuice: number | null;
  };
  moneyline: { away: number | null; home: number | null };
  live: boolean;
  book: string;
}

/** Extended GameLine with live flag (patch types.ts — see types-live-patch.md). */
export type GameLineWithLive = GameLine & { live?: boolean };

const NICKNAME_ABBR: Record<string, TeamAbbr> = {
  rams: "LAR",
  chargers: "LAC",
  jets: "NYJ",
  giants: "NYG",
  patriots: "NE",
  seahawks: "SEA",
  "49ers": "SF",
  saints: "NO",
  lions: "DET",
  browns: "CLE",
  jaguars: "JAX",
  bears: "CHI",
  panthers: "CAR",
  ravens: "BAL",
  colts: "IND",
  falcons: "ATL",
  steelers: "PIT",
  bills: "BUF",
  texans: "HOU",
  buccaneers: "TB",
  titans: "TEN",
  commanders: "WAS",
  eagles: "PHI",
  cardinals: "ARI",
  dolphins: "MIA",
  raiders: "LV",
  packers: "GB",
  vikings: "MIN",
  cowboys: "DAL",
  broncos: "DEN",
  chiefs: "KC",
};

/**
 * Parse scraped label like "NE Patriots", "LA Rams", "SF 49Ers".
 * Display name stays as scraped; abbr is canonical TeamAbbr (LAR/LAC/NYJ/NYG/SF).
 */
export function parseScrapedTeam(raw: string): { name: string; abbr: TeamAbbr } | null {
  const name = raw.trim();
  if (!name) return null;

  const nickKey = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .pop();

  if (nickKey && NICKNAME_ABBR[nickKey]) {
    return { name, abbr: NICKNAME_ABBR[nickKey] };
  }
  // "49Ers" typo → treat as 49ers
  if (/49\s*e?rs/i.test(name)) return { name, abbr: "SF" };

  const m = name.match(/^([A-Za-z]{2,3})\s+/);
  if (m) {
    const token = m[1].toUpperCase();
    if (token === "LA") {
      if (/rams/i.test(name)) return { name, abbr: "LAR" };
      if (/chargers/i.test(name)) return { name, abbr: "LAC" };
      return null;
    }
    if (token === "NY") {
      if (/jets/i.test(name)) return { name, abbr: "NYJ" };
      if (/giants/i.test(name)) return { name, abbr: "NYG" };
      return null;
    }
    if (isTeamAbbr(token)) return { name, abbr: token };
  }
  return null;
}

function snapshotMeta(
  away: TeamAbbr,
  home: TeamAbbr,
): Pick<
  GameLine,
  "id" | "startTime" | "kickoffLabel" | "venue" | "neutralSite" | "opener"
> | null {
  const hit = SNAPSHOT_BOARD.games.find((g) => g.away === away && g.home === home);
  if (!hit) return null;
  return {
    id: hit.id,
    startTime: hit.startTime,
    kickoffLabel: hit.kickoffLabel,
    venue: hit.venue,
    neutralSite: hit.neutralSite,
    opener: hit.opener,
  };
}

function gameId(dump: GoBirdsDumpGame, away: TeamAbbr, home: TeamAbbr): string {
  const meta = snapshotMeta(away, home);
  if (meta) return meta.id;
  if (dump.eventId) return dump.eventId;
  if (dump.slug) return dump.slug;
  return `dk-${away}-${home}`.toLowerCase();
}

export function mapDumpGameToBoardGame(
  dump: GoBirdsDumpGame,
  book: string,
): BoardGame | null {
  const away = parseScrapedTeam(dump.away);
  const home = parseScrapedTeam(dump.home);
  if (!away || !home) return null;
  return {
    id: gameId(dump, away.abbr, home.abbr),
    away,
    home,
    spread: {
      away: dump.spread_away,
      home: dump.spread_home,
      awayJuice: dump.spread_away_juice,
      homeJuice: dump.spread_home_juice,
    },
    total: {
      line: dump.total,
      overJuice: dump.over_juice,
      underJuice: dump.under_juice,
    },
    moneyline: { away: dump.ml_away, home: dump.ml_home },
    live: dump.live === true,
    book,
  };
}

export function mapDumpGameToGameLine(
  dump: GoBirdsDumpGame,
  book: string,
): GameLineWithLive | null {
  const away = parseScrapedTeam(dump.away);
  const home = parseScrapedTeam(dump.home);
  if (!away || !home) return null;

  const meta = snapshotMeta(away.abbr, home.abbr);
  const live = dump.live === true;
  const kickoffLabel = live
    ? "LIVE · in-game lines (not kickoff)"
    : (meta?.kickoffLabel ?? null);

  return {
    id: meta?.id ?? gameId(dump, away.abbr, home.abbr),
    startTime: meta?.startTime ?? null,
    kickoffLabel,
    week: 1,
    home: home.abbr,
    away: away.abbr,
    book,
    venue: meta?.venue ?? null,
    neutralSite: meta?.neutralSite ?? false,
    opener: meta?.opener ?? false,
    live,
    moneyline: {
      home: dump.ml_home,
      away: dump.ml_away,
      draw: null,
    },
    spread: {
      homeLine: dump.spread_home,
      awayLine: dump.spread_away,
      homeJuice: dump.spread_home_juice,
      awayJuice: dump.spread_away_juice,
    },
    total: {
      line: dump.total,
      overJuice: dump.over_juice,
      underJuice: dump.under_juice,
    },
  };
}

export function formatPulledAtPt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${fmt.format(d)} PT`;
}

export function boardNoteFromDump(dump: GoBirdsOddsDump): string {
  const when = formatPulledAtPt(dump.pulledAt) ?? "time unavailable";
  const liveBits = dump.games
    .filter((g) => g.live)
    .map((g) => {
      const a = parseScrapedTeam(g.away)?.abbr ?? "?";
      const h = parseScrapedTeam(g.home)?.abbr ?? "?";
      return `${a}@${h}`;
    });
  const liveSuffix =
    liveBits.length > 0 ? ` · ${liveBits.join(", ")} live/in-game lines` : "";
  return `DraftKings scrape · ${when}${liveSuffix}`;
}

/**
 * Full OddsBoard from a parsed dump. status ready only when ≥1 game maps.
 */
export function mapDumpToOddsBoard(dump: GoBirdsOddsDump): OddsBoard {
  const book = dump.book?.trim() || dump.source?.trim() || "DraftKings";
  const games = dump.games
    .map((g) => mapDumpGameToGameLine(g, book))
    .filter((g): g is GameLineWithLive => g !== null);

  const liveCount = games.filter((g) => g.live).length;
  const note = boardNoteFromDump(dump);
  const asOf = dump.pulledAt;
  const sourceLabel = note;

  if (games.length === 0) {
    return {
      status: "unavailable",
      reason: "Go Birds dump parsed but no mappable games.",
      asOf,
      sourceLabel,
      week: 1,
      sourceBooks: [book],
      games: [],
    };
  }

  return {
    status: "ready",
    reason:
      liveCount > 0
        ? `${liveCount} game(s) carry live/in-game lines — not kickoff openers.`
        : null,
    asOf,
    sourceLabel,
    week: 1,
    sourceBooks: [book],
    games,
  };
}
