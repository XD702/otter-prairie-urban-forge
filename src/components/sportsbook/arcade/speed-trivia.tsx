/**
 * Speed Trivia — 60s timer, static pack from league-data / NFL rules.
 * Solo stake vs house; grade immediately when timer ends or pack exhausted.
 * Simulation only — not real money.
 */
import { useEffect, useRef, useState } from "react";
import { useBook } from "@/lib/betting/store";
import { canStake, creditWin, spendStake } from "@/lib/arcade/bankroll";
import { appendArcadeResult } from "@/lib/arcade/history";
import { shuffleTrivia, type TriviaQuestion } from "@/lib/arcade/trivia-pack";
import {
  ARCADE_SIM_DISCLAIMER,
  arcadeUid,
  parseStake,
} from "@/lib/arcade/types";
import { ArcadeStakeBar } from "./stake-bar";

const SECONDS = 60;

export function SpeedTriviaGame({ onClose }: { onClose: () => void }) {
  const bankroll = useBook((s) => s.bankroll);
  const [stakeStr, setStakeStr] = useState("0");
  const [deck, setDeck] = useState<TriviaQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [asked, setAsked] = useState(0);
  const [left, setLeft] = useState(SECONDS);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const stakeRef = useRef(0);
  const settledRef = useRef(false);

  useEffect(() => {
    if (!running || done) return;
    if (left <= 0) {
      finish(correct, asked);
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, left, done, correct, asked]);

  function start() {
    setNotice(null);
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
    stakeRef.current = stake;
    settledRef.current = false;
    setDeck(shuffleTrivia());
    setIdx(0);
    setCorrect(0);
    setAsked(0);
    setLeft(SECONDS);
    setRunning(true);
    setDone(false);
    setFlash(null);
  }

  function answer(choice: number) {
    if (!running || done || !deck[idx]) return;
    const q = deck[idx];
    const ok = choice === q.answer;
    const nextCorrect = ok ? correct + 1 : correct;
    const nextAsked = asked + 1;
    setCorrect(nextCorrect);
    setAsked(nextAsked);
    setFlash(ok ? "Correct" : `Nope — ${q.choices[q.answer]}`);
    if (idx + 1 >= deck.length) {
      finish(nextCorrect, nextAsked);
      return;
    }
    setIdx(idx + 1);
  }

  function finish(finalCorrect: number, finalAsked: number) {
    if (settledRef.current) return;
    settledRef.current = true;
    setRunning(false);
    setDone(true);
    const stake = stakeRef.current;
    const ratio = finalAsked === 0 ? 0 : finalCorrect / finalAsked;
    // Win if ≥60% correct and at least 3 answered; else loss (push if 0 asked)
    let outcome: "won" | "lost" | "push" = "lost";
    let payout = 0;
    if (finalAsked === 0) {
      outcome = "push";
      creditWin(stake, useBook.getState, useBook.setState);
      payout = stake;
    } else if (finalAsked >= 3 && ratio >= 0.6) {
      outcome = "won";
      creditWin(stake, useBook.getState, useBook.setState);
      payout = stake;
    }
    appendArcadeResult({
      id: arcadeUid("trivia"),
      gameId: "speed-trivia",
      playedAt: new Date().toISOString(),
      stake,
      payout,
      outcome,
      detail: `Trivia ${finalCorrect}/${finalAsked} in ${SECONDS - Math.max(left, 0)}s · ${outcome}`,
      meta: { correct: finalCorrect, asked: finalAsked },
    });
  }

  const q = deck[idx];

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Arcade</p>
          <h3 className="font-display text-2xl font-semibold text-cream">Speed Trivia</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream hover:border-gold"
        >
          Back
        </button>
      </div>
      <p className="text-sm text-muted">
        60 seconds. Static Eastside / NFL pack only — no invented injuries. Win with ≥60%
        correct (≥3 answered). Even money. {ARCADE_SIM_DISCLAIMER}
      </p>

      {!running && !done ? (
        <>
          <ArcadeStakeBar value={stakeStr} onChange={setStakeStr} bankroll={bankroll} error={notice} />
          <button
            type="button"
            onClick={start}
            className="inline-flex min-h-11 items-center rounded-full border border-gold bg-gold px-5 text-sm font-medium text-ink"
          >
            Start 60s
          </button>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-gold/40 px-3 py-1 tabular-nums text-gold">
              {left}s
            </span>
            <span className="text-muted">
              Score{" "}
              <span className="tabular-nums text-cream">
                {correct}/{asked}
              </span>
            </span>
          </div>
          {q && !done ? (
            <div className="rounded-[var(--radius-lg)] border border-gold/25 bg-ink/40 p-4">
              <p className="text-cream">{q.prompt}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.choices.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => answer(i)}
                    className="min-h-11 rounded-[var(--radius-md)] border border-gold/30 px-3 text-left text-sm text-cream hover:border-gold"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {flash ? <p className="text-sm text-gold">{flash}</p> : null}
          {done ? (
            <div className="rounded-[var(--radius-md)] border border-gold/20 bg-ink/30 p-3 text-sm text-cream">
              Time&apos;s up / pack done — {correct}/{asked}. Check bankroll for settle.
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
