/**
 * Higher / Lower — 3 rounds.
 * Number source: abs(spread) from odds board OR projectedPts from scrape merge.
 * Skip card if value missing. Solo stake vs house; grade immediately.
 * Simulation only — not real money. Never invent numbers.
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
import { peekOddsBoard, type OddsBoard } from "@/lib/odds";
import { loadRoster, type FantasyRoster } from "@/lib/fantasy";
import { ArcadeStakeBar } from "./stake-bar";
import {
  ARCADE_HOWTO_COPY,
  ArcadeHowTo,
  ArcadeHowToExpandable,
  useArcadeHowToGate,
} from "./arcade-how-to";


type Card = {
  id: string;
  label: string;
  value: number;
  source: "spread" | "projectedPts";
};

function buildCards(odds: OddsBoard, roster: FantasyRoster): Card[] {
  const out: Card[] = [];
  if (odds.status === "ready") {
    for (const g of odds.games) {
      const line = g.spread.homeLine ?? g.spread.awayLine;
      if (line == null || !Number.isFinite(line)) continue;
      out.push({
        id: `spread-${g.id}`,
        label: `${g.away} @ ${g.home} · |spread|`,
        value: Math.abs(line),
        source: "spread",
      });
    }
  }
  const slots = [...(roster.slots ?? []), ...(roster.bench ?? [])];
  for (const slot of slots) {
    const p = slot.player;
    const pts = p?.projectedPts;
    if (!p || pts == null || !Number.isFinite(pts)) continue;
    out.push({
      id: `proj-${p.id}`,
      label: `${p.name} · projectedPts`,
      value: pts,
      source: "projectedPts",
    });
  }
  return out;
}

function pickRoundPair(pool: Card[], avoid: Set<string>): [Card, Card] | null {
  const avail = pool.filter((c) => !avoid.has(c.id));
  if (avail.length < 2) return null;
  const i = Math.floor(Math.random() * avail.length);
  let j = Math.floor(Math.random() * avail.length);
  let guard = 0;
  while ((j === i || avail[j].id === avail[i].id) && guard++ < 40) {
    j = Math.floor(Math.random() * avail.length);
  }
  if (j === i) return null;
  return [avail[i], avail[j]];
}

const ROUNDS = 3;

export function HigherLowerGame({
  odds: oddsProp,
  roster: rosterProp,
  onClose,
}: {
  odds?: OddsBoard;
  roster?: FantasyRoster;
  onClose: () => void;
}) {
  const { ready: howtoReady, markReady } = useArcadeHowToGate("higher-lower");
  const HOW = ARCADE_HOWTO_COPY["higher-lower"];
  const odds = oddsProp ?? peekOddsBoard();
  const roster = rosterProp ?? loadRoster();
  const bankroll = useBook((s) => s.bankroll);
  const pool = useMemo(() => buildCards(odds, roster), [odds, roster]);

  const [stakeStr, setStakeStr] = useState("0");
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [used, setUsed] = useState<Set<string>>(() => new Set());
  const [pair, setPair] = useState<[Card, Card] | null>(null);
  const [wins, setWins] = useState(0);
  const [done, setDone] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastMsg, setLastMsg] = useState<string | null>(null);

  function dealNext(nextUsed: Set<string>, nextRound: number) {
    const p = pickRoundPair(pool, nextUsed);
    if (!p) {
      setPair(null);
      setDone(true);
      setNotice("Not enough posted spread / projectedPts cards — skipping.");
      return;
    }
    setPair(p);
    setRound(nextRound);
  }

  function start() {
    setNotice(null);
    const stake = parseStake(stakeStr);
    if (stake === null) {
      setNotice("Enter a valid stake (0 allowed).");
      return;
    }
    if (pool.length < 2) {
      setNotice(
        "Need at least two cards with spread abs or projectedPts. Missing values are skipped — nothing invented.",
      );
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
    setStarted(true);
    setWins(0);
    setDone(false);
    setUsed(new Set());
    dealNext(new Set(), 1);
  }

  function choose(guess: "higher" | "lower") {
    if (!pair || done) return;
    const [a, b] = pair;
    const stake = parseStake(stakeStr) ?? 0;
    let correct = false;
    if (b.value === a.value) {
      // push round — neither higher nor lower
      setLastMsg(`Push — both ${a.value}. Round skipped.`);
    } else if (guess === "higher") {
      correct = b.value > a.value;
      setLastMsg(
        correct
          ? `Yes — ${b.value} > ${a.value}`
          : `No — ${b.value} is not higher than ${a.value}`,
      );
    } else {
      correct = b.value < a.value;
      setLastMsg(
        correct
          ? `Yes — ${b.value} < ${a.value}`
          : `No — ${b.value} is not lower than ${a.value}`,
      );
    }
    const nextWins = correct ? wins + 1 : wins;
    if (correct) setWins(nextWins);

    const nextUsed = new Set(used);
    nextUsed.add(a.id);
    nextUsed.add(b.id);
    setUsed(nextUsed);

    if (round >= ROUNDS) {
      finish(nextWins, stake);
      return;
    }
    dealNext(nextUsed, round + 1);
  }

  function finish(finalWins: number, stake: number) {
    setDone(true);
    const won = finalWins >= 2; // best of 3 style: need 2+ correct
    let payout = 0;
    let outcome: "won" | "lost" | "push" = "lost";
    if (finalWins === 0 && ROUNDS > 0) {
      outcome = "lost";
    } else if (won) {
      outcome = "won";
      creditWin(stake, useBook.getState, useBook.setState);
      payout = stake;
    } else if (finalWins === 1 && ROUNDS === 3) {
      // one correct of three — loss (stake kept)
      outcome = "lost";
    }
    appendArcadeResult({
      id: arcadeUid("hl"),
      gameId: "higher-lower",
      playedAt: new Date().toISOString(),
      stake,
      payout,
      outcome,
      detail: `Higher/Lower ${finalWins}/${ROUNDS} correct · ${outcome}`,
      meta: { wins: finalWins, rounds: ROUNDS },
    });
    setLastMsg(
      (m) =>
        `${m ?? ""} · Session ${outcome.toUpperCase()} (${finalWins}/${ROUNDS}).`,
    );
  }

  if (!howtoReady) {
    return (
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Arcade</p>
            <h3 className="font-display text-2xl font-semibold text-cream">Higher / Lower</h3>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream">Back</button>
        </div>
        <ArcadeHowTo {...HOW} gameId="higher-lower" onPlay={markReady} />
      </section>
    );
  }

  if (pool.length < 2 && !started) {
    return (
      <section className="space-y-4">
        <Header title="Higher / Lower" onClose={onClose} />
        <ArcadeHowToExpandable {...HOW} gameId="higher-lower" />
        <div className="rounded-[var(--radius-lg)] border border-gold/20 bg-ink/40 p-5">
          <p className="font-display text-lg text-cream">Skip — no usable cards</p>
          <p className="mt-2 text-sm text-muted">
            Need posted |spread| on the odds board or projectedPts from the scrape
            merge. Missing values are skipped; nothing is invented.
          </p>
        </div>
        <p className="text-[10px] text-muted">{ARCADE_SIM_DISCLAIMER}</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <Header title="Higher / Lower" onClose={onClose} />
      <ArcadeHowToExpandable {...HOW} gameId="higher-lower" />
      <p className="text-sm text-muted">
        3 rounds. Compare card B to card A (higher or lower). Values from spread abs
        or projectedPts only. Win session with 2+ correct (even money).{" "}
        {ARCADE_SIM_DISCLAIMER}
      </p>
      {!started ? (
        <>
          <ArcadeStakeBar value={stakeStr} onChange={setStakeStr} bankroll={bankroll} error={notice} />
          <p className="text-xs text-muted">{pool.length} cards available</p>
          <button
            type="button"
            onClick={start}
            className="inline-flex min-h-11 items-center rounded-full border border-gold bg-gold px-5 text-sm font-medium text-ink"
          >
            Start 3 rounds
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-gold">
            Round {Math.min(round, ROUNDS)} / {ROUNDS} · Correct: {wins}
          </p>
          {pair ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <CardView title="A (base)" card={pair[0]} reveal />
              <CardView title="B (guess)" card={pair[1]} reveal={done} hideValue={!done} />
            </div>
          ) : (
            <p className="text-sm text-muted">No pair — skipped.</p>
          )}
          {!done && pair ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => choose("higher")}
                className="min-h-11 rounded-full border border-gold bg-gold px-5 text-sm text-ink"
              >
                B Higher
              </button>
              <button
                type="button"
                onClick={() => choose("lower")}
                className="min-h-11 rounded-full border border-gold/40 px-5 text-sm text-cream"
              >
                B Lower
              </button>
            </div>
          ) : null}
          {lastMsg ? <p className="text-sm text-cream">{lastMsg}</p> : null}
          {done ? (
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-full border border-gold/40 px-4 text-sm text-cream"
            >
              Back to hub
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}

function CardView({
  title,
  card,
  reveal,
  hideValue,
}: {
  title: string;
  card: Card;
  reveal?: boolean;
  hideValue?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-gold/25 bg-ink/40 p-4">
      <p className="text-[10px] uppercase tracking-[0.22em] text-gold">{title}</p>
      <p className="mt-1 text-cream">{card.label}</p>
      <p className="mt-2 font-display text-3xl tabular-nums text-gold">
        {hideValue ? "?" : reveal || !hideValue ? card.value : "?"}
      </p>
      <p className="text-[10px] text-muted">{card.source}</p>
    </div>
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
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
