/**
 * Thin Go Birds Yahoo dump ingest.
 * Fail-soft. Never invent projectedPts / actualPts.
 */

import type { FantasyPlayer, FantasyRoster, LineupSlot } from "./types";
import type {
  MatchupWithScrapeTotals,
  ScrapeFetchResult,
  YahooLeagueDump,
  YahooMatchup,
  YahooRosterPlayer,
  YahooTeam,
} from "./scrape-types";

/** Default Vite public path (laptop). Box authoritative: /workspace/eastside/yahoo/league-288732-latest.json */
export const SCRAPE_URL = "/fantasy/league-288732-latest.json";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asNullableNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

/** Minimal structural validate — empty teams OK; invent nothing. */
export function parseLeagueDump(raw: unknown): YahooLeagueDump | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.leagueId !== "string") return null;
  if (!Array.isArray(raw.teams) || !Array.isArray(raw.matchups)) return null;

  const teams: YahooTeam[] = raw.teams.filter(isRecord).map((t) => ({
    teamId: asString(t.teamId),
    name: asString(t.name),
    manager: asString(t.manager),
    roster: Array.isArray(t.roster)
      ? t.roster.filter(isRecord).map(
          (p): YahooRosterPlayer => ({
            name: asString(p.name),
            pos: asString(p.pos),
            nflTeam: asString(p.nflTeam),
            slot: asString(p.slot, "start"),
            status: asString(p.status),
            projectedPts:
              "projectedPts" in p ? asNullableNumber(p.projectedPts) : undefined,
            actualPts: "actualPts" in p ? asNullableNumber(p.actualPts) : undefined,
            id: typeof p.id === "string" ? p.id : p.id === null ? null : undefined,
          }),
        )
      : [],
  }));

  const matchups: YahooMatchup[] = raw.matchups.filter(isRecord).map((m) => {
    const scoresRaw = isRecord(m.scores) ? m.scores : {};
    return {
      week: typeof m.week === "number" ? m.week : 1,
      leftTeamId: asString(m.leftTeamId),
      rightTeamId: asString(m.rightTeamId),
      scores: {
        ...scoresRaw,
        leftProjected: asNullableNumber(scoresRaw.leftProjected),
        leftActual: asNullableNumber(scoresRaw.leftActual),
        rightProjected: asNullableNumber(scoresRaw.rightProjected),
        rightActual: asNullableNumber(scoresRaw.rightActual),
      },
    };
  });

  return {
    leagueId: asString(raw.leagueId),
    leagueKey: asString(raw.leagueKey, `f1.l.${asString(raw.leagueId)}`),
    pulledAt: typeof raw.pulledAt === "string" ? raw.pulledAt : null,
    source: asString(raw.source, "yahoo"),
    settings: isRecord(raw.settings) ? raw.settings : {},
    teams,
    matchups,
    standings: Array.isArray(raw.standings) ? raw.standings : [],
  };
}

