/**
 * Baked Eastside Legends roster — League of Eastside Legends, Yahoo 288732.
 *
 * Inserted from the provided lineup only. Do not invent extra players,
 * scores, or an opponent column.
 *
 * PROTOTYPE. Simulation only. No real money. Production: league roster
 * feed + Supabase.
 */

import type { FantasyPlayer, FantasyRoster, LineupSlot } from "./types";
import type { TeamAbbr } from "@/lib/nfl/teams";

function player(
  id: string,
  name: string,
  team: TeamAbbr,
  position: FantasyPlayer["position"],
  status: string | null = null,
): FantasyPlayer {
  return { id, name, team, position, status };
}

function slot(
  id: string,
  position: LineupSlot["position"],
  p: FantasyPlayer,
  note: string | null = null,
): LineupSlot {
  return { id, position, label: position, note, player: p };
}

export const ROSTER: FantasyRoster = {
  status: "ready",
  reason: null,
  league: "League of Eastside Legends",
  yahooId: "288732",
  ownerLabel: "Rob's board",
  slots: [
    slot("qb", "QB", player("dak-prescott", "Dak Prescott", "DAL", "QB")),
    slot("rb1", "RB", player("bucky-irving", "Bucky Irving", "TB", "RB")),
    slot("rb2", "RB", player("jk-dobbins", "J.K. Dobbins", "DEN", "RB")),
    slot("wr1", "WR", player("amon-ra-st-brown", "Amon-Ra St. Brown", "DET", "WR")),
    slot("wr2", "WR", player("jamarr-chase", "Ja'Marr Chase", "CIN", "WR", "Q")),
    slot("te", "TE", player("colston-loveland", "Colston Loveland", "CHI", "TE")),
    slot(
      "flex",
      "FLEX",
      player("dallas-goedert", "Dallas Goedert", "PHI", "TE"),
      "WRT flex",
    ),
    slot("k", "K", player("jake-elliott", "Jake Elliott", "PHI", "K")),
    slot("def", "DEF", player("packers-def", "Packers DEF", "GB", "DEF")),
  ],
  bench: [
    slot(
      "bn1",
      "BN",
      player("treveyon-henderson", "TreVeyon Henderson", "NE", "RB", "Out, ankle"),
    ),
    slot("bn2", "BN", player("calvin-ridley", "Calvin Ridley", "TEN", "WR")),
    slot("bn3", "BN", player("kenneth-gainwell", "Kenneth Gainwell", "TB", "RB")),
    slot("bn4", "BN", player("alec-pierce", "Alec Pierce", "IND", "WR")),
  ],
};
