/**
 * League standings from completed matchup results only.
 *
 * Do NOT invent Week 1 winners, W-L-T, or PF/PA. Until real results exist,
 * rows are placeholders with null stats (UI shows "—").
 *
 * PROTOTYPE. Simulation only. No real money.
 */

import { TEAMS } from "./league-data";

export interface MatchupResult {
  week: number;
  aTeamId: string;
  bTeamId: string;
  aScore: number | null;
  bScore: number | null;
  complete: boolean;
}

export interface StandingRow {
  teamId: string;
  teamName: string;
  manager: string | null;
  rank: number | null;
  wins: number | null;
  losses: number | null;
  ties: number | null;
  pf: number | null;
  pa: number | null;
  source: "results" | "placeholder";
}

/** No completed results yet — Week 1 matchups are seed labels only. */
export const EMPTY_MATCHUP_RESULTS: MatchupResult[] = [];

type Acc = {
  wins: number;
  losses: number;
  ties: number;
  pf: number;
  pa: number;
};

function emptyAcc(): Acc {
  return { wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 };
}

/**
 * Build standings from completed results that have a real winner (or tie).
 * Incomplete rows, null scores, or non-complete flags are ignored.
 * If nothing counts, return 12 placeholder rows (nulls + source "placeholder").
 */
export function buildStandingsFromResults(results: MatchupResult[]): StandingRow[] {
  const completed = results.filter(
    (r) =>
      r.complete &&
      r.aScore !== null &&
      r.bScore !== null &&
      typeof r.aScore === "number" &&
      typeof r.bScore === "number",
  );

  if (completed.length === 0) {
    return TEAMS.map((t) => ({
      teamId: t.id,
      teamName: t.teamName,
      manager: t.manager,
      rank: null,
      wins: null,
      losses: null,
      ties: null,
      pf: null,
      pa: null,
      source: "placeholder" as const,
    }));
  }

  const byId = new Map<string, Acc>();
  for (const t of TEAMS) {
    byId.set(t.id, emptyAcc());
  }

  for (const r of completed) {
    const a = byId.get(r.aTeamId);
    const b = byId.get(r.bTeamId);
    if (!a || !b) continue;
    const aScore = r.aScore as number;
    const bScore = r.bScore as number;
    a.pf += aScore;
    a.pa += bScore;
    b.pf += bScore;
    b.pa += aScore;
    if (aScore > bScore) {
      a.wins += 1;
      b.losses += 1;
    } else if (bScore > aScore) {
      b.wins += 1;
      a.losses += 1;
    } else {
      a.ties += 1;
      b.ties += 1;
    }
  }

  const rows: StandingRow[] = TEAMS.map((t) => {
    const acc = byId.get(t.id)!;
    return {
      teamId: t.id,
      teamName: t.teamName,
      manager: t.manager,
      rank: null,
      wins: acc.wins,
      losses: acc.losses,
      ties: acc.ties,
      pf: acc.pf,
      pa: acc.pa,
      source: "results" as const,
    };
  });

  rows.sort((x, y) => {
    const xWinPct = winPct(x);
    const yWinPct = winPct(y);
    if (yWinPct !== xWinPct) return yWinPct - xWinPct;
    const xPf = x.pf ?? 0;
    const yPf = y.pf ?? 0;
    if (yPf !== xPf) return yPf - xPf;
    return x.teamName.localeCompare(y.teamName);
  });

  return rows.map((row, i) => ({ ...row, rank: i + 1 }));
}

function winPct(row: StandingRow): number {
  const w = row.wins ?? 0;
  const l = row.losses ?? 0;
  const t = row.ties ?? 0;
  const games = w + l + t;
  if (games === 0) return 0;
  return (w + 0.5 * t) / games;
}

export function standingsArePlaceholders(rows: StandingRow[]): boolean {
  return rows.length > 0 && rows.every((r) => r.source === "placeholder");
}
