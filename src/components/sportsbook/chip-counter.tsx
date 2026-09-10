import { ChipStack } from "@/components/sportsbook/chip-stack";

export function ChipCounter({ bankroll }: { bankroll: number }) {
  return (
    <div className="surface-felt flex items-center gap-3 rounded-[var(--radius-lg)] border border-ink px-3 py-2 shadow-[inset_0_0_0_1px_rgba(212,175,87,0.35)] sm:px-4">
      <ChipStack amount={bankroll} />
      <div className="min-w-0 rounded-[var(--radius-pill)] border border-ink bg-gold px-3 py-1.5 shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_2px_0_rgba(10,12,11,0.55)]">
        <p className="text-[10px] uppercase tracking-[0.22em] text-ink/80">E$L coin$</p>
        <p className="font-display text-xl leading-none tracking-tight text-cream tabular-nums sm:text-2xl">
          {bankroll}
        </p>
      </div>
      <p className="hidden text-[10px] text-cream/70 sm:block">Simulation only</p>
    </div>
  );
}