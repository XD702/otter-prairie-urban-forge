import { liveLine, SCORES_UNAVAILABLE, type GameScore, type ScoreBoard } from "@/lib/scores";
import { NFL_TEAMS } from "@/lib/nfl/teams";
import { Badge } from "@/components/ui/badge";

function phaseTone(game: Pick<GameScore, "phase" | "inProgress">) {
  if (game.inProgress) return "pending" as const;
  if (game.phase === "final") return "final" as const;
  if (game.phase === "pending") return "pending" as const;
  return "snapshot" as const;
}

function phaseLabel(game: Pick<GameScore, "phase" | "inProgress">) {
  if (game.inProgress) return "Live";
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
  const live = scores.status === "ready" && scores.games.length > 0;
  const items = live
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
    <div className="relative overflow-hidden border-y border-gold/20 bg-ink">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-ink to-transparent" />
      <div className="flex items-center gap-3 px-3 py-2">
        <Badge tone="gold" className="shrink-0">
          Ticker
        </Badge>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <ul className="ticker-track flex w-max items-center gap-10 motion-safe:animate-[ticker_36s_linear_infinite]">
            {loop.map((item, i) => (
              <li key={`${item.id}-${i}`} className="flex items-center gap-3 text-sm text-cream">
                <Badge tone={phaseTone(item)}>{live ? phaseLabel(item) : "Unavailable"}</Badge>
                <span className="whitespace-nowrap font-medium tracking-wide tabular-nums">
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
