/**
 * Tic-Tac-Toe — vs CPU or local 1v1. Optional E$L H2H.
 * Simulation only — not real money.
 */
import { useMemo, useState } from "react";
import { useBook } from "@/lib/betting/store";
import { canStake, creditWin, spendStake } from "@/lib/arcade/bankroll";
import { appendArcadeResult } from "@/lib/arcade/history";
import { ARCADE_SIM_DISCLAIMER, arcadeUid, parseStake } from "@/lib/arcade/types";
import { ArcadeStakeBar } from "./stake-bar";
import {
  ARCADE_HOWTO_COPY,
  ArcadeHowTo,
  ArcadeHowToExpandable,
  useArcadeHowToGate,
} from "./arcade-how-to";

import { ArcadeH2HPanel } from "./h2h-panel";

type Cell = "X" | "O" | null;
type Mode = "cpu" | "local" | "h2h";

const WINS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function winner(b: Cell[]): Cell | "draw" | null {
  for (const [a, c, d] of WINS) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  if (b.every(Boolean)) return "draw";
  return null;
}

function cpuMove(b: Cell[]): number {
  const empty = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  // win / block
  for (const mark of ["O", "X"] as const) {
    for (const i of empty) {
      const t = [...b];
      t[i] = mark;
      if (winner(t) === mark) return i;
    }
  }
  if (empty.includes(4)) return 4;
  return empty[Math.floor(Math.random() * empty.length)] ?? 0;
}

export function TicTacToeGame({ onClose }: { onClose: () => void }) {
  const { ready: howtoReady, markReady } = useArcadeHowToGate("tic-tac-toe");
  const HOW = ARCADE_HOWTO_COPY["tic-tac-toe"];
  const bankroll = useBook((s) => s.bankroll);
  const [mode, setMode] = useState<Mode>("cpu");
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [stakeStr, setStakeStr] = useState("0");
  const [staked, setStaked] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const result = useMemo(() => winner(board), [board]);

  function reset() {
    setBoard(Array(9).fill(null));
    setTurn("X");
    setStaked(false);
    setNotice(null);
  }

  function lockStake() {
    if (mode === "h2h") return;
    const stake = parseStake(stakeStr);
    if (stake === null) {
      setNotice("Invalid stake.");
      return;
    }
    if (!canStake(stake, useBook.getState)) {
      setNotice("Bankroll too low.");
      return;
    }
    if (!spendStake(stake, useBook.getState, useBook.setState)) {
      setNotice("Could not lock stake.");
      return;
    }
    setStaked(true);
    setNotice(null);
  }

  function settle(outcome: "won" | "lost" | "push" | "pending", detail: string) {
    const stake = parseStake(stakeStr) ?? 0;
    let payout = 0;
    if (mode !== "h2h" && staked) {
      if (outcome === "won" || outcome === "push") {
        creditWin(stake, useBook.getState, useBook.setState);
        payout = stake;
      }
    }
    appendArcadeResult({
      id: arcadeUid("ttt"),
      gameId: "tic-tac-toe",
      playedAt: new Date().toISOString(),
      stake: mode === "h2h" ? 0 : stake,
      payout,
      outcome: mode === "h2h" ? "pending" : outcome,
      detail,
      meta: { mode },
    });
  }

  function play(i: number) {
    if (result || board[i]) return;
    if (mode !== "h2h" && !staked && (parseStake(stakeStr) ?? 0) > 0) {
      setNotice("Lock stake first (or set stake 0).");
      return;
    }
    if (mode !== "h2h" && !staked) {
      // stake 0 auto-lock
      setStaked(true);
    }
    const next = [...board];
    next[i] = turn;
    const w = winner(next);
    setBoard(next);
    if (w) {
      if (w === "draw") settle("push", "Tic-tac-toe draw");
      else if (w === "X") settle(mode === "cpu" ? "won" : "pending", `X wins (${mode})`);
      else settle(mode === "cpu" ? "lost" : "pending", `O wins (${mode})`);
      return;
    }
    if (mode === "cpu") {
      const ci = cpuMove(next);
      next[ci] = "O";
      setBoard([...next]);
      const w2 = winner(next);
      if (w2 === "O") settle("lost", "CPU wins");
      else if (w2 === "draw") settle("push", "Draw vs CPU");
      else setTurn("X");
      return;
    }
    setTurn(turn === "X" ? "O" : "X");
  }

  if (!howtoReady) {
    return (
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Arcade</p>
            <h3 className="font-display text-2xl font-semibold text-cream">Tic-Tac-Toe</h3>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream">Back</button>
        </div>
        <ArcadeHowTo {...HOW} gameId="tic-tac-toe" onPlay={markReady} />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <Hdr title="Tic-Tac-Toe" onClose={onClose} />
      <ArcadeHowToExpandable {...HOW} gameId="tic-tac-toe" />
      <p className="text-sm text-muted">
        Vs CPU (you = X), local 2P, or H2H E$L ledger. {ARCADE_SIM_DISCLAIMER}
      </p>
      <div className="flex flex-wrap gap-2">
        {(["cpu", "local", "h2h"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); reset(); }}
            className={`min-h-11 rounded-full border px-4 text-sm ${
              mode === m ? "border-gold bg-gold text-ink" : "border-gold/30 text-cream"
            }`}
          >
            {m === "cpu" ? "Vs CPU" : m === "local" ? "Local 2P" : "H2H E$L"}
          </button>
        ))}
        <button type="button" onClick={reset} className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream">
          Reset
        </button>
      </div>

      {mode !== "h2h" ? (
        <>
          <ArcadeStakeBar value={stakeStr} onChange={setStakeStr} bankroll={bankroll} disabled={staked} error={notice} />
          {!staked ? (
            <button type="button" onClick={lockStake} className="min-h-11 rounded-full border border-gold bg-gold px-4 text-sm text-ink">
              Lock stake & play
            </button>
          ) : null}
        </>
      ) : (
        <ArcadeH2HPanel gameId="tic-tac-toe" termsExtra="best of board · manual settle" defaultStake="5" />
      )}

      <div className="mx-auto grid w-56 grid-cols-3 gap-2">
        {board.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => play(i)}
            className="flex size-16 items-center justify-center rounded-[var(--radius-md)] border border-gold/40 bg-ink/50 font-display text-2xl text-gold"
          >
            {c ?? ""}
          </button>
        ))}
      </div>
      <p className="text-sm text-cream">
        {result === "draw" ? "Draw" : result ? `${result} wins` : `Turn: ${turn}`}
      </p>
    </section>
  );
}

function Hdr({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Arcade</p>
        <h3 className="font-display text-2xl font-semibold text-cream">{title}</h3>
      </div>
      <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream">
        Back
      </button>
    </div>
  );
}
