/**
 * Book feeds. Odds and scores are swappable providers — this hook only
 * reads peek/load from those modules. Do not import ESPN or snapshot files here.
 */

import { useEffect, useState } from "react";
import { loadOddsBoard, peekOddsBoard, type OddsBoard } from "@/lib/odds";
import {
  boardHasInProgress,
  loadScoreBoard,
  peekScoreBoard,
  SCORES_UNAVAILABLE,
  unavailableScoreBoard,
  type ScoreBoard,
} from "@/lib/scores";
import { loadRoster, type FantasyRoster } from "@/lib/fantasy";

export interface BookFeeds {
  odds: OddsBoard;
  scores: ScoreBoard;
  roster: FantasyRoster;
}

const LIVE_MS = 30_000;
const PREGAME_MS = 30_000;
const IDLE_MS = 180_000;
const ERROR_MS = 30_000;

function nextInterval(board: ScoreBoard): number {
  if (board.status === "error" || board.status === "unavailable") return ERROR_MS;
  if (boardHasInProgress(board)) return LIVE_MS;
  if (board.games.some((game) => game.phase === "pending")) return PREGAME_MS;
  return IDLE_MS;
}

function failedBoard(prev: ScoreBoard): ScoreBoard {
  return {
    ...unavailableScoreBoard(),
    games: prev.games,
    reason: SCORES_UNAVAILABLE,
  };
}

export function useBookFeeds(initialScores?: ScoreBoard): BookFeeds {
  const [odds, setOdds] = useState<OddsBoard>(() => peekOddsBoard());
  const [scores, setScores] = useState<ScoreBoard>(() => initialScores ?? peekScoreBoard());

  useEffect(() => {
    let cancelled = false;
    void loadOddsBoard().then((board) => {
      if (!cancelled) setOdds(board);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let inflight = false;

    const run = async () => {
      if (cancelled || inflight) return;
      inflight = true;
      try {
        const next = await loadScoreBoard();
        if (cancelled) return;
        if (next.status === "ready" && next.games.length > 0) {
          setScores(next);
          timer = setTimeout(run, nextInterval(next));
        } else {
          setScores((prev) => failedBoard(prev));
          timer = setTimeout(run, ERROR_MS);
        }
      } catch {
        if (!cancelled) {
          setScores((prev) => failedBoard(prev));
          timer = setTimeout(run, ERROR_MS);
        }
      } finally {
        inflight = false;
      }
    };

    void run().catch(() => {
      if (!cancelled) setScores((prev) => failedBoard(prev));
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return {
    odds,
    scores,
    roster: loadRoster(),
  };
}
