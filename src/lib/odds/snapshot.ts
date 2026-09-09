/**
 * Dated BetMGM Week 1 spread snapshot.
 *
 * Source (print exactly, do not paraphrase):
 * USA Today, odds courtesy of BetMGM as of Tuesday Sep 8, 2026, 10:45 a.m. ET
 *
 * Spreads only. Moneyline, total, and juice are null on every game — do not
 * invent them. One book: BetMGM. No Caesars. Not a live scrape.
 *
 * Opener is SEA -3 from this USA Today board. Do not overlay Sporting News
 * SEA -3.5 / moneyline / total.
 *
 * PROTOTYPE. Simulation only. No real money. Production: The Odds API +
 * Supabase (swap ACTIVE_ODDS_PROVIDER in ./index.ts).
 */

import type { TeamAbbr } from "@/lib/nfl/teams";
import type { GameLine, OddsBoard } from "./types";

export const SNAPSHOT_SOURCE_LABEL =
  "USA Today, odds courtesy of BetMGM as of Tuesday Sep 8, 2026, 10:45 a.m. ET";

const BLANK_ML = { home: null, away: null, draw: null };
const BLANK_TOTAL = { line: null, overJuice: null, underJuice: null };

function spreadGame(input: {
  id: string;
  kickoffLabel: string;
  startTime: string;
  away: TeamAbbr;
  home: TeamAbbr;
  favorite: TeamAbbr;
  spread: number;
  venue?: string | null;
  neutralSite?: boolean;
  opener?: boolean;
}): GameLine {
  const mag = Math.abs(input.spread);
  const favHome = input.favorite === input.home;
  return {
    id: input.id,
    startTime: input.startTime,
    kickoffLabel: input.kickoffLabel,
    week: 1,
    home: input.home,
    away: input.away,
    book: "BetMGM",
    venue: input.venue ?? null,
    neutralSite: Boolean(input.neutralSite),
    opener: Boolean(input.opener),
    moneyline: BLANK_ML,
    spread: {
      homeLine: favHome ? -mag : mag,
      awayLine: favHome ? mag : -mag,
      homeJuice: null,
      awayJuice: null,
    },
    total: BLANK_TOTAL,
  };
}

export const SNAPSHOT_BOARD: OddsBoard = {
  status: "ready",
  reason: null,
  asOf: "2026-09-08T10:45:00-04:00",
  sourceLabel: SNAPSHOT_SOURCE_LABEL,
  week: 1,
  sourceBooks: ["BetMGM"],
  games: [
    spreadGame({
      id: "wk1-ne-sea",
      kickoffLabel: "Wed Sep 9, 8:20 PM ET",
      startTime: "2026-09-09T20:20:00-04:00",
      away: "NE",
      home: "SEA",
      favorite: "SEA",
      spread: 3,
      opener: true,
    }),
    spreadGame({
      id: "wk1-sf-lar",
      kickoffLabel: "Thu Sep 10, 8:35 PM ET",
      startTime: "2026-09-10T20:35:00-04:00",
      away: "SF",
      home: "LAR",
      favorite: "LAR",
      spread: 3.5,
      venue: "Melbourne",
      neutralSite: true,
    }),
    spreadGame({
      id: "wk1-buf-hou",
      kickoffLabel: "Sun Sep 13, 1:00 PM ET",
      startTime: "2026-09-13T13:00:00-04:00",
      away: "BUF",
      home: "HOU",
      favorite: "BUF",
      spread: 1,
    }),
    spreadGame({
      id: "wk1-chi-car",
      kickoffLabel: "Sun Sep 13, 1:00 PM ET",
      startTime: "2026-09-13T13:00:00-04:00",
      away: "CHI",
      home: "CAR",
      favorite: "CHI",
      spread: 3,
    }),
    spreadGame({
      id: "wk1-tb-cin",
      kickoffLabel: "Sun Sep 13, 1:00 PM ET",
      startTime: "2026-09-13T13:00:00-04:00",
      away: "TB",
      home: "CIN",
      favorite: "CIN",
      spread: 3.5,
    }),
    spreadGame({
      id: "wk1-no-det",
      kickoffLabel: "Sun Sep 13, 1:00 PM ET",
      startTime: "2026-09-13T13:00:00-04:00",
      away: "NO",
      home: "DET",
      favorite: "DET",
      spread: 7,
    }),
    spreadGame({
      id: "wk1-nyj-ten",
      kickoffLabel: "Sun Sep 13, 1:00 PM ET",
      startTime: "2026-09-13T13:00:00-04:00",
      away: "NYJ",
      home: "TEN",
      favorite: "TEN",
      spread: 1.5,
    }),
    spreadGame({
      id: "wk1-bal-ind",
      kickoffLabel: "Sun Sep 13, 1:00 PM ET",
      startTime: "2026-09-13T13:00:00-04:00",
      away: "BAL",
      home: "IND",
      favorite: "BAL",
      spread: 3.5,
    }),
    spreadGame({
      id: "wk1-atl-pit",
      kickoffLabel: "Sun Sep 13, 1:00 PM ET",
      startTime: "2026-09-13T13:00:00-04:00",
      away: "ATL",
      home: "PIT",
      favorite: "PIT",
      spread: 3.5,
    }),
    spreadGame({
      id: "wk1-cle-jax",
      kickoffLabel: "Sun Sep 13, 1:00 PM ET",
      startTime: "2026-09-13T13:00:00-04:00",
      away: "CLE",
      home: "JAX",
      favorite: "JAX",
      spread: 8.5,
    }),
    spreadGame({
      id: "wk1-gb-min",
      kickoffLabel: "Sun Sep 13, 4:25 PM ET",
      startTime: "2026-09-13T16:25:00-04:00",
      away: "GB",
      home: "MIN",
      favorite: "MIN",
      spread: 1.5,
    }),
    spreadGame({
      id: "wk1-was-phi",
      kickoffLabel: "Sun Sep 13, 4:25 PM ET",
      startTime: "2026-09-13T16:25:00-04:00",
      away: "WAS",
      home: "PHI",
      favorite: "PHI",
      spread: 4.5,
    }),
    spreadGame({
      id: "wk1-mia-lv",
      kickoffLabel: "Sun Sep 13, 4:25 PM ET",
      startTime: "2026-09-13T16:25:00-04:00",
      away: "MIA",
      home: "LV",
      favorite: "LV",
      spread: 3.5,
    }),
    spreadGame({
      id: "wk1-ari-lac",
      kickoffLabel: "Sun Sep 13, 4:25 PM ET",
      startTime: "2026-09-13T16:25:00-04:00",
      away: "ARI",
      home: "LAC",
      favorite: "LAC",
      spread: 9,
    }),
    spreadGame({
      id: "wk1-dal-nyg",
      kickoffLabel: "Sun Sep 13, 8:20 PM ET",
      startTime: "2026-09-13T20:20:00-04:00",
      away: "DAL",
      home: "NYG",
      favorite: "DAL",
      spread: 3,
    }),
    spreadGame({
      id: "wk1-den-kc",
      kickoffLabel: "Mon Sep 14, 8:15 PM ET",
      startTime: "2026-09-14T20:15:00-04:00",
      away: "DEN",
      home: "KC",
      favorite: "KC",
      spread: 2.5,
    }),
  ],
};
