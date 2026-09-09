import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { combineAmerican, formatAmerican, toWin } from "@/lib/betting/american";
import { STAKE_PRESETS, useBook } from "@/lib/betting/store";
import { liveLine, type ScoreBoard } from "@/lib/scores";
import { formatMoney } from "@/lib/utils";
import { X } from "lucide-react";

export function BetSlip({ scores }: { scores: ScoreBoard }) {
  const slip = useBook((s) => s.slip);
  const stake = useBook((s) => s.stake);
  const bankroll = useBook((s) => s.bankroll);
  const notice = useBook((s) => s.notice);
  const removeLeg = useBook((s) => s.removeLeg);
  const clearSlip = useBook((s) => s.clearSlip);
  const setStake = useBook((s) => s.setStake);
  const placeBet = useBook((s) => s.placeBet);
  const clearNotice = useBook((s) => s.clearNotice);
  const byId = new Map(scores.games.map((game) => [game.gameId, game]));

  const priced = slip.length > 0 && slip.every((leg) => leg.odds !== null);
  const american = priced ? combineAmerican(slip.map((leg) => leg.odds as number)) : null;
  const win = priced && american !== null ? toWin(stake, american) : null;
  const payout = win !== null ? win + stake : null;

  return (
    <aside className="rounded-[var(--radius-xl)] border border-gold/30 bg-felt-deep p-4 shadow-[inset_0_1px_0_rgba(227,197,106,0.12)]">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Window</p>
          <h2 className="font-display text-2xl font-semibold text-cream">Bet slip</h2>
        </div>
        {slip.length > 0 ? (
          <button
            type="button"
            onClick={clearSlip}
            className="text-xs uppercase tracking-[0.16em] text-muted hover:text-cream"
          >
            Clear
          </button>
        ) : null}
      </div>

      {slip.length === 0 ? (
        <p className="mt-5 text-sm leading-relaxed text-muted text-pretty">
          Tap a posted spread to add a sim lean. This snapshot has no juice, so tickets are
          unpriced. Simulation only.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {slip.map((leg) => {
            const live = byId.get(leg.gameId);
            return (
              <li
                key={leg.id}
                className="flex items-start justify-between gap-2 rounded-[var(--radius-md)] border border-gold/20 bg-ink/40 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-cream">{leg.label}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">
                    {leg.market} {leg.book ? `· ${leg.book}` : ""}
                  </p>
                  <p className="mt-1 text-xs tabular-nums text-gold-bright">
                    {live ? liveLine(live) : "Score unavailable"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gold tabular-nums">
                    {leg.odds === null ? "Unpriced" : formatAmerican(leg.odds)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${leg.label}`}
                    onClick={() => removeLeg(leg.id)}
                    className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:text-cream"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-5 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold">Stake</p>
        <div className="flex flex-wrap gap-1.5">
          {STAKE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setStake(preset)}
              className={`h-9 min-w-11 rounded-full border px-3 text-xs tabular-nums ${
                stake === preset
                  ? "border-gold bg-gold text-ink"
                  : "border-gold/25 text-cream hover:border-gold/60"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
        <Input
          type="number"
          min={0}
          step={1}
          value={Number.isFinite(stake) ? stake : 0}
          onChange={(e) => setStake(Number(e.target.value))}
          aria-label="Custom stake"
        />
      </div>

      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between text-muted">
          <dt>Odds</dt>
          <dd className="text-cream tabular-nums">{american !== null ? formatAmerican(american) : "Unavailable"}</dd>
        </div>
        <div className="flex justify-between text-muted">
          <dt>To win</dt>
          <dd className="text-gold tabular-nums">{win !== null ? formatMoney(win) : "Unavailable"}</dd>
        </div>
        <div className="flex justify-between text-muted">
          <dt>Payout</dt>
          <dd className="text-cream tabular-nums">{payout !== null ? formatMoney(payout) : "Unavailable"}</dd>
        </div>
        <div className="flex justify-between text-muted">
          <dt>On the rail</dt>
          <dd className="text-cream tabular-nums">{formatMoney(bankroll)}</dd>
        </div>
      </dl>

      {notice ? (
        <p className="mt-3 text-sm text-loss" role="status">
          {notice}{" "}
          <button type="button" className="underline" onClick={clearNotice}>
            Dismiss
          </button>
        </p>
      ) : null}

      <Button className="mt-5 w-full" size="lg" onClick={placeBet} disabled={slip.length === 0}>
        Place sim bet
      </Button>
      <p className="mt-3 text-[11px] leading-relaxed text-muted">
        Simulated chips only. No real money. Juice is not on this snapshot, so tickets stay
        unpriced.
      </p>
    </aside>
  );
}
