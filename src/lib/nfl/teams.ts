/**
 * Official NFL club directory — abbreviations and city/name only.
 * Not a snapshot. Do not add player names, odds, or scores here.
 */

export const TEAM_ABBRS = [
  "ARI",
  "ATL",
  "BAL",
  "BUF",
  "CAR",
  "CHI",
  "CIN",
  "CLE",
  "DAL",
  "DEN",
  "DET",
  "GB",
  "HOU",
  "IND",
  "JAX",
  "KC",
  "LAC",
  "LAR",
  "LV",
  "MIA",
  "MIN",
  "NE",
  "NO",
  "NYG",
  "NYJ",
  "PHI",
  "PIT",
  "SEA",
  "SF",
  "TB",
  "TEN",
  "WAS",
] as const;

export type TeamAbbr = (typeof TEAM_ABBRS)[number];

export interface NflTeam {
  abbr: TeamAbbr;
  city: string;
  name: string;
}

export const NFL_TEAMS: Record<TeamAbbr, NflTeam> = {
  ARI: { abbr: "ARI", city: "Arizona", name: "Cardinals" },
  ATL: { abbr: "ATL", city: "Atlanta", name: "Falcons" },
  BAL: { abbr: "BAL", city: "Baltimore", name: "Ravens" },
  BUF: { abbr: "BUF", city: "Buffalo", name: "Bills" },
  CAR: { abbr: "CAR", city: "Carolina", name: "Panthers" },
  CHI: { abbr: "CHI", city: "Chicago", name: "Bears" },
  CIN: { abbr: "CIN", city: "Cincinnati", name: "Bengals" },
  CLE: { abbr: "CLE", city: "Cleveland", name: "Browns" },
  DAL: { abbr: "DAL", city: "Dallas", name: "Cowboys" },
  DEN: { abbr: "DEN", city: "Denver", name: "Broncos" },
  DET: { abbr: "DET", city: "Detroit", name: "Lions" },
  GB: { abbr: "GB", city: "Green Bay", name: "Packers" },
  HOU: { abbr: "HOU", city: "Houston", name: "Texans" },
  IND: { abbr: "IND", city: "Indianapolis", name: "Colts" },
  JAX: { abbr: "JAX", city: "Jacksonville", name: "Jaguars" },
  KC: { abbr: "KC", city: "Kansas City", name: "Chiefs" },
  LAC: { abbr: "LAC", city: "Los Angeles", name: "Chargers" },
  LAR: { abbr: "LAR", city: "Los Angeles", name: "Rams" },
  LV: { abbr: "LV", city: "Las Vegas", name: "Raiders" },
  MIA: { abbr: "MIA", city: "Miami", name: "Dolphins" },
  MIN: { abbr: "MIN", city: "Minnesota", name: "Vikings" },
  NE: { abbr: "NE", city: "New England", name: "Patriots" },
  NO: { abbr: "NO", city: "New Orleans", name: "Saints" },
  NYG: { abbr: "NYG", city: "New York", name: "Giants" },
  NYJ: { abbr: "NYJ", city: "New York", name: "Jets" },
  PHI: { abbr: "PHI", city: "Philadelphia", name: "Eagles" },
  PIT: { abbr: "PIT", city: "Pittsburgh", name: "Steelers" },
  SEA: { abbr: "SEA", city: "Seattle", name: "Seahawks" },
  SF: { abbr: "SF", city: "San Francisco", name: "49ers" },
  TB: { abbr: "TB", city: "Tampa Bay", name: "Buccaneers" },
  TEN: { abbr: "TEN", city: "Tennessee", name: "Titans" },
  WAS: { abbr: "WAS", city: "Washington", name: "Commanders" },
};

export function isTeamAbbr(value: string): value is TeamAbbr {
  return Object.prototype.hasOwnProperty.call(NFL_TEAMS, value);
}

export function teamLabel(abbr: TeamAbbr): string {
  const t = NFL_TEAMS[abbr];
  return `${t.city} ${t.name}`;
}

export function teamShort(abbr: TeamAbbr): string {
  return NFL_TEAMS[abbr].name;
}
