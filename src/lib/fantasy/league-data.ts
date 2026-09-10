/**
 * League of Eastside Legends — Week 1 baked data (Yahoo f1/288732).
 *
 * Source: Rob screenshot dump. Do not invent or "correct" players / NFL abbrs.
 * PROTOTYPE. Simulation only. No real money.
 */

import type { FantasyRoster } from "./types";
import type { TeamAbbr } from "@/lib/nfl/teams";

export const LEAGUE = {
  name: "League of Eastside Legends",
  yahooId: "288732",
  season: 2026,
  week: 1,
  teamCount: 12,
} as const;

export interface LeagueTeam {
  id: string;
  teamName: string;
  manager: string | null;
  roster: FantasyRoster;
}

export interface WeekMatchup {
  id: string;
  week: number;
  aTeamId: string;
  bTeamId: string;
}

export const DEFAULT_TEAM_ID = "go-birds";

export const TEAMS: LeagueTeam[] = [
  {
    id: "apache-dogs",
    teamName: "APACHEDOGS",
    manager: "MAJ",
    roster: {
      status: "ready",
      reason: null,
      league: LEAGUE.name,
      yahooId: LEAGUE.yahooId,
      ownerLabel: "APACHEDOGS (MAJ)",
      teamName: "APACHEDOGS",
      manager: "MAJ",
      slots: [
    { id: "qb", position: "QB", label: "QB", note: null, player: { id: "caleb-williams", name: "Caleb Williams", team: "CHI" as TeamAbbr, position: "QB", status: null } },
    { id: "rb1", position: "RB", label: "RB", note: null, player: { id: "derrick-henry", name: "Derrick Henry", team: "BAL" as TeamAbbr, position: "RB", status: null } },
    { id: "rb2", position: "RB", label: "RB", note: null, player: { id: "omarion-hampton", name: "Omarion Hampton", team: "LAC" as TeamAbbr, position: "RB", status: null } },
    { id: "wr1", position: "WR", label: "WR", note: null, player: { id: "chris-olave", name: "Chris Olave", team: "NO" as TeamAbbr, position: "WR", status: null } },
    { id: "wr2", position: "WR", label: "WR", note: null, player: { id: "zay-flowers", name: "Zay Flowers", team: "BAL" as TeamAbbr, position: "WR", status: null } },
    { id: "te", position: "TE", label: "TE", note: null, player: { id: "dalton-kincaid", name: "Dalton Kincaid", team: "BUF" as TeamAbbr, position: "TE", status: null } },
    { id: "flex", position: "FLEX", label: "FLEX", note: null, player: { id: "marshawn-lloyd", name: "MarShawn Lloyd", team: "GB" as TeamAbbr, position: "RB", status: null } },
    { id: "k", position: "K", label: "K", note: null, player: null },
    { id: "def", position: "DEF", label: "DEF", note: null, player: null },
      ],
      bench: [
    { id: "bn1", position: "BN", label: "BN", note: null, player: { id: "carnell-tate", name: "Carnell Tate", team: "TEN" as TeamAbbr, position: "WR", status: null } },
    { id: "bn2", position: "BN", label: "BN", note: null, player: { id: "rico-dowdle", name: "Rico Dowdle", team: "PIT" as TeamAbbr, position: "RB", status: null } },
    { id: "bn3", position: "BN", label: "BN", note: null, player: { id: "kyle-monangai", name: "Kyle Monangai", team: "CHI" as TeamAbbr, position: "RB", status: null } },
    { id: "bn4", position: "BN", label: "BN", note: null, player: { id: "chris-godwin-jr", name: "Chris Godwin Jr.", team: "TB" as TeamAbbr, position: "WR", status: null } },
    { id: "bn5", position: "BN", label: "BN", note: null, player: { id: "jakobi-meyers", name: "Jakobi Meyers", team: "JAX" as TeamAbbr, position: "WR", status: null } },
    { id: "bn6", position: "BN", label: "BN", note: null, player: { id: "baker-mayfield", name: "Baker Mayfield", team: "TB" as TeamAbbr, position: "QB", status: null } },
      ],
      ir: [],
    },
  },
  
  {
    id: "cheesehead-hooligans",
    teamName: "Cheesehead hooligans",
    manager: "Leon",
    roster: {
      status: "ready",
      reason: null,
      league: LEAGUE.name,
      yahooId: LEAGUE.yahooId,
      ownerLabel: "Cheesehead hooligans (Leon)",
      teamName: "Cheesehead hooligans",
      manager: "Leon",
      slots: [
    { id: "qb", position: "QB", label: "QB", note: null, player: { id: "jaxson-dart", name: "Jaxson Dart", team: "NYG" as TeamAbbr, position: "QB", status: null } },
    { id: "rb1", position: "RB", label: "RB", note: null, player: { id: "d-andre-swift", name: "D'Andre Swift", team: "CHI" as TeamAbbr, position: "RB", status: null } },
    { id: "rb2", position: "RB", label: "RB", note: null, player: { id: "jadarian-price", name: "Jadarian Price", team: "SEA" as TeamAbbr, position: "RB", status: null } },
    { id: "wr1", position: "WR", label: "WR", note: null, player: { id: "puka-nacua", name: "Puka Nacua", team: "LAR" as TeamAbbr, position: "WR", status: null } },
    { id: "wr2", position: "WR", label: "WR", note: null, player: { id: "malik-nabers", name: "Malik Nabers", team: "NYG" as TeamAbbr, position: "WR", status: null } },
    { id: "te", position: "TE", label: "TE", note: null, player: { id: "brenton-strange", name: "Brenton Strange", team: "JAX" as TeamAbbr, position: "TE", status: null } },
    { id: "flex", position: "FLEX", label: "FLEX", note: null, player: { id: "rome-odunze", name: "Rome Odunze", team: "CHI" as TeamAbbr, position: "WR", status: null } },
    { id: "k", position: "K", label: "K", note: null, player: null },
    { id: "def", position: "DEF", label: "DEF", note: null, player: null },
      ],
      bench: [
    { id: "bn1", position: "BN", label: "BN", note: null, player: { id: "brock-bowers", name: "Brock Bowers", team: "LV" as TeamAbbr, position: "TE", status: null } },
    { id: "bn2", position: "BN", label: "BN", note: null, player: { id: "jonathon-brooks", name: "Jonathon Brooks", team: "CAR" as TeamAbbr, position: "RB", status: null } },
    { id: "bn3", position: "BN", label: "BN", note: null, player: { id: "emmett-johnson", name: "Emmett Johnson", team: "KC" as TeamAbbr, position: "RB", status: null } },
    { id: "bn4", position: "BN", label: "BN", note: null, player: { id: "de-zhaun-stribling", name: "De'Zhaun Stribling", team: "SF" as TeamAbbr, position: "WR", status: null } },
    { id: "bn5", position: "BN", label: "BN", note: null, player: { id: "jalen-coker", name: "Jalen Coker", team: "CAR" as TeamAbbr, position: "WR", status: null } },
    { id: "bn6", position: "BN", label: "BN", note: null, player: { id: "jordan-love", name: "Jordan Love", team: "GB" as TeamAbbr, position: "QB", status: null } },
      ],
      ir: [],
    },
  },
  
  {
    id: "cheese-me",
    teamName: "Cheese me!",
    manager: null,
    roster: {
      status: "ready",
      reason: "Screenshot incomplete — starters not shown on crop",
      league: LEAGUE.name,
      yahooId: LEAGUE.yahooId,
      ownerLabel: "Cheese me!",
      teamName: "Cheese me!",
      manager: null,
      slots: [
    { id: "qb", position: "QB", label: "QB", note: "Screenshot incomplete — starters not shown on crop", player: null },
    { id: "rb1", position: "RB", label: "RB", note: "Screenshot incomplete — starters not shown on crop", player: null },
    { id: "rb2", position: "RB", label: "RB", note: "Screenshot incomplete — starters not shown on crop", player: null },
    { id: "wr1", position: "WR", label: "WR", note: "Screenshot incomplete — starters not shown on crop", player: null },
    { id: "wr2", position: "WR", label: "WR", note: "Screenshot incomplete — starters not shown on crop", player: null },
    { id: "te", position: "TE", label: "TE", note: "Screenshot incomplete — starters not shown on crop", player: null },
    { id: "flex", position: "FLEX", label: "FLEX", note: "Screenshot incomplete — starters not shown on crop", player: null },
    { id: "k", position: "K", label: "K", note: null, player: null },
    { id: "def", position: "DEF", label: "DEF", note: null, player: null },
      ],
      bench: [
    { id: "bn1", position: "BN", label: "BN", note: null, player: { id: "de-von-achane", name: "De'Von Achane", team: "MIA" as TeamAbbr, position: "RB", status: null } },
    { id: "bn2", position: "BN", label: "BN", note: null, player: { id: "justin-jefferson", name: "Justin Jefferson", team: "MIN" as TeamAbbr, position: "WR", status: null } },
    { id: "bn3", position: "BN", label: "BN", note: null, player: { id: "javonte-williams", name: "Javonte Williams", team: "DAL" as TeamAbbr, position: "RB", status: null } },
    { id: "bn4", position: "BN", label: "BN", note: null, player: { id: "emeka-egbuka", name: "Emeka Egbuka", team: "TB" as TeamAbbr, position: "WR", status: null } },
    { id: "bn5", position: "BN", label: "BN", note: null, player: { id: "mike-evans", name: "Mike Evans", team: "SF" as TeamAbbr, position: "WR", status: null } },
    { id: "bn6", position: "BN", label: "BN", note: null, player: { id: "jayden-daniels", name: "Jayden Daniels", team: "WAS" as TeamAbbr, position: "QB", status: null } },
    { id: "bn7", position: "BN", label: "BN", note: null, player: { id: "matthew-golden", name: "Matthew Golden", team: "GB" as TeamAbbr, position: "WR", status: null } },
    { id: "bn8", position: "BN", label: "BN", note: null, player: { id: "woody-marks", name: "Woody Marks", team: "HOU" as TeamAbbr, position: "RB", status: null } },
    { id: "bn9", position: "BN", label: "BN", note: null, player: { id: "isaiah-likely", name: "Isaiah Likely", team: "NYG" as TeamAbbr, position: "TE", status: null } },
      ],
      ir: [],
    },
  },
  
  {
    id: "gibb-it-to-me-baby",
    teamName: "Gibb it to me Baby",
    manager: "Gibb",
    roster: {
      status: "ready",
      reason: null,
      league: LEAGUE.name,
      yahooId: LEAGUE.yahooId,
      ownerLabel: "Gibb it to me Baby (Gibb)",
      teamName: "Gibb it to me Baby",
      manager: "Gibb",
      slots: [
    { id: "qb", position: "QB", label: "QB", note: null, player: { id: "justin-herbert", name: "Justin Herbert", team: "LAC" as TeamAbbr, position: "QB", status: null } },
    { id: "rb1", position: "RB", label: "RB", note: null, player: { id: "jahmyr-gibbs", name: "Jahmyr Gibbs", team: "DET" as TeamAbbr, position: "RB", status: null } },
    { id: "rb2", position: "RB", label: "RB", note: null, player: { id: "saquon-barkley", name: "Saquon Barkley", team: "PHI" as TeamAbbr, position: "RB", status: null } },
    { id: "wr1", position: "WR", label: "WR", note: null, player: { id: "george-pickens", name: "George Pickens", team: "DAL" as TeamAbbr, position: "WR", status: null } },
    { id: "wr2", position: "WR", label: "WR", note: null, player: { id: "ladd-mcconkey", name: "Ladd McConkey", team: "LAC" as TeamAbbr, position: "WR", status: null } },
    { id: "te", position: "TE", label: "TE", note: null, player: { id: "sam-laporta", name: "Sam LaPorta", team: "DET" as TeamAbbr, position: "TE", status: null } },
    { id: "flex", position: "FLEX", label: "FLEX", note: null, player: { id: "tony-pollard", name: "Tony Pollard", team: "TEN" as TeamAbbr, position: "RB", status: null } },
    { id: "k", position: "K", label: "K", note: null, player: null },
    { id: "def", position: "DEF", label: "DEF", note: null, player: null },
      ],
      bench: [
    { id: "bn1", position: "BN", label: "BN", note: null, player: { id: "makai-lemon", name: "Makai Lemon", team: "PHI" as TeamAbbr, position: "WR", status: null } },
    { id: "bn2", position: "BN", label: "BN", note: null, player: { id: "quentin-johnston", name: "Quentin Johnston", team: "LAC" as TeamAbbr, position: "WR", status: null } },
    { id: "bn3", position: "BN", label: "BN", note: null, player: { id: "jonah-coleman", name: "Jonah Coleman", team: "DEN" as TeamAbbr, position: "RB", status: null } },
    { id: "bn4", position: "BN", label: "BN", note: null, player: { id: "patrick-mahomes", name: "Patrick Mahomes", team: "KC" as TeamAbbr, position: "QB", status: null } },
    { id: "bn5", position: "BN", label: "BN", note: null, player: { id: "george-kittle", name: "George Kittle", team: "SF" as TeamAbbr, position: "TE", status: null } },
    { id: "bn6", position: "BN", label: "BN", note: null, player: { id: "keenan-allen", name: "Keenan Allen", team: "IND" as TeamAbbr, position: "WR", status: null } },
      ],
      ir: [
    { id: "ir1", position: "IR", label: "IR", note: null, player: { id: "james-conner", name: "James Conner", team: "ARI" as TeamAbbr, position: "RB", status: "IR" } },
      ],
    },
  },
  
  {
    id: "go-birds",
    teamName: "Go birds D**k head",
    manager: "Roberto",
    roster: {
      status: "ready",
      reason: null,
      league: LEAGUE.name,
      yahooId: LEAGUE.yahooId,
      ownerLabel: "Go birds D**k head (Roberto)",
      teamName: "Go birds D**k head",
      manager: "Roberto",
      slots: [
    { id: "qb", position: "QB", label: "QB", note: null, player: { id: "dak-prescott", name: "Dak Prescott", team: "DAL" as TeamAbbr, position: "QB", status: null } },
    { id: "rb1", position: "RB", label: "RB", note: null, player: { id: "bucky-irving", name: "Bucky Irving", team: "TB" as TeamAbbr, position: "RB", status: null } },
    { id: "rb2", position: "RB", label: "RB", note: null, player: { id: "j-k-dobbins", name: "J.K. Dobbins", team: "DEN" as TeamAbbr, position: "RB", status: null } },
    { id: "wr1", position: "WR", label: "WR", note: null, player: { id: "amon-ra-st-brown", name: "Amon-Ra St. Brown", team: "DET" as TeamAbbr, position: "WR", status: null } },
    { id: "wr2", position: "WR", label: "WR", note: null, player: { id: "ja-marr-chase", name: "Ja'Marr Chase", team: "CIN" as TeamAbbr, position: "WR", status: null } },
    { id: "te", position: "TE", label: "TE", note: null, player: { id: "colston-loveland", name: "Colston Loveland", team: "CHI" as TeamAbbr, position: "TE", status: null } },
    { id: "flex", position: "FLEX", label: "FLEX", note: "WRT flex", player: { id: "dallas-goedert", name: "Dallas Goedert", team: "PHI" as TeamAbbr, position: "TE", status: null } },
    { id: "k", position: "K", label: "K", note: null, player: { id: "jake-elliott", name: "Jake Elliott", team: "PHI" as TeamAbbr, position: "K", status: null } },
    { id: "def", position: "DEF", label: "DEF", note: null, player: { id: "packers", name: "Packers", team: "GB" as TeamAbbr, position: "DEF", status: null } },
      ],
      bench: [
    { id: "bn1", position: "BN", label: "BN", note: null, player: { id: "treveyon-henderson", name: "TreVeyon Henderson", team: "NE" as TeamAbbr, position: "RB", status: null } },
    { id: "bn2", position: "BN", label: "BN", note: null, player: { id: "calvin-ridley", name: "Calvin Ridley", team: "TEN" as TeamAbbr, position: "WR", status: null } },
    { id: "bn3", position: "BN", label: "BN", note: null, player: { id: "kenny-gainwell", name: "Kenny Gainwell", team: "TB" as TeamAbbr, position: "RB", status: null } },
    { id: "bn4", position: "BN", label: "BN", note: null, player: { id: "alec-pierce", name: "Alec Pierce", team: "IND" as TeamAbbr, position: "WR", status: null } },
    { id: "bn5", position: "BN", label: "BN", note: null, player: { id: "bryce-young", name: "Bryce Young", team: "CAR" as TeamAbbr, position: "QB", status: null } },
    { id: "bn6", position: "BN", label: "BN", note: "BN DEF", player: { id: "raiders", name: "Raiders", team: "LV" as TeamAbbr, position: "DEF", status: null } },
      ],
      ir: [],
    },
  },
  
  {
    id: "goodwrench",
    teamName: "Goodwrench",
    manager: "matthew",
    roster: {
      status: "ready",
      reason: null,
      league: LEAGUE.name,
      yahooId: LEAGUE.yahooId,
      ownerLabel: "Goodwrench (matthew)",
      teamName: "Goodwrench",
      manager: "matthew",
      slots: [
    { id: "qb", position: "QB", label: "QB", note: null, player: { id: "drake-maye", name: "Drake Maye", team: "NE" as TeamAbbr, position: "QB", status: null } },
    { id: "rb1", position: "RB", label: "RB", note: null, player: { id: "chase-brown", name: "Chase Brown", team: "CIN" as TeamAbbr, position: "RB", status: null } },
    { id: "rb2", position: "RB", label: "RB", note: null, player: { id: "bhayshul-tuten", name: "Bhayshul Tuten", team: "JAX" as TeamAbbr, position: "RB", status: null } },
    { id: "wr1", position: "WR", label: "WR", note: null, player: { id: "jaxon-smith-njigba", name: "Jaxon Smith-Njigba", team: "SEA" as TeamAbbr, position: "WR", status: null } },
    { id: "wr2", position: "WR", label: "WR", note: null, player: { id: "drake-london", name: "Drake London", team: "ATL" as TeamAbbr, position: "WR", status: null } },
    { id: "te", position: "TE", label: "TE", note: null, player: { id: "juwan-johnson", name: "Juwan Johnson", team: "NO" as TeamAbbr, position: "TE", status: null } },
    { id: "flex", position: "FLEX", label: "FLEX", note: null, player: { id: "tetairoa-mcmillan", name: "Tetairoa McMillan", team: "CAR" as TeamAbbr, position: "WR", status: null } },
    { id: "k", position: "K", label: "K", note: null, player: null },
    { id: "def", position: "DEF", label: "DEF", note: null, player: null },
      ],
      bench: [
    { id: "bn1", position: "BN", label: "BN", note: null, player: { id: "parker-washington", name: "Parker Washington", team: "JAX" as TeamAbbr, position: "WR", status: null } },
    { id: "bn2", position: "BN", label: "BN", note: null, player: { id: "blake-corum", name: "Blake Corum", team: "LAR" as TeamAbbr, position: "RB", status: null } },
    { id: "bn3", position: "BN", label: "BN", note: null, player: { id: "chuba-hubbard", name: "Chuba Hubbard", team: "CAR" as TeamAbbr, position: "RB", status: null } },
    { id: "bn4", position: "BN", label: "BN", note: null, player: { id: "michael-wilson", name: "Michael Wilson", team: "ARI" as TeamAbbr, position: "WR", status: null } },
    { id: "bn5", position: "BN", label: "BN", note: null, player: { id: "chris-rodriguez-jr", name: "Chris Rodriguez Jr.", team: "JAX" as TeamAbbr, position: "RB", status: null } },
    { id: "bn6", position: "BN", label: "BN", note: null, player: { id: "george-holani", name: "George Holani", team: "SEA" as TeamAbbr, position: "RB", status: null } },
      ],
      ir: [
    { id: "ir1", position: "IR", label: "IR", note: null, player: { id: "zach-charbonnet", name: "Zach Charbonnet", team: "SEA" as TeamAbbr, position: "RB", status: "IR" } },
      ],
    },
  },
  
  {
    id: "juice-booze",
    teamName: "Juice & Booze",
    manager: "Hugo",
    roster: {
      status: "ready",
      reason: null,
      league: LEAGUE.name,
      yahooId: LEAGUE.yahooId,
      ownerLabel: "Juice & Booze (Hugo)",
      teamName: "Juice & Booze",
      manager: "Hugo",
      slots: [
    { id: "qb", position: "QB", label: "QB", note: null, player: { id: "bo-nix", name: "Bo Nix", team: "DEN" as TeamAbbr, position: "QB", status: null } },
    { id: "rb1", position: "RB", label: "RB", note: null, player: { id: "christian-mccaffrey", name: "Christian McCaffrey", team: "SF" as TeamAbbr, position: "RB", status: null } },
    { id: "rb2", position: "RB", label: "RB", note: null, player: { id: "kenneth-walker-iii", name: "Kenneth Walker III", team: "KC" as TeamAbbr, position: "RB", status: null } },
    { id: "wr1", position: "WR", label: "WR", note: null, player: { id: "dj-moore", name: "DJ Moore", team: "BUF" as TeamAbbr, position: "WR", status: null } },
    { id: "wr2", position: "WR", label: "WR", note: null, player: { id: "brian-thomas-jr", name: "Brian Thomas Jr.", team: "JAX" as TeamAbbr, position: "WR", status: null } },
    { id: "te", position: "TE", label: "TE", note: null, player: { id: "tyler-warren", name: "Tyler Warren", team: "IND" as TeamAbbr, position: "TE", status: null } },
    { id: "flex", position: "FLEX", label: "FLEX", note: null, player: { id: "breece-hall", name: "Breece Hall", team: "NYJ" as TeamAbbr, position: "RB", status: null } },
    { id: "k", position: "K", label: "K", note: null, player: null },
    { id: "def", position: "DEF", label: "DEF", note: null, player: null },
      ],
      bench: [
    { id: "bn1", position: "BN", label: "BN", note: null, player: { id: "terry-mclaurin", name: "Terry McLaurin", team: "WAS" as TeamAbbr, position: "WR", status: null } },
    { id: "bn2", position: "BN", label: "BN", note: null, player: { id: "marvin-harrison-jr", name: "Marvin Harrison Jr.", team: "ARI" as TeamAbbr, position: "WR", status: null } },
    { id: "bn3", position: "BN", label: "BN", note: null, player: { id: "xavier-worthy", name: "Xavier Worthy", team: "KC" as TeamAbbr, position: "WR", status: null } },
    { id: "bn4", position: "BN", label: "BN", note: null, player: { id: "kc-concepcion", name: "KC Concepcion", team: "CLE" as TeamAbbr, position: "WR", status: null } },
    { id: "bn5", position: "BN", label: "BN", note: null, player: { id: "jake-ferguson", name: "Jake Ferguson", team: "DAL" as TeamAbbr, position: "TE", status: null } },
    { id: "bn6", position: "BN", label: "BN", note: null, player: { id: "zavion-thomas", name: "Zavion Thomas", team: "CHI" as TeamAbbr, position: "WR", status: null } },
      ],
      ir: [],
    },
  },
  
  {
    id: "such-a-burden",
    teamName: "Such a Burden",
    manager: "Jaime Bravo",
    roster: {
      status: "ready",
      reason: null,
      league: LEAGUE.name,
      yahooId: LEAGUE.yahooId,
      ownerLabel: "Such a Burden (Jaime Bravo)",
      teamName: "Such a Burden",
      manager: "Jaime Bravo",
      slots: [
    { id: "qb", position: "QB", label: "QB", note: null, player: { id: "josh-allen", name: "Josh Allen", team: "BUF" as TeamAbbr, position: "QB", status: null } },
    { id: "rb1", position: "RB", label: "RB", note: null, player: { id: "jacory-croskey-merritt", name: "Jacory Croskey-Merritt", team: "WAS" as TeamAbbr, position: "RB", status: null } },
    { id: "rb2", position: "RB", label: "RB", note: null, player: { id: "travis-etienne-jr", name: "Travis Etienne Jr.", team: "NO" as TeamAbbr, position: "RB", status: null } },
    { id: "wr1", position: "WR", label: "WR", note: null, player: { id: "a-j-brown", name: "A.J. Brown", team: "NE" as TeamAbbr, position: "WR", status: null } },
    { id: "wr2", position: "WR", label: "WR", note: null, player: { id: "devonta-smith", name: "DeVonta Smith", team: "PHI" as TeamAbbr, position: "WR", status: null } },
    { id: "te", position: "TE", label: "TE", note: null, player: { id: "kyle-pitts-sr", name: "Kyle Pitts Sr.", team: "ATL" as TeamAbbr, position: "TE", status: null } },
    { id: "flex", position: "FLEX", label: "FLEX", note: null, player: { id: "luther-burden-iii", name: "Luther Burden III", team: "CHI" as TeamAbbr, position: "WR", status: null } },
    { id: "k", position: "K", label: "K", note: null, player: null },
    { id: "def", position: "DEF", label: "DEF", note: null, player: null },
      ],
      bench: [
    { id: "bn1", position: "BN", label: "BN", note: null, player: { id: "josh-jacobs", name: "Josh Jacobs", team: "GB" as TeamAbbr, position: "RB", status: null } },
    { id: "bn2", position: "BN", label: "BN", note: null, player: { id: "michael-pittman-jr", name: "Michael Pittman Jr.", team: "PIT" as TeamAbbr, position: "WR", status: null } },
    { id: "bn3", position: "BN", label: "BN", note: null, player: { id: "rashid-shaheed", name: "Rashid Shaheed", team: "SEA" as TeamAbbr, position: "WR", status: null } },
    { id: "bn4", position: "BN", label: "BN", note: null, player: { id: "deebo-samuel-sr", name: "Deebo Samuel Sr.", team: "SF" as TeamAbbr, position: "WR", status: null } },
    { id: "bn5", position: "BN", label: "BN", note: null, player: { id: "denzel-boston", name: "Denzel Boston", team: "CLE" as TeamAbbr, position: "WR", status: null } },
      ],
      ir: [
    { id: "ir1", position: "IR", label: "IR", note: null, player: { id: "isiah-pacheco", name: "Isiah Pacheco", team: "DET" as TeamAbbr, position: "RB", status: "IR" } },
      ],
    },
  },
  
  {
    id: "taylor-gang",
    teamName: "Taylor Gang",
    manager: "Ryan",
    roster: {
      status: "ready",
      reason: null,
      league: LEAGUE.name,
      yahooId: LEAGUE.yahooId,
      ownerLabel: "Taylor Gang (Ryan)",
      teamName: "Taylor Gang",
      manager: "Ryan",
      slots: [
    { id: "qb", position: "QB", label: "QB", note: null, player: { id: "lamar-jackson", name: "Lamar Jackson", team: "BAL" as TeamAbbr, position: "QB", status: null } },
    { id: "rb1", position: "RB", label: "RB", note: null, player: { id: "james-cook-iii", name: "James Cook III", team: "BUF" as TeamAbbr, position: "RB", status: null } },
    { id: "rb2", position: "RB", label: "RB", note: null, player: { id: "david-montgomery", name: "David Montgomery", team: "HOU" as TeamAbbr, position: "RB", status: null } },
    { id: "wr1", position: "WR", label: "WR", note: null, player: { id: "davante-adams", name: "Davante Adams", team: "LAR" as TeamAbbr, position: "WR", status: null } },
    { id: "wr2", position: "WR", label: "WR", note: null, player: { id: "christian-watson", name: "Christian Watson", team: "GB" as TeamAbbr, position: "WR", status: null } },
    { id: "te", position: "TE", label: "TE", note: null, player: { id: "tucker-kraft", name: "Tucker Kraft", team: "GB" as TeamAbbr, position: "TE", status: null } },
    { id: "flex", position: "FLEX", label: "FLEX", note: null, player: { id: "garrett-wilson", name: "Garrett Wilson", team: "NYJ" as TeamAbbr, position: "WR", status: null } },
    { id: "k", position: "K", label: "K", note: null, player: null },
    { id: "def", position: "DEF", label: "DEF", note: null, player: null },
      ],
      bench: [
    { id: "bn1", position: "BN", label: "BN", note: null, player: { id: "courtland-sutton", name: "Courtland Sutton", team: "DEN" as TeamAbbr, position: "WR", status: null } },
    { id: "bn2", position: "BN", label: "BN", note: null, player: { id: "jordan-mason", name: "Jordan Mason", team: "MIN" as TeamAbbr, position: "RB", status: null } },
    { id: "bn3", position: "BN", label: "BN", note: null, player: { id: "trevor-lawrence", name: "Trevor Lawrence", team: "JAX" as TeamAbbr, position: "QB", status: null } },
    { id: "bn4", position: "BN", label: "BN", note: null, player: { id: "romeo-doubs", name: "Romeo Doubs", team: "NE" as TeamAbbr, position: "WR", status: null } },
    { id: "bn5", position: "BN", label: "BN", note: null, player: { id: "mark-andrews", name: "Mark Andrews", team: "BAL" as TeamAbbr, position: "TE", status: null } },
    { id: "bn6", position: "BN", label: "BN", note: null, player: { id: "najee-harris", name: "Najee Harris", team: "NYG" as TeamAbbr, position: "RB", status: null } },
      ],
      ir: [],
    },
  },
  
  {
    id: "tds-in-yo-face",
    teamName: "TDsInYoFace",
    manager: "Jonathan",
    roster: {
      status: "ready",
      reason: null,
      league: LEAGUE.name,
      yahooId: LEAGUE.yahooId,
      ownerLabel: "TDsInYoFace (Jonathan)",
      teamName: "TDsInYoFace",
      manager: "Jonathan",
      slots: [
    { id: "qb", position: "QB", label: "QB", note: null, player: { id: "jalen-hurts", name: "Jalen Hurts", team: "PHI" as TeamAbbr, position: "QB", status: null } },
    { id: "rb1", position: "RB", label: "RB", note: null, player: { id: "jonathan-taylor", name: "Jonathan Taylor", team: "IND" as TeamAbbr, position: "RB", status: null } },
    { id: "rb2", position: "RB", label: "RB", note: null, player: { id: "rhamondre-stevenson", name: "Rhamondre Stevenson", team: "NE" as TeamAbbr, position: "RB", status: null } },
    { id: "wr1", position: "WR", label: "WR", note: null, player: { id: "tee-higgins", name: "Tee Higgins", team: "CIN" as TeamAbbr, position: "WR", status: null } },
    { id: "wr2", position: "WR", label: "WR", note: null, player: { id: "ceedee-lamb", name: "CeeDee Lamb", team: "DAL" as TeamAbbr, position: "WR", status: null } },
    { id: "te", position: "TE", label: "TE", note: null, player: { id: "travis-kelce", name: "Travis Kelce", team: "KC" as TeamAbbr, position: "TE", status: null } },
    { id: "flex", position: "FLEX", label: "FLEX", note: null, player: { id: "jaylen-warren", name: "Jaylen Warren", team: "PIT" as TeamAbbr, position: "RB", status: null } },
    { id: "k", position: "K", label: "K", note: null, player: null },
    { id: "def", position: "DEF", label: "DEF", note: null, player: null },
      ],
      bench: [
    { id: "bn1", position: "BN", label: "BN", note: null, player: { id: "rashee-rice", name: "Rashee Rice", team: "KC" as TeamAbbr, position: "WR", status: null } },
    { id: "bn2", position: "BN", label: "BN", note: null, player: { id: "aaron-jones-sr", name: "Aaron Jones Sr.", team: "MIN" as TeamAbbr, position: "RB", status: null } },
    { id: "bn3", position: "BN", label: "BN", note: null, player: { id: "tyjae-spears", name: "Tyjae Spears", team: "TEN" as TeamAbbr, position: "RB", status: null } },
    { id: "bn4", position: "BN", label: "BN", note: null, player: { id: "brian-robinson", name: "Brian Robinson", team: "ATL" as TeamAbbr, position: "RB", status: null } },
    { id: "bn5", position: "BN", label: "BN", note: null, player: { id: "daniel-jones", name: "Daniel Jones", team: "IND" as TeamAbbr, position: "QB", status: null } },
      ],
      ir: [
    { id: "ir1", position: "IR", label: "IR", note: null, player: { id: "jordyn-tyson", name: "Jordyn Tyson", team: "NO" as TeamAbbr, position: "WR", status: "IR" } },
      ],
    },
  },
  
  {
    id: "wstd-mngmnt",
    teamName: "WSTD MNGMNT",
    manager: "Willy",
    roster: {
      status: "ready",
      reason: "Screenshot may be truncated after Josh Downs",
      league: LEAGUE.name,
      yahooId: LEAGUE.yahooId,
      ownerLabel: "WSTD MNGMNT (Willy)",
      teamName: "WSTD MNGMNT",
      manager: "Willy",
      slots: [
    { id: "qb", position: "QB", label: "QB", note: null, player: { id: "matthew-stafford", name: "Matthew Stafford", team: "LAR" as TeamAbbr, position: "QB", status: null } },
    { id: "rb1", position: "RB", label: "RB", note: null, player: { id: "ashton-jeanty", name: "Ashton Jeanty", team: "LV" as TeamAbbr, position: "RB", status: null } },
    { id: "rb2", position: "RB", label: "RB", note: null, player: { id: "cam-skattebo", name: "Cam Skattebo", team: "NYG" as TeamAbbr, position: "RB", status: null } },
    { id: "wr1", position: "WR", label: "WR", note: null, player: { id: "nico-collins", name: "Nico Collins", team: "HOU" as TeamAbbr, position: "WR", status: null } },
    { id: "wr2", position: "WR", label: "WR", note: null, player: { id: "dk-metcalf", name: "DK Metcalf", team: "PIT" as TeamAbbr, position: "WR", status: null } },
    { id: "te", position: "TE", label: "TE", note: null, player: { id: "harold-fannin-jr", name: "Harold Fannin Jr.", team: "CLE" as TeamAbbr, position: "TE", status: null } },
    { id: "flex", position: "FLEX", label: "FLEX", note: null, player: { id: "quinshon-judkins", name: "Quinshon Judkins", team: "CLE" as TeamAbbr, position: "RB", status: null } },
    { id: "k", position: "K", label: "K", note: null, player: null },
    { id: "def", position: "DEF", label: "DEF", note: null, player: null },
      ],
      bench: [
    { id: "bn1", position: "BN", label: "BN", note: null, player: { id: "jeremiyah-love", name: "Jeremiyah Love", team: "ARI" as TeamAbbr, position: "RB", status: null } },
    { id: "bn2", position: "BN", label: "BN", note: null, player: { id: "rachaad-white", name: "Rachaad White", team: "WAS" as TeamAbbr, position: "RB", status: null } },
    { id: "bn3", position: "BN", label: "BN", note: null, player: { id: "josh-downs", name: "Josh Downs", team: "IND" as TeamAbbr, position: "WR", status: null } },
      ],
      ir: [],
    },
  },
  
  {
    id: "zenahc-cool-arrows",
    teamName: "Zenahc cool arrows",
    manager: "Cornelio",
    roster: {
      status: "ready",
      reason: null,
      league: LEAGUE.name,
      yahooId: LEAGUE.yahooId,
      ownerLabel: "Zenahc cool arrows (Cornelio)",
      teamName: "Zenahc cool arrows",
      manager: "Cornelio",
      slots: [
    { id: "qb", position: "QB", label: "QB", note: null, player: { id: "joe-burrow", name: "Joe Burrow", team: "CIN" as TeamAbbr, position: "QB", status: null } },
    { id: "rb1", position: "RB", label: "RB", note: null, player: { id: "bijan-robinson", name: "Bijan Robinson", team: "ATL" as TeamAbbr, position: "RB", status: null } },
    { id: "rb2", position: "RB", label: "RB", note: null, player: { id: "kyren-williams", name: "Kyren Williams", team: "LAR" as TeamAbbr, position: "RB", status: null } },
    { id: "wr1", position: "WR", label: "WR", note: null, player: { id: "jaylen-waddle", name: "Jaylen Waddle", team: "MIA" as TeamAbbr, position: "WR", status: null } },
    { id: "wr2", position: "WR", label: "WR", note: null, player: { id: "jordan-addison", name: "Jordan Addison", team: "MIN" as TeamAbbr, position: "WR", status: null } },
    { id: "te", position: "TE", label: "TE", note: null, player: { id: "trey-mcbride", name: "Trey McBride", team: "ARI" as TeamAbbr, position: "TE", status: null } },
    { id: "flex", position: "FLEX", label: "FLEX", note: null, player: { id: "jameson-williams", name: "Jameson Williams", team: "DET" as TeamAbbr, position: "WR", status: null } },
    { id: "k", position: "K", label: "K", note: null, player: null },
    { id: "def", position: "DEF", label: "DEF", note: null, player: null },
      ],
      bench: [
    { id: "bn1", position: "BN", label: "BN", note: null, player: { id: "stefon-diggs", name: "Stefon Diggs", team: "HOU" as TeamAbbr, position: "WR", status: null } },
    { id: "bn2", position: "BN", label: "BN", note: null, player: { id: "jared-goff", name: "Jared Goff", team: "DET" as TeamAbbr, position: "QB", status: null } },
    { id: "bn3", position: "BN", label: "BN", note: null, player: { id: "rj-harvey", name: "RJ Harvey", team: "DEN" as TeamAbbr, position: "RB", status: null } },
    { id: "bn4", position: "BN", label: "BN", note: null, player: { id: "jayden-reed", name: "Jayden Reed", team: "GB" as TeamAbbr, position: "WR", status: null } },
    { id: "bn5", position: "BN", label: "BN", note: null, player: { id: "tyler-allgeier", name: "Tyler Allgeier", team: "ATL" as TeamAbbr, position: "RB", status: null } },
    { id: "bn6", position: "BN", label: "BN", note: null, player: { id: "brock-purdy", name: "Brock Purdy", team: "SF" as TeamAbbr, position: "QB", status: null } },
      ],
      ir: [],
    },
  },
];

