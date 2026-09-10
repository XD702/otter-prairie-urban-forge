import { ChipStack } from "@/components/sportsbook/chip-stack";

export function ChipCounter({ bankroll }: { bankroll: number }) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-gold/25 bg-ink/40 px-3 py-2 sm:px-4">
      <ChipStack amount={bankroll} />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.22em] text-gold">E$L coin$</p>
        <p className="font-display text-xl leading-none tracking-tight text-cream tabular-nums sm:text-2xl">
          {bankroll} E$L coin$
        </p>
        <p className="text-[10px] text-muted">Simulation only — not real money.</p>
      </div>
    </div>
  );
}
