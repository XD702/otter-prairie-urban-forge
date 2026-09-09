import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "gold" | "muted" | "pending" | "final" | "snapshot" | "unavailable";

const tones: Record<Tone, string> = {
  gold: "border-gold/40 text-gold bg-gold/10",
  muted: "border-cream/15 text-muted bg-ink/30",
  pending: "border-gold/25 text-gold-bright bg-ink/40",
  final: "border-win/40 text-win bg-ink/40",
  snapshot: "border-cream/20 text-cream/80 bg-ink/40",
  unavailable: "border-cream/12 text-muted bg-ink/50",
};

export function Badge({
  className,
  tone = "gold",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
