/**
 * Arcade types + stake helpers for Eastside Legends Sim.
 * Simulation only — not real money. Currency label: **E$L coin$**.
 * Shares STARTING_BANKROLL / useBook bankroll with the Board.
 *
 * Solo = personal stake vs house (useBook).
 * H2H = eesl_challenges ledger (same as E$L tab).
 */

export const ARCADE_CURRENCY = "E$L coin$";
export const ARCADE_SIM_DISCLAIMER = "Simulation only — not real money.";
export const ARCADE_HISTORY_KEY = "eastside-arcade-v1";

/** Sports mini-games + Arcade classics + New cabinet games. */
export type ArcadeGameId =
  | "pickem"
  | "higher-lower"
  | "speed-trivia"
  | "matchup-dodge"
  | "pong"
  | "chess"
  | "tic-tac-toe"
  | "coin-toss"
  | "endless-runner"
  | "plinko"
  | "neon-wheel";

export type ArcadeOutcome = "pending" | "won" | "lost" | "push" | "void";

/** Solo = personal stake vs house (useBook). H2H = eesl_challenges ledger. */
export type ArcadeStakeMode = "solo" | "h2h";

export type ArcadeBadge = "Solo" | "H2H" | "Sports" | "Classic" | "New";

export interface ArcadeResult {
  id: string;
  gameId: ArcadeGameId;
  playedAt: string;
  stake: number;
  /** Net credit on settle (win/push = +stake after spend; loss = 0). */
  payout: number;
  outcome: ArcadeOutcome;
  detail: string;
  meta?: Record<string, unknown>;
}

/** Parse stake; default 0. Rejects NaN / negative → null. */
export function parseStake(raw: string | number): number | null {
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw < 0) return null;
    return Math.round(raw * 100) / 100;
  }
  const t = raw.trim();
  if (t === "") return 0;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export function stakeLabel(n: number): string {
  const s = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return `${s} ${ARCADE_CURRENCY}`;
}

export function arcadeUid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const ARCADE_GAME_META: Record<
  ArcadeGameId,
  {
    title: string;
    blurb: string;
    kind: "sports" | "classic" | "new";
    badges: ArcadeBadge[];
  }
> = {
  pickem: {
    title: "NFL Quick Pick'em",
    blurb: "Pick away/home from the odds board. Grades when the score is final.",
    kind: "sports",
    badges: ["Solo", "Sports"],
  },
  "higher-lower": {
    title: "Higher / Lower",
    blurb: "3 rounds on |spread| or projectedPts — skip if missing.",
    kind: "sports",
    badges: ["Solo", "Sports"],
  },
  "speed-trivia": {
    title: "Speed Trivia",
    blurb: "60s NFL history, Super Bowls, records & classic matchups.",
    kind: "sports",
    badges: ["Solo", "Sports"],
  },
  "matchup-dodge": {
    title: "Matchup Dodge",
    blurb: "Week 1 fantasy matchup pick. Solo or E$L H2H challenge.",
    kind: "sports",
    badges: ["Solo", "H2H", "Sports"],
  },
  pong: {
    title: "Pong",
    blurb: "Vs CPU or 1v1. First to 5. Optional E$L coin$ stake.",
    kind: "classic",
    badges: ["Solo", "H2H", "Classic"],
  },
  chess: {
    title: "Chess",
    blurb: "Local 2P or simple CPU. Optional E$L challenge.",
    kind: "classic",
    badges: ["Solo", "H2H", "Classic"],
  },
  "tic-tac-toe": {
    title: "Tic-Tac-Toe",
    blurb: "Vs CPU or 1v1. E$L on H2H.",
    kind: "classic",
    badges: ["Solo", "H2H", "Classic"],
  },
  "coin-toss": {
    title: "Coin Toss Flick",
    blurb: "Hold charge + release. Vs house or friend 1–5 E$L.",
    kind: "classic",
    badges: ["Solo", "H2H", "Classic"],
  },
  "endless-runner": {
    title: "Eastside Run",
    blurb: "Side-scroll gold chip run. Prize tiers 400 / 800 / 1500.",
    kind: "classic",
    badges: ["Solo", "H2H", "Classic"],
  },
  plinko: {
    title: "Eastside Plinko",
    blurb: "Drop a chip through pegs. Multipliers 0 / 0.5 / 1 / 2 / 5.",
    kind: "new",
    badges: ["Solo", "New"],
  },
  "neon-wheel": {
    title: "Neon Wheel",
    blurb: "Spin for 0 / even / ×2 / ×3. Solo stake only.",
    kind: "new",
    badges: ["Solo", "New"],
  },
};
