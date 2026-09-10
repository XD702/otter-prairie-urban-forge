/**
 * Speed Trivia pack — NFL history, Super Bowls, legendary plays,
 * all-time records, classic matchups. Verified public facts only.
 * No Eastside roster / Yahoo / injuries. Simulation only.
 */

export type TriviaQuestion = {
  id: string;
  prompt: string;
  choices: [string, string, string, string];
  /** Index into choices (0–3). */
  answer: 0 | 1 | 2 | 3;
};

export const TRIVIA_PACK: TriviaQuestion[] = [
  {
    id: "nfl01",
    prompt: "Which team won Super Bowl I (1967)?",
    choices: ["Green Bay Packers", "Kansas City Chiefs", "Dallas Cowboys", "Oakland Raiders"],
    answer: 0,
  },
  {
    id: "nfl02",
    prompt: "Who was Super Bowl I MVP?",
    choices: ["Bart Starr", "Joe Namath", "Len Dawson", "Ray Nitschke"],
    answer: 0,
  },
  {
    id: "nfl03",
    prompt: "Which Jets QB famously guaranteed a Super Bowl III win?",
    choices: ["Joe Namath", "Fran Tarkenton", "Johnny Unitas", "Daryle Lamonica"],
    answer: 0,
  },
  {
    id: "nfl04",
    prompt: "The 'Immaculate Reception' (1972) was a Steelers catch by whom?",
    choices: ["Franco Harris", "Lynn Swann", "John Stallworth", "Rocky Bleier"],
    answer: 0,
  },
  {
    id: "nfl05",
    prompt: "Who caught the 'Helmet Catch' in Super Bowl XLII?",
    choices: ["David Tyree", "Plaxico Burress", "Wes Welker", "Randy Moss"],
    answer: 0,
  },
  {
    id: "nfl06",
    prompt: "The 2001 AFC Divisional 'Tuck Rule' game featured which Patriots kicker's overtime winner?",
    choices: ["Adam Vinatieri", "Stephen Gostkowski", "John Carney", "Matt Bahr"],
    answer: 0,
  },
  {
    id: "nfl07",
    prompt: "Who holds the NFL record for most career regular-season passing yards (among widely cited leaders through the 2020s)?",
    choices: ["Tom Brady", "Drew Brees", "Peyton Manning", "Brett Favre"],
    answer: 0,
  },
  {
    id: "nfl08",
    prompt: "Which running back holds the NFL career rushing yards record?",
    choices: ["Emmitt Smith", "Walter Payton", "Barry Sanders", "Frank Gore"],
    answer: 0,
  },
  {
    id: "nfl09",
    prompt: "Jerry Rice is best known as the all-time leader in which receiving category?",
    choices: ["Career receiving yards (and TDs)", "Single-game catches only", "Kick return TDs", "Interceptions"],
    answer: 0,
  },
  {
    id: "nfl10",
    prompt: "How many Super Bowl titles have the New England Patriots franchise won (Brady/Belichick era total for the club)?",
    choices: ["6", "4", "5", "3"],
    answer: 0,
  },
  {
    id: "nfl11",
    prompt: "Which team completed the only perfect Super Bowl–winning season (17–0 including playoffs) in the Super Bowl era?",
    choices: ["1972 Miami Dolphins", "1985 Chicago Bears", "2007 New England Patriots", "1984 San Francisco 49ers"],
    answer: 0,
  },
  {
    id: "nfl12",
    prompt: "Super Bowl XXV is remembered for a missed field goal by which Bills kicker?",
    choices: ["Scott Norwood", "Steve Christie", "Olindo Mare", "Rian Lindell"],
    answer: 0,
  },
  {
    id: "nfl13",
    prompt: "In the Music City Miracle, who threw the lateral that set up the winning kickoff return?",
    choices: ["Frank Wycheck", "Kevin Dyson", "Eddie George", "Steve McNair"],
    answer: 0,
  },
  {
    id: "nfl14",
    prompt: "Who caught the winning touchdown in the Music City Miracle?",
    choices: ["Kevin Dyson", "Frank Wycheck", "Derrick Mason", "Yancey Thigpen"],
    answer: 0,
  },
  {
    id: "nfl15",
    prompt: "Which 49ers QB threw 'The Catch' to Dwight Clark in the 1981 NFC Championship?",
    choices: ["Joe Montana", "Steve Young", "John Brodie", "Jeff Garcia"],
    answer: 0,
  },
  {
    id: "nfl16",
    prompt: "The 'Fail Mary' (2012) involved which two NFC West rivals?",
    choices: ["Seahawks and Packers (in Seattle)", "Seahawks and 49ers", "Packers and Bears", "Rams and Cardinals"],
    answer: 0,
  },
  {
    id: "nfl17",
    prompt: "Which Raiders owner was famous for 'Just win, baby'?",
    choices: ["Al Davis", "Art Rooney", "Wellington Mara", "Lamar Hunt"],
    answer: 0,
  },
  {
    id: "nfl18",
    prompt: "Lamar Hunt founded which AFL/NFL franchise and coined 'Super Bowl'?",
    choices: ["Kansas City Chiefs (Dallas Texans origin)", "Buffalo Bills", "New York Jets", "Denver Broncos"],
    answer: 0,
  },
  {
    id: "nfl19",
    prompt: "How many points is a standard NFL touchdown worth (before PAT/2-pt)?",
    choices: ["6", "7", "3", "8"],
    answer: 0,
  },
  {
    id: "nfl20",
    prompt: "A regulation NFL field goal is worth how many points?",
    choices: ["3", "2", "1", "6"],
    answer: 0,
  },
  {
    id: "nfl21",
    prompt: "Which Broncos QB led Denver to Super Bowl wins in the late 1990s?",
    choices: ["John Elway", "Peyton Manning", "Jake Plummer", "Brian Griese"],
    answer: 0,
  },
  {
    id: "nfl22",
    prompt: "Who was named MVP of Super Bowl XLIX?",
    choices: ["Tom Brady", "Malcolm Butler", "Rob Gronkowski", "Marshawn Lynch"],
    answer: 0,
  },
  {
    id: "nfl23",
    prompt: "Malcolm Butler's famous Super Bowl XLIX interception came against which team?",
    choices: ["Seattle Seahawks", "Atlanta Falcons", "Philadelphia Eagles", "Los Angeles Rams"],
    answer: 0,
  },
  {
    id: "nfl24",
    prompt: "Which Eagles QB won Super Bowl LII MVP?",
    choices: ["Nick Foles", "Carson Wentz", "Donovan McNabb", "Jalen Hurts"],
    answer: 0,
  },
  {
    id: "nfl25",
    prompt: "The 'Minneapolis Miracle' (2018) was a Vikings walk-off TD catch by whom?",
    choices: ["Stefon Diggs", "Adam Thielen", "Kyle Rudolph", "Cordarrelle Patterson"],
    answer: 0,
  },
  {
    id: "nfl26",
    prompt: "Which Cowboys triplet nickname covered Dwight White's era defense? (Hint: classic Cowboys D)",
    choices: ["Doomsday Defense", "Purple People Eaters", "Steel Curtain", "Legion of Boom"],
    answer: 0,
  },
  {
    id: "nfl27",
    prompt: "The Steel Curtain was the nickname for which team's historic defense?",
    choices: ["Pittsburgh Steelers", "Chicago Bears", "Baltimore Ravens", "New York Giants"],
    answer: 0,
  },
  {
    id: "nfl28",
    prompt: "Which Packers coach won the first two Super Bowls?",
    choices: ["Vince Lombardi", "Mike Holmgren", "Curly Lambeau", "Mike McCarthy"],
    answer: 0,
  },
  {
    id: "nfl29",
    prompt: "The Vince Lombardi Trophy is awarded to the winner of what?",
    choices: ["The Super Bowl", "The NFC Championship only", "The Heisman", "The Pro Bowl"],
    answer: 0,
  },
  {
    id: "nfl30",
    prompt: "Which Rams–Titans Super Bowl is remembered as a last-second tackle at the goal line (One Yard Short)?",
    choices: ["Super Bowl XXXIV", "Super Bowl XXXVI", "Super Bowl XL", "Super Bowl 50"],
    answer: 0,
  },
  {
    id: "nfl31",
    prompt: "Who rushed for 2,105 yards in a single NFL season (1984 record at the time)?",
    choices: ["Eric Dickerson", "O.J. Simpson", "Adrian Peterson", "Jamals Charles"],
    answer: 0,
  },
  {
    id: "nfl32",
    prompt: "Adrian Peterson's 2,097-yard season came with which team?",
    choices: ["Minnesota Vikings", "New Orleans Saints", "Chicago Bears", "Arizona Cardinals"],
    answer: 0,
  },
  {
    id: "nfl33",
    prompt: "Which QB threw for 55 touchdowns in the 2013 NFL season?",
    choices: ["Peyton Manning", "Tom Brady", "Aaron Rodgers", "Drew Brees"],
    answer: 0,
  },
  {
    id: "nfl34",
    prompt: "The 'Legion of Boom' secondary starred for which 2010s franchise?",
    choices: ["Seattle Seahawks", "San Francisco 49ers", "Denver Broncos", "Carolina Panthers"],
    answer: 0,
  },
  {
    id: "nfl35",
    prompt: "Who returned a kickoff for a TD to open Super Bowl XLVIII for Seattle?",
    choices: ["Percy Harvin", "Marshawn Lynch", "Golden Tate", "Jermaine Kearse"],
    answer: 0,
  },
  {
    id: "nfl36",
    prompt: "How many downs does an NFL offense get to gain 10 yards?",
    choices: ["4", "3", "5", "6"],
    answer: 0,
  },
  {
    id: "nfl37",
    prompt: "How many players is each NFL team allowed on the field on a given play?",
    choices: ["11", "10", "12", "15"],
    answer: 0,
  },
  {
    id: "nfl38",
    prompt: "Which classic rivalry is nicknamed the 'Bears–Packers rivalry'?",
    choices: ["Chicago Bears vs Green Bay Packers", "Bears vs Lions only", "Packers vs Vikings only", "Bears vs Rams"],
    answer: 0,
  },
  {
    id: "nfl39",
    prompt: "The AFL–NFL merger was completed for the 1970 season. Which conference did former AFL teams largely form?",
    choices: ["AFC", "NFC", "AAFC", "USFL"],
    answer: 0,
  },
  {
    id: "nfl40",
    prompt: "Which wideout made a tiptoe sideline catch for the Steelers in Super Bowl XLIII?",
    choices: ["Santonio Holmes", "Hines Ward", "Antwaan Randle El", "Mike Wallace"],
    answer: 0,
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
