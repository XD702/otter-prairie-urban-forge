import { formatMoney } from "@/lib/utils";

const CHIP_VALUES = [1000, 500, 100, 25, 5, 1] as const;

const CHIP_FACE: Record<(typeof CHIP_VALUES)[number], string> = {
  1000: "bg-gold text-ink",
  500: "bg-[#5c2424] text-cream",
  100: "bg-chip-black text-gold",
  25: "bg-[#1f5a43] text-cream",
  5: "bg-chip-red text-cream",
  1: "bg-cream text-ink",
};

function breakdown(amount: number): { value: number; count: number }[] {
  let remaining = Math.max(0, Math.floor(amount));
  return CHIP_VALUES.map((value) => {
    const count = Math.min(8, Math.floor(remaining / value));
    remaining -= count * value;
    return { value, count };
  }).filter((row) => row.count > 0);
}

export function ChipStack({ amount }: { amount: number }) {
  const stacks = breakdown(amount);
  return (
    <div className="flex items-end gap-2" aria-hidden="true">
      {stacks.length === 0 ? (
        <div className="size-9 rounded-full border border-dashed border-gold/25" />
      ) : (
        stacks.map((stack) => (
          <div key={stack.value} className="relative h-12 w-9">
            {Array.from({ length: stack.count }).map((_, i) => (
              <span
                key={i}
                className={`absolute left-0 right-0 mx-auto size-8 rounded-full border border-black/30 shadow-[0_1px_0_rgba(255,255,255,0.2)_inset] ${CHIP_FACE[stack.value as (typeof CHIP_VALUES)[number]]}`}
                style={{ bottom: i * 4 }}
              />
            ))}
          </div>
        ))
      )}
      <span className="sr-only">Simulated chips totaling {formatMoney(amount)}</span>
    </div>
  );
}
