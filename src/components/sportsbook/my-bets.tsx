import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UnavailablePlaque } from "@/components/sportsbook/unavailable-plaque";
import { formatAmerican } from "@/lib/betting/american";
import { useBook, type TicketStatus } from "@/lib/betting/store";
import { liveLine, type ScoreBoard } from "@/lib/scores";
import { formatMoney } from "@/lib/utils";

const STATUS_TONE: Record<TicketStatus, "pending" | "final" | "unavailable" | "gold" | "snapshot"> =
  {
    open: "pending",
    won: "final",
    lost: "unavailable",
    push: "snapshot",
    void: "unavailable",
  };

export function MyBets({ scores }: { scores: ScoreBoard }) {
  const tickets = useBook((s) => s.tickets);
  const resetBook = useBook((s) => s.resetBook);
  const byId = new Map(scores.games.map((game) => [game.gameId, game]));

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Tickets</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-cream">My bets</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={resetBook}>
          Reset sim bankroll
        </Button>
      </div>
      <p className="mb-5 text-sm text-muted">
        Settlement waits on a final score. Live layer: ESPN public scoreboard, 30s while games
        are in progress. Current feed: {scores.status === "ready" ? "posted" : "unavailable"}.
        Simulation only. No real money.
      </p>

      {tickets.length === 0 ? (
        <UnavailablePlaque
          kicker="Window"
          title="No tickets yet"
          detail="Tap a posted spread on the board, then book a sim ticket. Juice is unavailable on this snapshot, so tickets are unpriced until a priced feed is swapped in."
        />
      ) : (
        <ul className="space-y-3">
          {tickets.map((ticket) => (
            <li
              key={ticket.id}
              className="rounded-[var(--radius-lg)] border border-gold/25 bg-felt-raise p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg text-cream">
                    {ticket.legs.length > 1 ? `${ticket.legs.length}-leg parlay` : "Straight"}
                  </p>
                  <p className="text-xs text-muted tabular-nums">
                    {new Date(ticket.placedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge tone={STATUS_TONE[ticket.status]}>{ticket.status}</Badge>
                  {ticket.priced ? null : <Badge tone="unavailable">Unpriced</Badge>}
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-cream">
                {ticket.legs.map((leg) => {
                  const live = byId.get(leg.gameId);
                  return (
                    <li key={leg.id} className="flex justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block">{leg.label}</span>
                        <span className="block text-xs tabular-nums text-gold-bright">
                          {live ? liveLine(live) : "Score unavailable"}
                        </span>
                      </span>
                      <span className="text-gold tabular-nums">
                        {leg.odds === null ? "Unavailable" : formatAmerican(leg.odds)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted">
                <div>
                  <dt>Stake</dt>
                  <dd className="text-cream tabular-nums">{formatMoney(ticket.stake)}</dd>
                </div>
                <div>
                  <dt>To win</dt>
                  <dd className="text-gold tabular-nums">
                    {ticket.toWin === null ? "Unavailable" : formatMoney(ticket.toWin)}
                  </dd>
                </div>
                <div>
                  <dt>Price</dt>
                  <dd className="text-cream tabular-nums">
                    {ticket.americanOdds === null ? "Unavailable" : formatAmerican(ticket.americanOdds)}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
