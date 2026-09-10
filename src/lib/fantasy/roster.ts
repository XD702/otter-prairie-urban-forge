/**
 * Default Eastside Legends roster (Go birds / Roberto) + re-exports.
 *
 * Full 12-team data lives in league-data.ts. Do not invent players.
 *
 * PROTOTYPE. Simulation only. No real money.
 */

import { DEFAULT_TEAM_ID, loadRosterForTeam } from "./league-data";
import type { FantasyRoster } from "./types";

/** Roberto / Go birds — left-rail default. */
export const ROSTER: FantasyRoster = loadRosterForTeam(DEFAULT_TEAM_ID);

export { loadRosterForTeam, DEFAULT_TEAM_ID };
