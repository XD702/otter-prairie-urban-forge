"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { TEAMS } from "@/lib/fantasy";
import {
  EMPTY_MATCHUP_RESULTS,
  buildStandingsFromResults,
  standingsArePlaceholders,
  type StandingRow,
} from "@/lib/fantasy/standings";
import {
  PLAYOFF_TEAM_COUNT,
  PLAYOFF_WEEKS,
  buildEmptyBracket,
  roundLabel,
  slotsForWeek,
  type BracketSlot,
} from "@/lib/fantasy/playoffs";
import {
  KEEPER_SLOTS_PER_TEAM,
  listKeepersForTeam,
  loadKeepersFromStorage,
  mergeKeepersWithStorage,
  rosterPlayersForTeam,
  saveKeepersToStorage,
  setKeeperForTeam,
  type KeepersMap,
} from "@/lib/fantasy/keepers";
import { cn } from "@/lib/utils";

type LeagueSubTab = "standings" | "playoffs" | "keepers";

const SUB_TABS: { id: LeagueSubTab; label: string }[] = [
  { id: "standings", label: "Standings" },
  { id: "playoffs", label: "Playoffs" },
  { id: "keepers", label: "Keepers" },
];

function dash(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function seedLabel(seed: number | null): string {
  return seed === null ? "TBD" : `Seed ${seed}`;
}

function teamLabel(teamId: string | null): string {
  if (!teamId) return "TBD";
  const t = TEAMS.find((x) => x.id === teamId);
  return t?.teamName ?? "TBD";
}

function StandingsPanel({ rows }: { rows: StandingRow[] }) {
  const placeholders = standingsArePlaceholders(rows);
  return (
    <div className="space-y-3">
      {placeholders ? (
        <Badge tone="unavailable">Placeholders — no results yet</Badge>
      ) : (
        <Badge tone="final">From completed results</Badge>
      )}
      <div className="overflow-x-auto rounded-[var(--radius-xl)] border border-gold/25 bg-felt-deep">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-gold/20 text-[10px] uppercase tracking-[0.18em] text-gold/80">
              <th className="px-3 py-2.5 font-medium">Rank</th>
              <th className="px-3 py-2.5 font-medium">Team</th>
              <th className="px-3 py-2.5 font-medium">Manager</th>
              <th className="px-3 py-2.5 font-medium tabular-nums">W</th>
              <th className="px-3 py-2.5 font-medium tabular-nums">L</th>
              <th className="px-3 py-2.5 font-medium tabular-nums">T</th>
              <th className="px-3 py-2.5 font-medium tabular-nums">PF</th>
              <th className="px-3 py-2.5 font-medium tabular-nums">PA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.teamId}
                className="border-b border-gold/10 text-cream last:border-0"
              >
                <td className="px-3 py-2 tabular-nums text-muted">{dash(row.rank)}</td>
                <td className="px-3 py-2">{row.teamName}</td>
                <td className="px-3 py-2 text-muted">{row.manager ?? "—"}</td>
                <td className="px-3 py-2 tabular-nums">{dash(row.wins)}</td>
                <td className="px-3 py-2 tabular-nums">{dash(row.losses)}</td>
                <td className="px-3 py-2 tabular-nums">{dash(row.ties)}</td>
                <td className="px-3 py-2 tabular-nums">{dash(row.pf)}</td>
                <td className="px-3 py-2 tabular-nums">{dash(row.pa)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs leading-relaxed text-muted text-pretty">
        W-L-T and PF/PA come only from completed matchup results. Week 1 seed
        matchups are labels only — no invented winners. Simulation only.
      </p>
    </div>
  );
}

function BracketGame({ slot }: { slot: BracketSlot }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-gold/20 bg-ink/30 px-3 py-2">
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-gold/80">
        {slot.round === "qf" && slot.seedA !== null && slot.seedB !== null
          ? `${slot.seedA} vs ${slot.seedB}`
          : roundLabel(slot.round)}
      </p>
      <div className="space-y-1 text-sm text-cream">
        <p className="flex items-center justify-between gap-2">
          <span className="truncate">{teamLabel(slot.teamAId)}</span>
          <span className="shrink-0 text-[10px] tabular-nums text-muted">
            {seedLabel(slot.seedA)}
          </span>
        </p>
        <p className="flex items-center justify-between gap-2">
          <span className="truncate">{teamLabel(slot.teamBId)}</span>
          <span className="shrink-0 text-[10px] tabular-nums text-muted">
            {seedLabel(slot.seedB)}
          </span>
        </p>
      </div>
    </div>
  );
}

