import { Badge } from "@/components/ui/badge";
import type { GameLine } from "@/lib/odds";
import { liveLine, type GameScore } from "@/lib/scores";
import { NFL_TEAMS } from "@/lib/nfl/teams";
import { formatSpreadLine } from "@/lib/betting/american";
import { useBook, type MarketKind, type SelectionSide } from "@/lib/betting/store";
import { cn } from "@/lib/utils";

interface CellProps {
  label: string;
  value: string;
  posted: boolean;
  onPick: () => void;
  active: boolean;
}

function OddsCell({ label, value, posted, onPick, active }: CellProps) {
  return (
    <button
      type="button"
      disabled={!posted}
      onClick={onPick}
      className={cn(
        "flex min-h-11 flex-col items-center justify-center rounded-[var(--radius-sm)] border px-2 py-1.5 text-center transition-colors duration-[var(--motion-quick)]",
        posted
          ? active
            ? "border-gold bg-gold/15 text-gold"
            : "border-gold/25 bg-ink/40 text-cream hover:border-gold/55 hover:bg-gold/10"
          : "cursor-not-allowed border-cream/10 bg-ink/30 text-muted",
      )}
    >
      <span className="text-[10px] uppercase tracking-[0.16em] text-muted">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </button>
  );
}

export function GameCard({ game, score }: { game: GameLine; score?: GameScore }) {
  const addLeg = useBook((s) => s.addLeg);
  const slip = useBook((s) => s.slip);
  const away = NFL_TEAMS[game.away];
  const home = NFL_TEAMS[game.home];

  const isActive = (market: MarketKind, side: SelectionSide) =>
    slip.some((leg) => leg.gameId === game.id && leg.market === market && leg.side === side);

  const pickSpread = (side: SelectionSide, line: number | null, label: string) => {
    if (line === null) return;
    addLeg({
      gameId: game.id,
      label,
      market: "spread",
      side,
      line,
      odds: null,
      book: game.book,
    });
  };

  const kickoff = game.kickoffLabel ?? "Kickoff unavailable";
  const matchupMark = game.neutralSite ? "vs" : "@";
  const live = score?.inProgress;

  return (
    <article className="rounded-[var(--radius-lg)] border border-gold/25 bg-felt-raise p-3 shadow-[inset_0_1px_0_rgba(227,197,106,0.12)] sm:p-4">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg leading-tight text-cream">
            {away.abbr} <span className="text-muted">{matchupMark}</span> {home.abbr}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {away.city} {away.name} {game.neutralSite ? "vs" : "at"} {home.city} {home.name}
          </p>
          {score ? (
            <p className="mt-1 text-sm font-semibold tabular-nums text-gold-bright">{liveLine(score)}</p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1">
          {game.opener ? <Badge tone="gold">Opener</Badge> : null}
          {game.book ? <Badge tone="gold">{game.book}</Badge> : <Badge tone="unavailable">Book unavailable</Badge>}
          {game.venue ? <Badge tone="snapshot">{game.venue}</Badge> : null}
          {live ? <Badge tone="pending">Live</Badge> : null}
          {score?.phase === "final" ? <Badge tone="final">Final</Badge> : null}
          <span className="text-[11px] text-muted tabular-nums">{kickoff}</span>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2 text-[11px] uppercase tracking-[0.14em] text-gold/80">
        <span className="px-1">Spread</span>
        <span className="px-1">Moneyline</span>
        <span className="px-1">Total</span>
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        <div className="grid gap-1.5">
          <OddsCell
            label={away.abbr}
            value={formatSpreadLine(game.spread.awayLine)}
            posted={game.spread.awayLine !== null}
            active={isActive("spread", "away")}
            onPick={() =>
              pickSpread("away", game.spread.awayLine, `${away.abbr} ${formatSpreadLine(game.spread.awayLine)}`)
            }
          />
          <OddsCell
            label={home.abbr}
            value={formatSpreadLine(game.spread.homeLine)}
            posted={game.spread.homeLine !== null}
            active={isActive("spread", "home")}
            onPick={() =>
              pickSpread("home", game.spread.homeLine, `${home.abbr} ${formatSpreadLine(game.spread.homeLine)}`)
            }
          />
        </div>
        <div className="grid gap-1.5">
          <OddsCell label={away.abbr} value="Unavailable" posted={false} active={false} onPick={() => undefined} />
          <OddsCell label={home.abbr} value="Unavailable" posted={false} active={false} onPick={() => undefined} />
        </div>
        <div className="grid gap-1.5">
          <OddsCell label="Over" value="Unavailable" posted={false} active={false} onPick={() => undefined} />
          <OddsCell label="Under" value="Unavailable" posted={false} active={false} onPick={() => undefined} />
        </div>
      </div>
    </article>
  );
}
