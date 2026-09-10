/**
 * Playoff bracket structure for League of Eastside Legends.
 *
 * 12-team league, top 8 make playoffs (standard assumption — labeled in UI
 * as structure-only). Seeds 1–8 map from standings once real results exist;
 * until then team ids stay null and the UI shows "TBD".
 *
 * Bracket: QF week 15 (1v8, 4v5, 2v7, 3v6); SF week 16; Champ week 17.
 * winnerId is always null for now — do not invent outcomes.
 *
 * PROTOTYPE. Simulation only. No real money.
 */

export const PLAYOFF_WEEKS = [15, 16, 17] as const;

export const PLAYOFF_TEAM_COUNT = 8;

export type PlayoffRound = "qf" | "sf" | "champ";

export interface BracketSlot {
  id: string;
  week: number;
  round: PlayoffRound;
  seedA: number | null;
  seedB: number | null;
  teamAId: string | null;
  teamBId: string | null;
  winnerId: string | null;
}

/**
 * Empty 8-team bracket with seed labels only.
 * teamAId / teamBId / winnerId are null until standings produce a top 8
 * from real results (and games are played).
 */
export function buildEmptyBracket(): BracketSlot[] {
  return [
    // Quarterfinals — week 15
    {
      id: "qf-1v8",
      week: 15,
      round: "qf",
      seedA: 1,
      seedB: 8,
      teamAId: null,
      teamBId: null,
      winnerId: null,
    },
    {
      id: "qf-4v5",
      week: 15,
      round: "qf",
      seedA: 4,
      seedB: 5,
      teamAId: null,
      teamBId: null,
      winnerId: null,
    },
    {
      id: "qf-2v7",
      week: 15,
      round: "qf",
      seedA: 2,
      seedB: 7,
      teamAId: null,
      teamBId: null,
      winnerId: null,
    },
    {
      id: "qf-3v6",
      week: 15,
      round: "qf",
      seedA: 3,
      seedB: 6,
      teamAId: null,
      teamBId: null,
      winnerId: null,
    },
    // Semifinals — week 16 (winners of QFs; pairing TBD until QF complete)
    {
      id: "sf-a",
      week: 16,
      round: "sf",
      seedA: null,
      seedB: null,
      teamAId: null,
      teamBId: null,
      winnerId: null,
    },
    {
      id: "sf-b",
      week: 16,
      round: "sf",
      seedA: null,
      seedB: null,
      teamAId: null,
      teamBId: null,
      winnerId: null,
    },
    // Championship — week 17
    {
      id: "champ",
      week: 17,
      round: "champ",
      seedA: null,
      seedB: null,
      teamAId: null,
      teamBId: null,
      winnerId: null,
    },
  ];
}

export function slotsForWeek(slots: BracketSlot[], week: number): BracketSlot[] {
  return slots.filter((s) => s.week === week);
}

export function roundLabel(round: PlayoffRound): string {
  switch (round) {
    case "qf":
      return "Quarterfinals";
    case "sf":
      return "Semifinals";
    case "champ":
      return "Championship";
  }
}
