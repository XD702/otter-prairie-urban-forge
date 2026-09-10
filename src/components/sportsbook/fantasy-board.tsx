import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { UnavailablePlaque } from "@/components/sportsbook/unavailable-plaque";
import {
  DEFAULT_TEAM_ID,
  getWeek1Matchups,
  loadRosterForTeam,
  MATCHUPS,
  TEAMS,
  type FantasyRoster,
  type LineupSlot,
} from "@/lib/fantasy";
import {
  applyPulledAt,
  fetchScrape,
  findScrapeTeam,
  formatScrapeAge,
  mergeMatchupsWithScrape,
  mergeRosterWithScrape,
} from "@/lib/fantasy/scrape-ingest";
import type { YahooLeagueDump } from "@/lib/fantasy/scrape-types";
import { cn } from "@/lib/utils";

function formatPts(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function SlotRow({
  slot,
  compact,
  emptyLabel,
}: {
  slot: LineupSlot;
  compact: boolean;
  emptyLabel: string;
}) {
  const player = slot.player;
  const proj = player?.projectedPts ?? null;
  const actual = player?.actualPts ?? null;
  const showPtsLine = compact
    ? actual !== null
    : true; // full view always shows proj/actual row (— when missing)

  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius-sm)] border line-gold px-3 text-cream odd:bg-ink/35 even:bg-cream/[0.04]",
        compact ? "min-h-11 py-1.5" : "min-h-12 py-2",
      )}
    >
      <span className="w-11 shrink-0 text-[11px] font-medium uppercase tracking-[0.16em] text-gold">
        {slot.label}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-cream", compact ? "truncate text-sm" : "text-base")}>
          {player?.name ?? emptyLabel}
        </p>
        {player ? (
          <p className="text-[11px] text-muted">
            {player.team ?? "—"}
            {player.position !== slot.position && slot.position === "FLEX"
              ? ` · ${player.position}`
              : ""}
            {slot.note ? ` · ${slot.note}` : ""}
          </p>
        ) : slot.note ? (
          <p className="text-[11px] text-muted">{slot.note}</p>
        ) : null}
        {player && showPtsLine ? (
          <p className="text-[10px] tabular-nums text-muted/90">
            {compact ? (
              <>Act {formatPts(actual)}</>
            ) : (
              <>
                Proj {formatPts(proj)} · Act {formatPts(actual)}
              </>
            )}
          </p>
        ) : null}
      </div>
      {player?.status ? (
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]",
            player.status.startsWith("Out") || player.status === "IR"
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
  emptyLabel,
}: {
  title: string;
  slots: LineupSlot[];
  compact: boolean;
  emptyLabel: string;
}) {
  if (slots.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.22em] text-gold/80">{title}</p>
      <ul className="space-y-1.5">
        {slots.map((item) => (
          <SlotRow key={item.id} slot={item} compact={compact} emptyLabel={emptyLabel} />
        ))}
      </ul>
    </div>
  );
}

type ScrapeUiStatus = "ok" | "empty" | "error" | "loading";

