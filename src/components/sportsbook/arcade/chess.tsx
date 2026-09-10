/**
 * Chess — thin playable local 2P or simple random-legal CPU.
 * Optional E$L H2H challenge. Simulation only — not real money.
 * Not a full engine — legal king/queen/rook/bishop/knight/pawn moves only.
 */
import { useMemo, useState } from "react";
import { useBook } from "@/lib/betting/store";
import { canStake, creditWin, spendStake } from "@/lib/arcade/bankroll";
import { appendArcadeResult } from "@/lib/arcade/history";
import { ARCADE_SIM_DISCLAIMER, arcadeUid, parseStake } from "@/lib/arcade/types";
import { ArcadeStakeBar } from "./stake-bar";
import { ArcadeH2HPanel } from "./h2h-panel";

type Color = "w" | "b";
type Piece = `${Color}${string}`; // wK, bN, etc.
type Board = (Piece | null)[];

const START: Board = [
  "bR","bN","bB","bQ","bK","bB","bN","bR",
  "bP","bP","bP","bP","bP","bP","bP","bP",
  null,null,null,null,null,null,null,null,
  null,null,null,null,null,null,null,null,
  null,null,null,null,null,null,null,null,
  null,null,null,null,null,null,null,null,
  "wP","wP","wP","wP","wP","wP","wP","wP",
  "wR","wN","wB","wQ","wK","wB","wN","wR",
];

const GLYPH: Record<string, string> = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

function colorOf(p: Piece | null): Color | null {
  return p ? (p[0] as Color) : null;
}

function onBoard(r: number, c: number) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function idx(r: number, c: number) {
  return r * 8 + c;
}

function rc(i: number) {
  return [Math.floor(i / 8), i % 8] as const;
}

function rayMoves(board: Board, from: number, deltas: [number, number][], me: Color): number[] {
  const [r0, c0] = rc(from);
  const out: number[] = [];
  for (const [dr, dc] of deltas) {
    let r = r0 + dr;
    let c = c0 + dc;
    while (onBoard(r, c)) {
      const i = idx(r, c);
      const t = board[i];
      if (!t) out.push(i);
      else {
        if (colorOf(t) !== me) out.push(i);
        break;
      }
      r += dr;
      c += dc;
    }
  }
  return out;
}

function legalMoves(board: Board, from: number): number[] {
  const p = board[from];
  if (!p) return [];
  const me = colorOf(p)!;
  const kind = p[1];
  const [r, c] = rc(from);
  const out: number[] = [];
  const enemy = (i: number) => {
    const t = board[i];
    return !t || colorOf(t) !== me;
  };
  if (kind === "P") {
    const dir = me === "w" ? -1 : 1;
    const start = me === "w" ? 6 : 1;
    const one = idx(r + dir, c);
    if (onBoard(r + dir, c) && !board[one]) {
      out.push(one);
      const two = idx(r + 2 * dir, c);
      if (r === start && !board[two]) out.push(two);
    }
    for (const dc of [-1, 1]) {
      if (!onBoard(r + dir, c + dc)) continue;
      const i = idx(r + dir, c + dc);
      if (board[i] && colorOf(board[i]) !== me) out.push(i);
    }
  } else if (kind === "N") {
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      if (!onBoard(r + dr, c + dc)) continue;
      const i = idx(r + dr, c + dc);
      if (enemy(i)) out.push(i);
    }
  } else if (kind === "K") {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      if (!onBoard(r + dr, c + dc)) continue;
      const i = idx(r + dr, c + dc);
      if (enemy(i)) out.push(i);
    }
  } else if (kind === "R") {
    out.push(...rayMoves(board, from, [[1,0],[-1,0],[0,1],[0,-1]], me));
  } else if (kind === "B") {
    out.push(...rayMoves(board, from, [[1,1],[1,-1],[-1,1],[-1,-1]], me));
  } else if (kind === "Q") {
    out.push(...rayMoves(board, from, [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]], me));
  }
  return out;
}

function allMoves(board: Board, side: Color): { from: number; to: number }[] {
  const m: { from: number; to: number }[] = [];
  for (let i = 0; i < 64; i++) {
    if (colorOf(board[i]) !== side) continue;
    for (const to of legalMoves(board, i)) m.push({ from: i, to });
  }
  return m;
}

function applyMove(board: Board, from: number, to: number): Board {
  const next = [...board];
  let piece = next[from];
  next[from] = null;
  // thin promo
  if (piece && piece[1] === "P") {
    const [r] = rc(to);
    if (r === 0 || r === 7) piece = `${piece[0]}Q` as Piece;
  }
  next[to] = piece;
  return next;
}

function kingAlive(board: Board, side: Color): boolean {
  return board.some((p) => p === `${side}K`);
}

