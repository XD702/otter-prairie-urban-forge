import { GameCard } from "@/components/sportsbook/game-card";
import { UnavailablePlaque } from "@/components/sportsbook/unavailable-plaque";
import { Badge } from "@/components/ui/badge";
import type { OddsBoard } from "@/lib/odds";
import type { ScoreBoard } from "@/lib/scores";

export function Board({ odds, scores }: { odds: OddsBoard; scores: ScoreBoard }) {
  const weekLabel = odds.week ? `Week ${odds.week}` : "Week unavailable";
  const byId = new Map(scores.games.map((game) => [game.gameId, game]));

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">The card</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-cream">NFL board</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={odds.week ? "gold" : "unavailable"}>{weekLabel}</Badge>
          <Badge tone="gold">Spreads only</Badge>
          <Badge tone="snapshot">Simulation</Badge>
        </div>
      </div>
      <p className="mb-2 text-sm leading-relaxed text-cream text-pretty">
        {odds.sourceLabel ?? "Source unavailable"}
      </p>
      <p className="mb-5 text-sm text-muted">
        Dated snapshot, not a live scrape. One book: BetMGM. Moneyline, total, and juice are
        unavailable — not invented. No real money.
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
          {odds.games.map((game) => (
            <GameCard key={game.id} game={game} score={byId.get(game.id)} />
          ))}
        </div>
      )}
    </section>
  );
}
