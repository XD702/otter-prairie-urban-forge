/**
 * Static Speed Trivia pack for Eastside Legends Sim Arcade.
 * Sources: exact Eastside team names, generic NFL rules, seeded roster
 * facts already in league-data (go-birds etc.). NO live injuries invented.
 * Simulation only — not real money.
 */

export type TriviaQuestion = {
  id: string;
  prompt: string;
  choices: [string, string, string, string];
  /** Index into choices (0–3). */
  answer: 0 | 1 | 2 | 3;
};

/**
 * ~16 questions. Keep answers grounded in league-data / NFL basics only.
 */
export const TRIVIA_PACK: TriviaQuestion[] = [
  {
    id: "t01",
    prompt: "How many downs does an NFL offense get to gain 10 yards?",
    choices: ["3", "4", "5", "6"],
    answer: 1,
  },
  {
    id: "t02",
    prompt: "How many players does each NFL team have on the field at a time?",
    choices: ["10", "11", "12", "15"],
    answer: 1,
  },
  {
    id: "t03",
    prompt: "Which Eastside team id is the default roster (manager Roberto)?",
    choices: ["apache-dogs", "go-birds", "goodwrench", "taylor-gang"],
    answer: 1,
  },
  {
    id: "t04",
    prompt: "What is the Yahoo league id for League of Eastside Legends?",
    choices: ["288732", "202626", "100001", "555555"],
    answer: 0,
  },
  {
    id: "t05",
    prompt: "Who is the seeded QB on Go birds (league-data)?",
    choices: ["Jordan Love", "Drake Maye", "Dak Prescott", "Baker Mayfield"],
    answer: 2,
  },
  {
    id: "t06",
    prompt: "Which WR is seeded on Go birds: Ja'Marr Chase or Puka Nacua?",
    choices: ["Ja'Marr Chase", "Puka Nacua", "Neither", "Both"],
    answer: 0,
  },
  {
    id: "t07",
    prompt: "How many teams are in League of Eastside Legends (league-data)?",
    choices: ["8", "10", "12", "14"],
    answer: 2,
  },
  {
    id: "t08",
    prompt: "Week 1 matchup w1-1 pairs Go birds against which team id?",
    choices: ["goodwrench", "gibb-it-to-me-baby", "taylor-gang", "cheese-me"],
    answer: 1,
  },
  {
    id: "t09",
    prompt: "What Eastside team name does manager MAJ run?",
    choices: ["Goodwrench", "APACHEDOGS", "Taylor Gang", "WSTD MNGMNT"],
    answer: 1,
  },
  {
    id: "t10",
    prompt: "Amon-Ra St. Brown is seeded at which position on Go birds?",
    choices: ["RB", "TE", "WR", "QB"],
    answer: 2,
  },
  {
    id: "t11",
    prompt: "How many points is a standard NFL touchdown worth?",
    choices: ["3", "6", "7", "8"],
    answer: 1,
  },
  {
    id: "t12",
    prompt: "Cheesehead hooligans is managed by whom (league-data)?",
    choices: ["Gibb", "Leon", "matthew", "MAJ"],
    answer: 1,
  },
  {
    id: "t13",
    prompt: "Bucky Irving is seeded on which Eastside roster?",
    choices: ["Goodwrench", "Go birds", "Juice & Booze", "APACHEDOGS"],
    answer: 1,
  },
  {
    id: "t14",
    prompt: "In the NFL, a field goal is normally worth how many points?",
    choices: ["1", "2", "3", "6"],
    answer: 2,
  },
  {
    id: "t15",
    prompt: "Packers DEF is seeded on which Eastside team?",
    choices: ["go-birds", "apache-dogs", "cheese-me", "wstd-mngmnt"],
    answer: 0,
  },
  {
    id: "t16",
    prompt: "Sim bankroll starting amount shared with the Board is?",
    choices: ["50", "100", "250", "1000"],
    answer: 1,
  },
];

/** Shuffle a copy (Fisher–Yates). */
export function shuffleTrivia(pack: TriviaQuestion[] = TRIVIA_PACK): TriviaQuestion[] {
  const a = [...pack];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