export function ChessGame({ onClose }: { onClose: () => void }) {
  const bankroll = useBook((s) => s.bankroll);
  const [mode, setMode] = useState<"cpu" | "local" | "h2h">("cpu");
  const [board, setBoard] = useState<Board>(() => [...START]);
  const [turn, setTurn] = useState<Color>("w");
  const [sel, setSel] = useState<number | null>(null);
  const [stakeStr, setStakeStr] = useState("0");
  const [staked, setStaked] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const moves = useMemo(
    () => (sel == null ? [] : legalMoves(board, sel)),
    [board, sel],
  );

  function reset() {
    setBoard([...START]);
    setTurn("w");
    setSel(null);
    setStaked(false);
    setOver(null);
    setNotice(null);
  }

  function lock() {
    if (mode === "h2h") return;
    const stake = parseStake(stakeStr);
    if (stake === null) { setNotice("Invalid stake."); return; }
    if (!canStake(stake, useBook.getState)) { setNotice("Bankroll too low."); return; }
    if (!spendStake(stake, useBook.getState, useBook.setState)) { setNotice("Could not lock."); return; }
    setStaked(true);
  }

  function endGame(outcome: "won" | "lost" | "push" | "pending", detail: string) {
    setOver(detail);
    const stake = parseStake(stakeStr) ?? 0;
    let payout = 0;
    if (mode === "cpu" && staked) {
      if (outcome === "won" || outcome === "push") {
        creditWin(stake, useBook.getState, useBook.setState);
        payout = stake;
      }
    }
    appendArcadeResult({
      id: arcadeUid("chess"),
      gameId: "chess",
      playedAt: new Date().toISOString(),
      stake: mode === "h2h" ? 0 : stake,
      payout,
      outcome: mode === "h2h" ? "pending" : outcome,
      detail,
      meta: { mode },
    });
  }

  function afterMove(next: Board, nextTurn: Color) {
    if (!kingAlive(next, "b")) {
      endGame(mode === "cpu" ? "won" : "pending", "White captures king (thin mate)");
      setBoard(next);
      return;
    }
    if (!kingAlive(next, "w")) {
      endGame(mode === "cpu" ? "lost" : "pending", "Black captures king (thin mate)");
      setBoard(next);
      return;
    }
    if (allMoves(next, nextTurn).length === 0) {
      endGame("push", "No legal moves — draw");
      setBoard(next);
      return;
    }
    setBoard(next);
    setTurn(nextTurn);
    if (mode === "cpu" && nextTurn === "b") {
      window.setTimeout(() => {
        const opts = allMoves(next, "b");
        if (!opts.length) {
          endGame("push", "CPU no moves — draw");
          return;
        }
        const pick = opts[Math.floor(Math.random() * opts.length)]!;
        const after = applyMove(next, pick.from, pick.to);
        if (!kingAlive(after, "w")) endGame("lost", "CPU wins (thin)");
        else {
          setBoard(after);
          setTurn("w");
        }
      }, 280);
    }
  }

  function clickSq(i: number) {
    if (over) return;
    if (mode !== "h2h" && !staked) {
      if ((parseStake(stakeStr) ?? 0) > 0) {
        setNotice("Lock stake first (or set 0).");
        return;
      }
      setStaked(true);
    }
    if (sel != null && moves.includes(i)) {
      const next = applyMove(board, sel, i);
      setSel(null);
      afterMove(next, turn === "w" ? "b" : "w");
      return;
    }
    if (colorOf(board[i]) === turn) setSel(i);
    else setSel(null);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Arcade</p>
          <h3 className="font-display text-2xl font-semibold text-cream">Chess</h3>
        </div>
        <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream">Back</button>
      </div>
      <p className="text-sm text-muted">
        Thin rules (no castling/en passant/check filter). Local 2P or random-legal CPU. {ARCADE_SIM_DISCLAIMER}
      </p>
      <div className="flex flex-wrap gap-2">
        {(["cpu","local","h2h"] as const).map((m) => (
          <button key={m} type="button" onClick={() => { setMode(m); reset(); }}
            className={`min-h-11 rounded-full border px-4 text-sm ${mode===m?"border-gold bg-gold text-ink":"border-gold/30 text-cream"}`}>
            {m === "cpu" ? "Vs CPU" : m === "local" ? "Local 2P" : "H2H E$L"}
          </button>
        ))}
        <button type="button" onClick={reset} className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream">Reset</button>
      </div>
      {mode !== "h2h" ? (
        <>
          <ArcadeStakeBar value={stakeStr} onChange={setStakeStr} bankroll={bankroll} disabled={staked} error={notice} />
          {!staked ? <button type="button" onClick={lock} className="min-h-11 rounded-full border border-gold bg-gold px-4 text-sm text-ink">Lock stake</button> : null}
        </>
      ) : (
        <ArcadeH2HPanel gameId="chess" termsExtra="thin chess · manual settle" defaultStake="5" />
      )}
      <div className="mx-auto grid w-72 grid-cols-8 overflow-hidden rounded-[var(--radius-md)] border border-gold/40">
        {board.map((p, i) => {
          const [r, c] = rc(i);
          const dark = (r + c) % 2 === 1;
          const hi = sel === i || moves.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => clickSq(i)}
              className={`flex size-9 items-center justify-center text-lg ${
                hi ? "bg-gold/40" : dark ? "bg-[#1a3d2c]" : "bg-[#2f5d45]"
              }`}
            >
              {p ? GLYPH[p] : ""}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-cream">{over ?? `Turn: ${turn === "w" ? "White" : "Black"}`}</p>
    </section>
  );
}