export function FantasyBoard({
  roster: rosterProp,
  compact = false,
}: {
  roster?: FantasyRoster;
  compact?: boolean;
}) {
  const [teamId, setTeamId] = useState(DEFAULT_TEAM_ID);
  const [scrape, setScrape] = useState<YahooLeagueDump | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOkAt, setLastOkAt] = useState<string | null>(null);

  const refreshScrape = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    const result = await fetchScrape(signal);
    if (signal?.aborted) return;
    setLoading(false);
    if (result.ok) {
      setScrape(result.data);
      setError(null);
      setLastOkAt(result.scrapedAt ?? new Date().toISOString());
    } else {
      setError(result.reason);
      // keep last-good scrape; do not clear
    }
  }, []);

  useEffect(() => {
    if (compact && rosterProp) {
      // Compact left rail: still optionally overlay go-birds scrape without changing picker.
      const ac = new AbortController();
      void refreshScrape(ac.signal);
      return () => ac.abort();
    }
    if (!compact) {
      const ac = new AbortController();
      void refreshScrape(ac.signal);
      return () => ac.abort();
    }
    return undefined;
  }, [compact, rosterProp, refreshScrape]);

  const seedRoster = rosterProp ?? loadRosterForTeam(teamId);
  const scrapeTeamId = rosterProp ? DEFAULT_TEAM_ID : teamId;
  const scrapeTeam = findScrapeTeam(
    scrape,
    scrapeTeamId,
    seedRoster.teamName,
    seedRoster.manager,
  );

  const roster = useMemo(() => {
    const merged = mergeRosterWithScrape(seedRoster, scrapeTeam);
    // Attach team totals from matchup scores when this team appears.
    const totals = mergeMatchupsWithScrape(MATCHUPS, scrape);
    const side = totals
      .flatMap((m) => [m.a, m.b])
      .find((s) => s.teamId === scrapeTeamId);
    return applyPulledAt(
      {
        ...merged,
        projectedTotal: side?.projectedTotal ?? null,
        actualTotal: side?.actualTotal ?? null,
      },
      scrape?.pulledAt ?? null,
    );
  }, [seedRoster, scrapeTeam, scrape, scrapeTeamId]);

  const matchups = useMemo(() => getWeek1Matchups(), []);
  const matchupTotals = useMemo(
    () => mergeMatchupsWithScrape(MATCHUPS, scrape),
    [scrape],
  );
  const totalsById = useMemo(() => {
    const map = new Map<string, { projectedTotal: number | null; actualTotal: number | null }>();
    for (const m of matchupTotals) {
      map.set(m.a.teamId, m.a);
      map.set(m.b.teamId, m.b);
    }
    return map;
  }, [matchupTotals]);

  const ready = roster.status === "ready";
  const emptyLabel = ready ? "Empty" : "Unavailable";
  const showPicker = !rosterProp;

  const scrapeStatus: ScrapeUiStatus = loading
    ? "loading"
    : error && !scrape
      ? "error"
      : scrape && scrape.teams.length === 0
        ? "empty"
        : scrape
          ? "ok"
          : error
            ? "error"
            : "empty";

  const scrapeFooter = `Scrape: ${formatScrapeAge(scrape?.pulledAt ?? lastOkAt)} · ${scrapeStatus}`;

  return (
    <section>
      {compact ? null : (
        <div className="mb-4">
          <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Lineup</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-cream">Roster</h2>
          {roster.ownerLabel ? <p className="mt-1 text-sm text-muted">{roster.ownerLabel}</p> : null}
        </div>
      )}

      {showPicker ? (
        <div className="mb-4 space-y-3">
          <div className="surface-ink rounded-[var(--radius-xl)] p-3">
            <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-gold/80">Week 1 matchups</p>
            <ul className="space-y-1.5">
              {matchups.map((m) => {
                const aTot = totalsById.get(m.a.id);
                const bTot = totalsById.get(m.b.id);
                return (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[var(--radius-sm)] border line-gold bg-ink/40 px-2.5 py-1.5 text-sm text-cream odd:bg-ink/30 even:bg-cream/[0.04]"
                  >
                    <button
                      type="button"
                      className={cn(
                        "text-left hover:text-gold",
                        teamId === m.a.id && "font-semibold text-gold",
                      )}
                      onClick={() => setTeamId(m.a.id)}
                    >
                      {m.a.teamName}
                    </button>
                    <span className="text-[10px] tabular-nums text-muted">
                      {formatPts(aTot?.projectedTotal)}/{formatPts(aTot?.actualTotal)}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-muted">vs</span>
                    <button
                      type="button"
                      className={cn(
                        "text-left hover:text-gold",
                        teamId === m.b.id && "font-semibold text-gold",
                      )}
                      onClick={() => setTeamId(m.b.id)}
                    >
                      {m.b.teamName}
                    </button>
                    <span className="text-[10px] tabular-nums text-muted">
                      {formatPts(bTot?.projectedTotal)}/{formatPts(bTot?.actualTotal)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.22em] text-gold/80">
              Team ({TEAMS.length})
            </span>
            <select
              className="w-full rounded-[var(--radius-sm)] border border-gold/25 bg-ink/40 px-3 py-2 text-sm text-cream"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
            >
              {TEAMS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.teamName}
                  {t.manager ? ` (${t.manager})` : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      <div className="surface-ink rounded-[var(--radius-xl)] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-sm uppercase tracking-[0.14em] text-gold">{roster.league}</p>
            {roster.yahooId ? (
              <p className="text-[11px] text-muted tabular-nums">Yahoo {roster.yahooId}</p>
            ) : null}
            {roster.teamName ? (
              <p className="mt-0.5 truncate text-xs text-cream/80">
                {roster.teamName}
                {roster.manager ? ` · ${roster.manager}` : ""}
              </p>
            ) : null}
            {!compact ? (
              <p className="mt-0.5 text-[11px] tabular-nums text-muted">
                Team Proj {formatPts(roster.projectedTotal)} · Act{" "}
                {formatPts(roster.actualTotal)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge tone={ready ? "final" : "unavailable"}>{ready ? "Posted" : "Unavailable"}</Badge>
            {!compact ? (
              <button
                type="button"
                className="rounded-full border border-gold/30 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-gold hover:bg-gold/10 disabled:opacity-50"
                disabled={loading}
                onClick={() => void refreshScrape()}
              >
                {loading ? "Refreshing…" : "Refresh from scrape"}
              </button>
            ) : null}
          </div>
        </div>
        <div className="space-y-4">
          <SlotList title="Start" slots={roster.slots} compact={compact} emptyLabel={emptyLabel} />
          <SlotList title="Bench" slots={roster.bench} compact={compact} emptyLabel={emptyLabel} />
          <SlotList title="IR" slots={roster.ir} compact={compact} emptyLabel={emptyLabel} />
        </div>
        {ready ? (
          <p className="mt-3 text-xs leading-relaxed text-muted text-pretty">
            Eastside Week 1 dump. Empty slots = not on screenshot (no invented players). Proj/Act
            from Go Birds Yahoo pull only when present. Simulation only.
          </p>
        ) : (
          <p className="mt-3 text-xs leading-relaxed text-muted text-pretty">
            {roster.reason ?? "Fantasy roster was not provided at build time."} No player names
            invented.
          </p>
        )}
        {roster.reason && ready ? (
          <p className="mt-2 text-xs leading-relaxed text-gold/80 text-pretty">{roster.reason}</p>
        ) : null}
        <p className="mt-2 text-[10px] tabular-nums text-muted">{scrapeFooter}</p>
        {error ? (
          <p className="mt-1 text-[10px] text-loss/80">Last fetch: {error} (keeping prior if any)</p>
        ) : null}
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
