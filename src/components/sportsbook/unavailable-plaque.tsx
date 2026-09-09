import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UnavailablePlaqueProps {
  kicker: string;
  title: string;
  detail: string;
  className?: string;
}

export function UnavailablePlaque({
  kicker,
  title,
  detail,
  className,
}: UnavailablePlaqueProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-xl)] border border-gold/30 bg-felt-deep/80 p-6 sm:p-8",
        "shadow-[inset_0_1px_0_rgba(227,197,106,0.18),0_20px_50px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 rounded-[calc(var(--radius-xl)-12px)] border border-gold/15"
      />
      <Badge tone="unavailable">Unavailable</Badge>
      <p className="mt-4 font-display text-xs uppercase tracking-[0.28em] text-gold">{kicker}</p>
      <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-cream text-balance">
        {title}
      </h3>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted text-pretty">{detail}</p>
    </div>
  );
}
