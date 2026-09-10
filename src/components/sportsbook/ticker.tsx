import { liveLine, SCORES_UNAVAILABLE, type GameScore, type ScoreBoard } from "@/lib/scores";
import { NFL_TEAMS } from "@/lib/nfl/teams";

function phaseLabel(game: Pick<GameScore, "phase" | "inProgress">) {
  if (game.inProgress) return "LIVE";
  if (game.phase === "final") return "Final";
  if (game.phase === "pending") return "Pending";
  return "Snapshot";
}

function lineText(game: GameScore) {
  const away = NFL_TEAMS[game.away];
  const home = NFL_TEAMS[game.home];
  return `${away.abbr} @ ${home.abbr}  ${liveLine(game)}`;
}

export function Ticker({ scores }: { scores: ScoreBoard }) {
  const ready = scores.status === "ready" && scores.games.length > 0;
  const items = ready
    ? scores.games.map((game) => ({
        id: game.gameId,
        text: lineText(game),
        phase: game.phase,
        inProgress: game.inProgress,
      }))
    : [
        {
          id: "unavailable",
          text: SCORES_UNAVAILABLE,
          phase: "snapshot" as const,
          inProgress: false,
        },
      ];

  const loop = [...items, ...items, ...items];

  return (
    <div className="relative overflow-hidden border-y line-gold bg-void">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-void to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-void to-transparent" />
      <div className="flex items-center gap-3 px-3 py-2">
        <span className="shrink-0 font-display text-[11px] uppercase tracking-[0.22em] text-muted">
          Ticker
        </span>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <ul className="ticker-track flex w-max items-center gap-10 motion-safe:animate-[ticker_36s_linear_infinite]">
            {loop.map((item, i) => (
              <li key={`${item.id}-${i}`} className="flex items-center gap-3 text-sm text-cream">
                <span className="text-neon-magenta" aria-hidden="true">
                  ◆
                </span>
                {item.inProgress ? (
                  <span className="live-pulse rounded-[var(--radius-pill)] border border-neon-magenta/50 bg-neon-magenta/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neon-magenta shadow-[var(--shadow-glow-magenta)]">
                    LIVE
                  </span>
                ) : ready ? (
                  <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                    {phaseLabel(item)}
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-[0.14em] text-muted">Unavailable</span>
                )}
                <span className="whitespace-nowrap font-medium tracking-wide tabular-nums text-cream">
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}