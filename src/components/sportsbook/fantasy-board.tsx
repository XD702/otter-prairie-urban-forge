import { Badge } from "@/components/ui/badge";
import { UnavailablePlaque } from "@/components/sportsbook/unavailable-plaque";
import type { FantasyRoster, LineupSlot } from "@/lib/fantasy";
import { cn } from "@/lib/utils";

function SlotRow({ slot, compact }: { slot: LineupSlot; compact: boolean }) {
  const player = slot.player;
  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius-sm)] border border-gold/15 bg-ink/30 px-3",
        compact ? "min-h-11 py-1.5" : "min-h-12 py-2",
      )}
    >
      <span className="w-11 shrink-0 text-[11px] font-medium uppercase tracking-[0.16em] text-gold">
        {slot.label}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-cream", compact ? "truncate text-sm" : "text-base")}>
          {player?.name ?? "Unavailable"}
        </p>
        {player ? (
          <p className="text-[11px] text-muted">
            {player.team ?? "—"}
            {player.position !== slot.position && slot.position === "FLEX" ? ` · ${player.position}` : ""}
            {slot.note ? ` · ${slot.note}` : ""}
          </p>
        ) : null}
      </div>
      {player?.status ? (
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]",
            player.status.startsWith("Out")
              ? "border-loss/40 text-loss"
              : "border-gold/40 text-gold-bright",
          )}
        >
          {player.status}
        </span>
      ) : null}
    </li>
  );
}

function SlotList({
  title,
  slots,
  compact,
}: {
  title: string;
  slots: LineupSlot[];
  compact: boolean;
}) {
  if (slots.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.22em] text-gold/80">{title}</p>
      <ul className="space-y-1.5">
        {slots.map((item) => (
          <SlotRow key={item.id} slot={item} compact={compact} />
        ))}
      </ul>
    </div>
  );
}

export function FantasyBoard({ roster, compact = false }: { roster: FantasyRoster; compact?: boolean }) {
  const ready = roster.status === "ready";

  return (
    <section>
      {compact ? null : (
        <div className="mb-4">
          <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Lineup</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-cream">Roster</h2>
          {roster.ownerLabel ? <p className="mt-1 text-sm text-muted">{roster.ownerLabel}</p> : null}
        </div>
      )}
      <div className="rounded-[var(--radius-xl)] border border-gold/25 bg-felt-deep p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-sm uppercase tracking-[0.14em] text-gold">{roster.league}</p>
            {roster.yahooId ? (
              <p className="text-[11px] text-muted tabular-nums">Yahoo {roster.yahooId}</p>
            ) : null}
          </div>
          <Badge tone={ready ? "final" : "unavailable"}>{ready ? "Posted" : "Unavailable"}</Badge>
        </div>
        <div className="space-y-4">
          <SlotList title="Start" slots={roster.slots} compact={compact} />
          <SlotList title="Bench" slots={roster.bench} compact={compact} />
        </div>
        {ready ? (
          <p className="mt-3 text-xs leading-relaxed text-muted text-pretty">
            Rob's board only. No opponent column. Simulation only.
          </p>
        ) : (
          <p className="mt-3 text-xs leading-relaxed text-muted text-pretty">
            {roster.reason ?? "Fantasy roster was not provided at build time."} No player names
            invented. No opponent column.
          </p>
        )}
      </div>
      {compact || ready ? null : (
        <div className="mt-4">
          <UnavailablePlaque
            kicker="Fantasy"
            title="Roster unavailable"
            detail="Slots are listed with positions only. Names stay empty until a real roster is inserted."
          />
        </div>
      )}
    </section>
  );
}