function PlayoffsPanel() {
  const bracket = useMemo(() => buildEmptyBracket(), []);
  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-muted text-pretty">
        Structure only until weeks 15–17 / real standings. {PLAYOFF_TEAM_COUNT}
        -team bracket (top 8 of 12). Seeds labeled; teams TBD until results
        exist. No invented winners.
      </p>
      {PLAYOFF_WEEKS.map((week) => {
        const slots = slotsForWeek(bracket, week);
        const round = slots[0]?.round;
        return (
          <div
            key={week}
            className="rounded-[var(--radius-xl)] border border-gold/25 bg-felt-deep p-3"
          >
            <p className="mb-2 font-display text-xs uppercase tracking-[0.22em] text-gold">
              Week {week}
              {round ? ` · ${roundLabel(round)}` : ""}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {slots.map((slot) => (
                <BracketGame key={slot.id} slot={slot} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KeepersPanel() {
  const [stored, setStored] = useState<KeepersMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStored(loadKeepersFromStorage());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: KeepersMap) => {
    setStored(next);
    saveKeepersToStorage(next);
  }, []);

  const entries = useMemo(
    () => mergeKeepersWithStorage(stored),
    [stored],
  );

  const anySet = entries.some((e) => e.playerId);

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-muted text-pretty">
        {KEEPER_SLOTS_PER_TEAM} keeper slot per team. Pick only from that
        team&apos;s seeded roster. Stored in localStorage only (
        <span className="tabular-nums">eastside-keepers-v1</span>). No invented
        players.
      </p>
      {!hydrated ? (
        <p className="text-sm text-muted">Loading keepers…</p>
      ) : !anySet ? (
        <p className="rounded-[var(--radius-sm)] border border-gold/15 bg-ink/25 px-3 py-2 text-sm text-muted">
          No keepers set
        </p>
      ) : null}
      <ul className="space-y-2">
        {TEAMS.map((team) => {
          const keepers = listKeepersForTeam(team.id, entries);
          const current = keepers[0];
          const players = rosterPlayersForTeam(team.id);
          const value = current?.playerId ?? "";
          return (
            <li
              key={team.id}
              className="rounded-[var(--radius-xl)] border border-gold/20 bg-felt-deep p-3"
            >
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-sm text-cream">{team.teamName}</p>
                  <p className="text-[11px] text-muted">
                    {team.manager ?? "—"}
                  </p>
                </div>
                {current?.playerName ? (
                  <Badge tone="final">{current.playerName}</Badge>
                ) : (
                  <span className="text-[11px] text-muted">No keepers set</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="min-w-[12rem] flex-1">
                  <span className="sr-only">Keeper for {team.teamName}</span>
                  <select
                    className="w-full rounded-[var(--radius-sm)] border border-gold/25 bg-ink/40 px-3 py-2 text-sm text-cream"
                    value={value}
                    disabled={players.length === 0}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) {
                        persist(setKeeperForTeam(stored, team.id, null));
                        return;
                      }
                      const player = players.find((p) => p.id === id) ?? null;
                      persist(setKeeperForTeam(stored, team.id, player));
                    }}
                  >
                    <option value="">
                      {players.length === 0
                        ? "No roster players on seed"
                        : "Select keeper…"}
                    </option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.position ? ` (${p.position})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="rounded-full border border-gold/30 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-gold hover:bg-gold/10 disabled:opacity-40"
                  disabled={!current?.playerId}
                  onClick={() => persist(setKeeperForTeam(stored, team.id, null))}
                >
                  Clear
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * League Office — Standings | Playoffs | Keepers.
 * Style matches sportsbook felt/gold/cream. No invented W-L or keepers.
 */
export function LeagueOffice() {
  const [sub, setSub] = useState<LeagueSubTab>("standings");
  // Results feed starts empty — do not invent Week 1 winners.
  const rows = useMemo(
    () => buildStandingsFromResults(EMPTY_MATCHUP_RESULTS),
    [],
  );

  return (
    <section>
      <div className="mb-4">
        <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">
          League office
        </p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-cream">
          League
        </h2>
        <p className="mt-1 text-sm text-muted">
          Eastside Legends · standings, playoffs, keepers
        </p>
      </div>

      <div
        className="mb-4 flex flex-wrap gap-1.5 rounded-[var(--radius-xl)] border border-gold/20 bg-felt-deep p-1.5"
        role="tablist"
        aria-label="League office sections"
      >
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={sub === t.id}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.16em] transition",
              sub === t.id
                ? "bg-gold/20 text-gold"
                : "text-muted hover:text-cream",
            )}
            onClick={() => setSub(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === "standings" ? <StandingsPanel rows={rows} /> : null}
      {sub === "playoffs" ? <PlayoffsPanel /> : null}
      {sub === "keepers" ? <KeepersPanel /> : null}
    </section>
  );
}