export const MATCHUPS: WeekMatchup[] = [
  { id: "w1-1", week: 1, aTeamId: "go-birds", bTeamId: "gibb-it-to-me-baby" },
  { id: "w1-2", week: 1, aTeamId: "goodwrench", bTeamId: "apache-dogs" },
  { id: "w1-3", week: 1, aTeamId: "juice-booze", bTeamId: "taylor-gang" },
  { id: "w1-4", week: 1, aTeamId: "cheesehead-hooligans", bTeamId: "zenahc-cool-arrows" },
  { id: "w1-5", week: 1, aTeamId: "tds-in-yo-face", bTeamId: "such-a-burden" },
  { id: "w1-6", week: 1, aTeamId: "cheese-me", bTeamId: "wstd-mngmnt" },
];

export function getTeamById(id: string): LeagueTeam | undefined {
  return TEAMS.find((t) => t.id === id);
}

export function getTeamByName(name: string): LeagueTeam | undefined {
  const n = name.trim().toLowerCase();
  return TEAMS.find((t) => t.teamName.toLowerCase() === n);
}

export function loadRosterForTeam(teamId: string = DEFAULT_TEAM_ID): FantasyRoster {
  const team = getTeamById(teamId) ?? getTeamById(DEFAULT_TEAM_ID)!;
  return team.roster;
}

export function getWeek1Matchups(): Array<{
  id: string;
  week: number;
  a: LeagueTeam;
  b: LeagueTeam;
}> {
  return MATCHUPS.map((m) => {
    const a = getTeamById(m.aTeamId)!;
    const b = getTeamById(m.bTeamId)!;
    return { id: m.id, week: m.week, a, b };
  });
}