export async function fetchScrape(
  signal?: AbortSignal,
  url: string = SCRAPE_URL,
): Promise<ScrapeFetchResult> {
  try {
    const res = await fetch(url, { signal, cache: "no-store" });
    if (!res.ok) {
      return {
        ok: false,
        reason: `Scrape fetch ${res.status}`,
        scrapedAt: null,
        data: null,
      };
    }
    const json: unknown = await res.json();
    const data = parseLeagueDump(json);
    if (!data) {
      return {
        ok: false,
        reason: "Scrape JSON failed validation",
        scrapedAt: null,
        data: null,
      };
    }
    return {
      ok: true,
      reason: null,
      scrapedAt: data.pulledAt,
      data,
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Scrape fetch aborted"
          : err.message
        : "Scrape fetch failed";
    return { ok: false, reason: message, scrapedAt: null, data: null };
  }
}

export function findScrapeTeam(
  scrape: YahooLeagueDump | null | undefined,
  seedTeamId: string,
  seedTeamName?: string | null,
  seedManager?: string | null,
): YahooTeam | null {
  if (!scrape?.teams?.length) return null;
  const byId = scrape.teams.find((t) => t.teamId === seedTeamId);
  if (byId) return byId;
  if (seedTeamName) {
    const n = seedTeamName.trim().toLowerCase();
    const byName = scrape.teams.find((t) => t.name.trim().toLowerCase() === n);
    if (byName) return byName;
  }
  if (seedManager) {
    const m = seedManager.trim().toLowerCase();
    const byMgr = scrape.teams.find((t) => t.manager.trim().toLowerCase() === m);
    if (byMgr) return byMgr;
  }
  return null;
}

function normName(s: string): string {
  return s.trim().toLowerCase().replace(/[.']/g, "");
}

function pointsFromScrapePlayer(
  p: YahooRosterPlayer | undefined,
): { projectedPts: number | null; actualPts: number | null } {
  if (!p) return { projectedPts: null, actualPts: null };
  return {
    projectedPts:
      p.projectedPts === undefined ? null : asNullableNumber(p.projectedPts),
    actualPts: p.actualPts === undefined ? null : asNullableNumber(p.actualPts),
  };
}

function mergePlayer(
  seed: FantasyPlayer | null,
  scrapePlayer: YahooRosterPlayer | undefined,
): FantasyPlayer | null {
  if (!seed) {
    // Only append when scrape provides full identity — caller handles append path.
    return null;
  }
  const pts = pointsFromScrapePlayer(scrapePlayer);
  return {
    ...seed,
    projectedPts: pts.projectedPts,
    actualPts: pts.actualPts,
    // Prefer seed identity; optionally refresh status if scrape has one.
    status:
      scrapePlayer && scrapePlayer.status
        ? scrapePlayer.status
        : seed.status,
  };
}

function scrapePlayerToFantasy(p: YahooRosterPlayer): FantasyPlayer | null {
  if (!p.name || !p.pos || !p.nflTeam) return null;
  const pos = p.pos.toUpperCase();
  const allowed = ["QB", "RB", "WR", "TE", "K", "DEF"] as const;
  if (!allowed.includes(pos as (typeof allowed)[number])) return null;
  const pts = pointsFromScrapePlayer(p);
  const id =
    (typeof p.id === "string" && p.id) ||
    p.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return {
    id,
    name: p.name,
    team: p.nflTeam as FantasyPlayer["team"],
    position: pos as FantasyPlayer["position"],
    status: p.status || null,
    projectedPts: pts.projectedPts,
    actualPts: pts.actualPts,
  };
}

function matchScrapeForSlot(
  slot: LineupSlot,
  pool: YahooRosterPlayer[],
  used: Set<number>,
): YahooRosterPlayer | undefined {
  if (!slot.player) return undefined;
  const target = normName(slot.player.name);
  const idx = pool.findIndex((p, i) => !used.has(i) && normName(p.name) === target);
  if (idx >= 0) {
    used.add(idx);
    return pool[idx];
  }
  return undefined;
}

function mergeSlotList(
  seedSlots: LineupSlot[],
  scrapeRoster: YahooRosterPlayer[],
  slotFilter: (p: YahooRosterPlayer) => boolean,
): LineupSlot[] {
  const pool = scrapeRoster.filter(slotFilter);
  const used = new Set<number>();

  // Prefer scrape order when scrape has matching rows; else keep seed structure.
  if (pool.length === 0) {
    return seedSlots.map((s) => ({
      ...s,
      player: s.player
        ? { ...s.player, projectedPts: null, actualPts: null }
        : null,
    }));
  }

  const merged = seedSlots.map((slot) => {
    const sp = matchScrapeForSlot(slot, pool, used);
    return {
      ...slot,
      player: mergePlayer(slot.player, sp),
    };
  });

  // Append scrape-only players with full identity not already in seed.
  for (let i = 0; i < pool.length; i++) {
    if (used.has(i)) continue;
    const sp = pool[i];
    const fantasy = scrapePlayerToFantasy(sp);
    if (!fantasy) continue;
    const already = merged.some(
      (s) => s.player && normName(s.player.name) === normName(fantasy.name),
    );
    if (already) continue;
    const isBench = String(sp.slot).toLowerCase() === "bench";
    merged.push({
      id: `scrape-${fantasy.id}`,
      position: isBench ? "BN" : (fantasy.position === "K" || fantasy.position === "DEF"
        ? fantasy.position
        : fantasy.position),
      label: isBench ? "BN" : fantasy.position,
      note: null,
      player: fantasy,
    });
  }

  return merged;
}

/**
 * Overlay scrape points onto seed roster. Never invents players or points.
 * Prefer scrape slot order when present; keep seed structure when scrape missing.
 */
export function mergeRosterWithScrape(
  seedRoster: FantasyRoster,
  scrapeTeam: YahooTeam | null,
): FantasyRoster {
  if (!scrapeTeam) {
    return {
      ...seedRoster,
      projectedTotal: null,
      actualTotal: null,
      scrapeScrapedAt: null,
      slots: seedRoster.slots.map((s) => ({
        ...s,
        player: s.player
          ? { ...s.player, projectedPts: null, actualPts: null }
          : null,
      })),
      bench: seedRoster.bench.map((s) => ({
        ...s,
        player: s.player
          ? { ...s.player, projectedPts: null, actualPts: null }
          : null,
      })),
      ir: seedRoster.ir.map((s) => ({
        ...s,
        player: s.player
          ? { ...s.player, projectedPts: null, actualPts: null }
          : null,
      })),
    };
  }

  const startPool = (p: YahooRosterPlayer) =>
    String(p.slot).toLowerCase() !== "bench";
  const benchPool = (p: YahooRosterPlayer) =>
    String(p.slot).toLowerCase() === "bench";

  return {
    ...seedRoster,
    teamName: scrapeTeam.name || seedRoster.teamName,
    manager: scrapeTeam.manager || seedRoster.manager,
    projectedTotal: null, // team totals come from matchup scores when present
    actualTotal: null,
    scrapeScrapedAt: null, // caller may set from dump.pulledAt
    slots: mergeSlotList(seedRoster.slots, scrapeTeam.roster, startPool),
    bench: mergeSlotList(seedRoster.bench, scrapeTeam.roster, benchPool),
    ir: seedRoster.ir.map((s) => ({
      ...s,
      player: s.player
        ? {
            ...s.player,
            ...pointsFromScrapePlayer(
              scrapeTeam.roster.find(
                (p) => normName(p.name) === normName(s.player!.name),
              ),
            ),
          }
        : null,
    })),
  };
}

/**
 * Add projectedTotal/actualTotal per side from dump matchup scores when present.
 * seedMatchups: { id?, week, aTeamId, bTeamId }[]
 */
export function mergeMatchupsWithScrape(
  seedMatchups: Array<{ id?: string; week: number; aTeamId: string; bTeamId: string }>,
  scrape: YahooLeagueDump | null | undefined,
): MatchupWithScrapeTotals[] {
  const dumpMatchups = scrape?.matchups ?? [];

  return seedMatchups.map((m) => {
    const hit =
      dumpMatchups.find(
        (d) =>
          d.week === m.week &&
          ((d.leftTeamId === m.aTeamId && d.rightTeamId === m.bTeamId) ||
            (d.leftTeamId === m.bTeamId && d.rightTeamId === m.aTeamId)),
      ) ?? null;

    if (!hit) {
      return {
        week: m.week,
        a: { teamId: m.aTeamId, projectedTotal: null, actualTotal: null },
        b: { teamId: m.bTeamId, projectedTotal: null, actualTotal: null },
      };
    }

    const flipped =
      hit.leftTeamId === m.bTeamId && hit.rightTeamId === m.aTeamId;
    const s = hit.scores ?? {};

    if (flipped) {
      return {
        week: m.week,
        a: {
          teamId: m.aTeamId,
          projectedTotal: asNullableNumber(s.rightProjected),
          actualTotal: asNullableNumber(s.rightActual),
        },
        b: {
          teamId: m.bTeamId,
          projectedTotal: asNullableNumber(s.leftProjected),
          actualTotal: asNullableNumber(s.leftActual),
        },
      };
    }

    return {
      week: m.week,
      a: {
        teamId: m.aTeamId,
        projectedTotal: asNullableNumber(s.leftProjected),
        actualTotal: asNullableNumber(s.leftActual),
      },
      b: {
        teamId: m.bTeamId,
        projectedTotal: asNullableNumber(s.rightProjected),
        actualTotal: asNullableNumber(s.rightActual),
      },
    };
  });
}

export function formatScrapeAge(scrapedAt: string | null | undefined): string {
  if (!scrapedAt) return "Never";
  const t = Date.parse(scrapedAt);
  if (!Number.isFinite(t)) return scrapedAt;
  return new Date(t).toISOString();
}

export function applyPulledAt(
  roster: FantasyRoster,
  pulledAt: string | null,
): FantasyRoster {
  return { ...roster, scrapeScrapedAt: pulledAt };
}
