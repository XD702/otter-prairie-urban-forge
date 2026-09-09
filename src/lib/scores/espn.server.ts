/**
 * Server-only ESPN public scoreboard fetch.
 *
 * Unofficial feed. Can break or change without notice.
 * Every call is try/caught — never throw to the UI.
 *
 * Contracted source (no API key):
 *   https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard
 *
 * PROTOTYPE. Production: paid live feed + Supabase.
 */

import { mapEspnScoreboard } from "./espn-map";
import { unavailableScoreBoard, type ScoreBoard } from "./types";

export const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

const ESPN_URLS = [
  ESPN_SCOREBOARD_URL,
  `${ESPN_SCOREBOARD_URL}?limit=50&seasontype=2`,
  "https://cdn.espn.com/core/nfl/scoreboard?xhr=1",
];

const HEADERS = {
  Accept: "application/json,text/plain,*/*",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  Referer: "https://www.espn.com/nfl/scoreboard",
  Origin: "https://www.espn.com",
};

const TIMEOUT_MS = 10_000;

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`ESPN HTTP ${res.status}`);
  }
  try {
    return await res.json();
  } catch {
    throw new Error("ESPN payload was not JSON");
  }
}

export async function fetchEspnBoard(): Promise<ScoreBoard> {
  try {
    for (const url of ESPN_URLS) {
      try {
        const payload = await getJson(url);
        let board: ScoreBoard;
        try {
          board = mapEspnScoreboard(payload);
        } catch {
          continue;
        }
        if (board.status === "ready" && board.games.length > 0) return board;
      } catch {
        // Try the next URL. Unofficial feed — failures are expected.
      }
    }
    return unavailableScoreBoard();
  } catch {
    return unavailableScoreBoard();
  }
}
