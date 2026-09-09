/**
 * Fantasy module — UI imports roster from here only.
 *
 * PROTOTYPE. Production: live roster + Supabase.
 */

import { ROSTER } from "./roster";
import type { FantasyRoster } from "./types";

export type {
  FantasyFeedStatus,
  FantasyPlayer,
  FantasyPosition,
  FantasyRoster,
  LineupSlot,
} from "./types";

export { EMPTY_LINEUP, EMPTY_ROSTER } from "./types";

export function loadRoster(): FantasyRoster {
  return ROSTER;
}
