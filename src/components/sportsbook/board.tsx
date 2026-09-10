import { GameCard } from "@/components/sportsbook/game-card";
import { UnavailablePlaque } from "@/components/sportsbook/unavailable-plaque";
import { Badge } from "@/components/ui/badge";
import type { OddsBoard } from "@/lib/odds";
import type { ScoreBoard } from "@/lib/scores";

export function Board({ odds, scores }: { odds: OddsBoard; scores: ScoreBoard }) {
  const weekLabel = odds.week ? `Week ${odds.week}` : "Week unavailable";
  const byId = new Map(scores.games.map((game) => [game.gameId, game]));

  const sortedGames = [...odds.games].sort((a, b) => {
    const aLive = byId.get(a.id)?.inProgress ? 0 : 1;
    const bLive = byId.get(b.id)?.inProgress ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    const aPending = byId.get(a.id)?.phase === "pending" || !byId.get(a.id) ? 0 : 1;
    const bPending = byId.get(b.id)?.phase === "pending" || !byId.get(b.id) ? 0 : 1;
    return aPending - bPending;
  });

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone={odds.week ? "gold" : "unavailable"}>{weekLabel}</Badge>
        <Badge tone="gold">Spreads</Badge>
        <Badge tone="snapshot">Sim</Badge>
      </div>
      <p className="mb-4 text-xs text-muted truncate">
        {odds.sourceLabel ?? "Source unavailable"}
      </p>

      {odds.status !== "ready" || odds.games.length === 0 ? (
        <UnavailablePlaque
          kicker="BetMGM snapshot"
          title="Lines unavailable"
          detail={
            odds.reason ??
            "The slate has not been inserted for this build. Markets stay empty until a real snapshot is baked in. No numbers are invented."
          }
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {sortedGames.map((game) => (
            <GameCard key={game.id} game={game} score={byId.get(game.id)} />
          ))}
        </div>
      )}
    </section>
  );
}
