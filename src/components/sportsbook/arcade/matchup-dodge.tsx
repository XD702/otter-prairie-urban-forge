/**
 * Matchup Dodge — random Week 1 MATCHUP from league-data; pick a/b winner.
 * Solo: optional personal stake vs house (spend on lock; pending until scores).
 * H2H: E$L coin$ challenges ledger (propose/accept/settle) — same as E$L tab.
 * Never invent fantasy scores — pending OK. Simulation only.
 */
import { useMemo, useState } from "react";
import { useBook } from "@/lib/betting/store";
import { canStake, creditWin, spendStake } from "@/lib/arcade/bankroll";
import { appendArcadeResult } from "@/lib/arcade/history";
import {
  ARCADE_SIM_DISCLAIMER,
  arcadeUid,
  parseStake,
} from "@/lib/arcade/types";
import { getWeek1Matchups, MATCHUPS, TEAMS } from "@/lib/fantasy";
import { ArcadeStakeBar } from "./stake-bar";
import {
  ARCADE_HOWTO_COPY,
  ArcadeHowTo,
  ArcadeHowToExpandable,
  useArcadeHowToGate,
} from "./arcade-how-to";

import { ArcadeH2HPanel } from "./h2h-panel";

type Side = "a" | "b";

function randomMatchup() {
  const list = getWeek1Matchups();
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)]!;
}

export function MatchupDodgeGame({ onClose }: { onClose: () => void }) {
  const { ready: howtoReady, markReady } = useArcadeHowToGate("matchup-dodge");
  const HOW = ARCADE_HOWTO_COPY["matchup-dodge"];
  const bankroll = useBook((s) => s.bankroll);
  const [mode, setMode] = useState<"solo" | "h2h">("solo");
  const [matchup, setMatchup] = useState(() => randomMatchup());
  const [pick, setPick] = useState<Side | null>(null);
  const [stakeStr, setStakeStr] = useState("0");
  const [notice, setNotice] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const pickTeam = useMemo(() => {
    if (!matchup || !pick) return null;
    return pick === "a" ? matchup.a : matchup.b;
  }, [matchup, pick]);

  function reshuffle() {
    setMatchup(randomMatchup());
    setPick(null);
    setLocked(false);
    setNotice(null);
  }

  function lockSolo() {
    setNotice(null);
    if (!matchup || !pick || !pickTeam) {
      setNotice("Pick a side first.");
      return;
    }
    const stake = parseStake(stakeStr);
    if (stake === null) {
      setNotice("Enter a valid stake (0 allowed).");
      return;
    }
    if (!canStake(stake, useBook.getState)) {
      setNotice("Bankroll too low for that stake.");
      return;
    }
    if (!spendStake(stake, useBook.getState, useBook.setState)) {
      setNotice("Could not lock stake.");
      return;
    }
    // Fantasy matchup scores usually absent — stay pending (no invent).
    appendArcadeResult({
      id: arcadeUid("dodge"),
      gameId: "matchup-dodge",
      playedAt: new Date().toISOString(),
      stake,
      payout: 0,
      outcome: "pending",
      detail: `${matchup.a.teamName} vs ${matchup.b.teamName} · pick ${pickTeam.teamName}`,
      meta: {
        matchupId: matchup.id,
        pickTeamId: pickTeam.id,
        mode: "solo",
      },
    });
    setLocked(true);
    setNotice(
      "Locked — pending until real fantasy matchup scores exist (or settle manually). Stake escrowed.",
    );
  }

  if (!matchup || MATCHUPS.length === 0 || TEAMS.length === 0) {
    return (
      <section className="space-y-4">
        <Hdr title="Matchup Dodge" onClose={onClose} />
        <p className="text-sm text-muted">
          No Week 1 MATCHUPS in league-data. Nothing invented.
        </p>
      </section>
    );
  }

  const termsExtra = pickTeam
    ? `${matchup.id} · ${matchup.a.teamName} vs ${matchup.b.teamName} · pick:${pickTeam.id} (${pickTeam.teamName})`
    : `${matchup.id} · pick pending`;

  if (!howtoReady) {
    return (
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Arcade</p>
            <h3 className="font-display text-2xl font-semibold text-cream">Matchup Dodge</h3>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream">Back</button>
        </div>
        <ArcadeHowTo {...HOW} gameId="matchup-dodge" onPlay={markReady} />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <Hdr title="Matchup Dodge" onClose={onClose} />
      <ArcadeHowToExpandable {...HOW} gameId="matchup-dodge" />
      <p className="text-sm text-muted">
        Random Week 1 fantasy matchup. Solo stake vs house stays pending without real
        scores. H2H uses the E$L challenges ledger (pot 2× on accept).{" "}
        {ARCADE_SIM_DISCLAIMER}
      </p>

      <div className="flex flex-wrap gap-2">
        <ModeBtn active={mode === "solo"} label="Solo vs house" onClick={() => setMode("solo")} />
        <ModeBtn active={mode === "h2h"} label="H2H E$L" onClick={() => setMode("h2h")} />
        <button
          type="button"
          onClick={reshuffle}
          className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream"
        >
          New matchup
        </button>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-gold/25 bg-ink/40 p-4">
        <p className="text-[10px] uppercase tracking-[0.22em] text-gold">
          Week {matchup.week} · {matchup.id}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <SideCard
            active={pick === "a"}
            name={matchup.a.teamName}
            manager={matchup.a.manager}
            onClick={() => !locked && setPick("a")}
          />
          <SideCard
            active={pick === "b"}
            name={matchup.b.teamName}
            manager={matchup.b.manager}
            onClick={() => !locked && setPick("b")}
          />
        </div>
      </div>

      {mode === "solo" ? (
        <>
          <ArcadeStakeBar
            value={stakeStr}
            onChange={setStakeStr}
            bankroll={bankroll}
            disabled={locked}
            error={notice}
          />
          <button
            type="button"
            disabled={locked || !pick}
            onClick={lockSolo}
            className="inline-flex min-h-11 items-center rounded-full border border-gold bg-gold px-5 text-sm font-medium text-ink disabled:opacity-50"
          >
            Lock solo pick
          </button>
        </>
      ) : (
        <>
          {!pick ? (
            <p className="text-sm text-amber-300">Pick a side before proposing H2H.</p>
          ) : null}
          <ArcadeH2HPanel
            gameId="matchup-dodge"
            termsExtra={termsExtra}
            defaultStake="5"
            stakeHint="H2H stake must be > 0. Both chat members put up stake on accept."
          />
          {notice ? <p className="text-sm text-cream">{notice}</p> : null}
        </>
      )}
    </section>
  );
}

function SideCard({
  active,
  name,
  manager,
  onClick,
}: {
  active: boolean;
  name: string;
  manager: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-16 rounded-[var(--radius-md)] border px-3 py-3 text-left ${
        active ? "border-gold bg-gold/20 text-cream" : "border-gold/20 text-cream hover:border-gold/50"
      }`}
    >
      <p className="font-display text-lg">{name}</p>
      <p className="text-[11px] text-muted">{manager ?? "manager —"}</p>
    </button>
  );
}

function ModeBtn({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-full border px-4 text-sm ${
        active ? "border-gold bg-gold text-ink" : "border-gold/30 text-cream"
      }`}
    >
      {label}
    </button>
  );
}

function Hdr({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Arcade</p>
        <h3 className="font-display text-2xl font-semibold text-cream">{title}</h3>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream hover:border-gold"
      >
        Back
      </button>
    </div>
  );
}
