/**
 * Shared stake input for solo Arcade games.
 * Default 0. Rejects when bankroll < stake. Simulation only.
 */
import { ARCADE_CURRENCY, ARCADE_SIM_DISCLAIMER, parseStake } from "@/lib/arcade/types";

type Props = {
  value: string;
  onChange: (v: string) => void;
  bankroll: number;
  disabled?: boolean;
  error?: string | null;
};

export function ArcadeStakeBar({ value, onChange, bankroll, disabled, error }: Props) {
  const parsed = parseStake(value);
  const tooHigh = parsed !== null && parsed > bankroll;

  return (
    <div className="rounded-[var(--radius-lg)] border border-gold/25 bg-ink/40 p-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[8rem] flex-1">
          <span className="mb-1 block text-[10px] uppercase tracking-[0.22em] text-gold">
            Stake ({ARCADE_CURRENCY})
          </span>
          <input
            type="number"
            min={0}
            step={1}
            inputMode="decimal"
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-11 w-full rounded-[var(--radius-md)] border border-gold/30 bg-felt-deep/80 px-3 text-cream tabular-nums outline-none focus:border-gold"
          />
        </label>
        <div className="text-sm text-muted">
          Bankroll{" "}
          <span className="tabular-nums text-cream">
            {bankroll} {ARCADE_CURRENCY}
          </span>
        </div>
      </div>
      {tooHigh ? (
        <p className="mt-2 text-sm text-amber-300">
          Stake is larger than the simulated bankroll.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-amber-300">{error}</p> : null}
      <p className="mt-2 text-[10px] text-muted">{ARCADE_SIM_DISCLAIMER}</p>
    </div>
  );
}
