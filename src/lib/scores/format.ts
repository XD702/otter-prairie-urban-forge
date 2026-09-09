/**
 * Display helpers for ScoreBoard. Do not invent numbers.
 */

import type { GameScore } from "./types";

export function scorePair(game: GameScore): string | null {
  if (game.awayScore === null || game.homeScore === null) return null;
  return `${game.awayScore}–${game.homeScore}`;
}

/** Quarter · clock · score for ticker, cards, and open tickets. */
export function liveLine(game: GameScore): string {
  const pair = scorePair(game);
  if (game.inProgress) {
    const bits: string[] = [pair ?? "Unavailable"];
    if (game.quarter) bits.push(game.quarter);
    if (game.clock) bits.push(game.clock);
    return bits.join(" · ");
  }
  if (game.phase === "final") {
    return pair ? `${pair} · Final` : "Final unavailable";
  }
  if (game.phase === "pending") return "Pending";
  return "Unavailable";
}
