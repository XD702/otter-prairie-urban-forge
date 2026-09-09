ONE-SENTENCE ASK
I will wire ESPN public scoreboard as a swappable live-scores layer on Eastside Legends Sim, polling every 30s during in-progress games, without crashing the app if the feed fails.

PROMPT
Live scores module (free, unofficial): Wire the ESPN public scoreboard endpoint — site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard — as the live score source. No API key, no signup. Poll it every thirty seconds while games are in progress, updating the ticker, game cards, and any open bet slips with quarter, clock, and score.

This is an unofficial feed that can break or change without notice. Wrap every call in error handling: on failure, show "Scores unavailable" in the ticker and keep the rest of the page working. Never let a score fetch crash the app.

Treat this as a swappable layer — same pattern as the odds module. When a paid feed like The Odds API is added later, swap the source without touching the rest of the app.

KEEP
- Existing BetMGM Week 1 spreads board (USA Today dated snapshot)
- Fake bankroll / sim bets
- The left-side roster ALREADY on the live site (Dak, Bucky, Dobbins, Amon-Ra, Chase Q, Loveland, Goedert flex, Jake Elliott, Packers DEF; bench Henderson Out, Ridley, Gainwell, Pierce). Do NOT clear roster to empty slots. Do NOT invent new players or a right-side opponent.
- Simulation only, no real money

DO NOT
- Build auth, all 12 rosters, group chat, The Odds API, or EESL coins in this pass
- Invent scores, odds, or players
- Touch Wellness / Loco
- Wipe or blank the roster that is already published

SUCCESS
- Live or final games show score/quarter/clock from ESPN when available
- Feed failure shows Scores unavailable and the page stays up
- Publish and send the live link
- Report Ask / Assumptions / Changed / Did NOT / How to poke
