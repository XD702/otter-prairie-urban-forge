/**
 * Server function for the ESPN scores layer.
 * Unofficial feed. Every call is fail-soft — never throw.
 */

import { createServerFn } from "@tanstack/react-start";
import type { ScoreBoard } from "./types";
import { unavailableScoreBoard } from "./types";

export const fetchEspnScoreBoard = createServerFn({ method: "GET" }).handler(
  async (): Promise<ScoreBoard> => {
    try {
      const { fetchEspnBoard } = await import("./espn.server.ts");
      return await fetchEspnBoard();
    } catch {
      return unavailableScoreBoard();
    }
  },
);
