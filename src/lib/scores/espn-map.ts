/**
 * Map ESPN public scoreboard JSON onto ScoreBoard.
 * Do not invent scores. Pregame 0–0 is treated as not posted.
 *
 * PROTOTYPE. Swap this mapper if the ESPN payload shape changes.
 */

import { isTeamAbbr, type TeamAbbr } from "@/lib/nfl/teams";
import { SNAPSHOT_BOARD } from "@/lib/odds/snapshot";
import type { GameScore, ScoreBoard, ScorePhase } from "./types";

const ESPN_ABBR: Record<string, TeamAbbr> = {
  WSH: "WAS",
  WAS: "WAS",
  GNB: "GB",
  GB: "GB",
  JAC: "JAX",
  JAX: "JAX",
  ARZ: "ARI",
  ARI: "ARI",
  NWE: "NE",
  NE: "NE",
  NOR: "NO",
  NO: "NO",
  SFO: "SF",
  SF: "SF",
  TAM: "TB",
  TB: "TB",
  KAN: "KC",
  KC: "KC",
  LVR: "LV",
  LV: "LV",
  LAR: "LAR",
  LAC: "LAC",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function mapEspnAbbr(raw: string | null): TeamAbbr | null {
  if (!raw) return null;
  const key = raw.toUpperCase();
  if (ESPN_ABBR[key]) return ESPN_ABBR[key];
  return isTeamAbbr(key) ? key : null;
}

function slateGameId(home: TeamAbbr, away: TeamAbbr): string {
  const hit = SNAPSHOT_BOARD.games.find((game) => game.home === home && game.away === away);
  if (hit) return hit.id;
  const flip = SNAPSHOT_BOARD.games.find(
    (game) => game.neutralSite && game.home === away && game.away === home,
  );
  if (flip) return flip.id;
  return `espn-${away}-${home}`;
}

function extractEvents(root: unknown): unknown[] {
  try {
    const rec = asRecord(root);
    const preferred = [
      asArray(asRecord(asRecord(rec?.content)?.sbData)?.events),
      asArray(asRecord(rec?.sbData)?.events),
      asArray(rec?.events),
      asArray(asRecord(asArray(asRecord(asArray(rec?.sports)[0])?.leagues)[0])?.events),
    ];
    for (const list of preferred) {
      if (list.length > 0) return list;
    }

    const seen = new Set<unknown>();
    const found: unknown[] = [];
    const walk = (node: unknown, depth: number) => {
      if (depth > 8 || node === null || typeof node !== "object") return;
      if (seen.has(node)) return;
      seen.add(node);
      if (Array.isArray(node)) {
        if (
          node.length > 0 &&
          node.every((item) => {
            const row = asRecord(item);
            return row !== null && "competitions" in row;
          })
        ) {
          found.push(...node);
          return;
        }
        for (const item of node) walk(item, depth + 1);
        return;
      }
      for (const value of Object.values(node)) walk(value, depth + 1);
    };
    walk(root, 0);
    return found;
  } catch {
    return [];
  }
}

function mapEvent(raw: unknown): GameScore | null {
  const event = asRecord(raw);
  if (!event) return null;
  const competition = asRecord(asArray(event.competitions)[0]) ?? event;
  const competitors = asArray(competition.competitors);
  let homeAbbr: TeamAbbr | null = null;
  let awayAbbr: TeamAbbr | null = null;
  let homeRaw: number | null = null;
  let awayRaw: number | null = null;

  for (const item of competitors) {
    const rec = asRecord(item);
    if (!rec) continue;
    const team = asRecord(rec.team);
    const abbr = mapEspnAbbr(str(team?.abbreviation));
    if (!abbr) continue;
    const side = str(rec.homeAway);
    if (side === "home") {
      homeAbbr = abbr;
      homeRaw = num(rec.score);
    } else if (side === "away") {
      awayAbbr = abbr;
      awayRaw = num(rec.score);
    }
  }

  if (!homeAbbr || !awayAbbr) return null;

  const status = asRecord(competition.status) ?? asRecord(event.status);
  const type = asRecord(status?.type);
  const state = (str(type?.state) ?? "").toLowerCase();
  const completed = type?.completed === true || state === "post";
  const inProgress = state === "in";

  let phase: ScorePhase = "pending";
  if (completed) phase = "final";

  const homeScore = inProgress || completed ? homeRaw : null;
  const awayScore = inProgress || completed ? awayRaw : null;

  const period = num(status?.period);
  let quarter: string | null = null;
  if (inProgress || completed) {
    if (period !== null && period > 4) quarter = period === 5 ? "OT" : `OT${period - 4}`;
    else if (period !== null && period > 0) quarter = `Q${period}`;
    else if (completed) quarter = "Final";
  }

  const clock = inProgress ? str(status?.displayClock) : null;

  return {
    gameId: slateGameId(homeAbbr, awayAbbr),
    home: homeAbbr,
    away: awayAbbr,
    homeScore,
    awayScore,
    phase,
    inProgress,
    clock,
    quarter,
  };
}

export function mapEspnScoreboard(payload: unknown): ScoreBoard {
  try {
    const events = extractEvents(payload);
    const games: GameScore[] = [];
    const seen = new Set<string>();
    for (const event of events) {
      try {
        const mapped = mapEvent(event);
        if (!mapped || seen.has(mapped.gameId)) continue;
        seen.add(mapped.gameId);
        games.push(mapped);
      } catch {
        // Skip a bad event; unofficial feed can change shape.
      }
    }

    if (games.length === 0) {
      return {
        status: "unavailable",
        reason: "Scores unavailable",
        asOf: new Date().toISOString(),
        games: [],
      };
    }

    return {
      status: "ready",
      reason: null,
      asOf: new Date().toISOString(),
      games,
    };
  } catch {
    return {
      status: "error",
      reason: "Scores unavailable",
      asOf: null,
      games: [],
    };
  }
}
