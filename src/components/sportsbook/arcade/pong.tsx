/**
 * Pong — vs CPU (playable canvas) + optional 1v1 E$L H2H side-bet.
 * Simulation only — not real money.
 */
import { useEffect, useRef, useState } from "react";
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

const W = 480;
const H = 280;
const PADDLE_H = 56;
const PADDLE_W = 10;
const BALL = 8;
const WIN = 5;

export function PongGame({ onClose }: { onClose: () => void }) {
  const { ready: howtoReady, markReady } = useArcadeHowToGate("pong");
  const HOW = ARCADE_HOWTO_COPY["pong"];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bankroll = useBook((s) => s.bankroll);
  const [mode, setMode] = useState<"cpu" | "h2h">("cpu");
  const [stakeStr, setStakeStr] = useState("0");
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState({ p: 0, c: 0 });
  const [notice, setNotice] = useState<string | null>(null);
  const state = useRef({
    py: H / 2 - PADDLE_H / 2,
    cy: H / 2 - PADDLE_H / 2,
    bx: W / 2,
    by: H / 2,
    vx: 3.2,
    vy: 2.1,
    p: 0,
    c: 0,
    keys: { up: false, down: false },
    settled: false,
    stake: 0,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (e.key === "ArrowUp" || e.key === "w") state.current.keys.up = down;
      if (e.key === "ArrowDown" || e.key === "s") state.current.keys.down = down;
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const loop = () => {
      const s = state.current;
      if (s.keys.up) s.py = Math.max(0, s.py - 4.5);
      if (s.keys.down) s.py = Math.min(H - PADDLE_H, s.py + 4.5);
      // CPU tracks ball with lag
      const target = s.by - PADDLE_H / 2;
      s.cy += Math.max(-3.2, Math.min(3.2, target - s.cy));
      s.cy = Math.max(0, Math.min(H - PADDLE_H, s.cy));

      s.bx += s.vx;
      s.by += s.vy;
      if (s.by <= 0 || s.by + BALL >= H) s.vy *= -1;

      // paddles
      if (s.bx <= 20 && s.by + BALL >= s.py && s.by <= s.py + PADDLE_H) {
        s.vx = Math.abs(s.vx) + 0.15;
        s.bx = 20;
      }
      if (s.bx + BALL >= W - 20 && s.by + BALL >= s.cy && s.by <= s.cy + PADDLE_H) {
        s.vx = -Math.abs(s.vx) - 0.15;
        s.bx = W - 20 - BALL;
      }

      if (s.bx < 0) {
        s.c += 1;
        resetBall(s, 1);
        setScore({ p: s.p, c: s.c });
      } else if (s.bx > W) {
        s.p += 1;
        resetBall(s, -1);
        setScore({ p: s.p, c: s.c });
      }

      if ((s.p >= WIN || s.c >= WIN) && !s.settled) {
        s.settled = true;
        setRunning(false);
        finish(s.p >= WIN ? "won" : "lost", s.p, s.c, s.stake);
      }

      // draw
      ctx.fillStyle = "#0b2e1f";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(212,175,55,0.35)";
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();
      ctx.fillStyle = "#d4af37";
      ctx.fillRect(10, s.py, PADDLE_W, PADDLE_H);
      ctx.fillRect(W - 20, s.cy, PADDLE_W, PADDLE_H);
      ctx.fillRect(s.bx, s.by, BALL, BALL);
      ctx.font = "16px sans-serif";
      ctx.fillText(String(s.p), W / 2 - 40, 24);
      ctx.fillText(String(s.c), W / 2 + 28, 24);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  function resetBall(s: typeof state.current, dir: number) {
    s.bx = W / 2;
    s.by = H / 2;
    s.vx = 3.2 * dir;
    s.vy = (Math.random() * 2 + 1.5) * (Math.random() < 0.5 ? 1 : -1);
  }

  function finish(outcome: "won" | "lost", p: number, c: number, stake: number) {
    let payout = 0;
    if (mode === "cpu") {
      if (outcome === "won") {
        creditWin(stake, useBook.getState, useBook.setState);
        payout = stake;
      }
    }
    appendArcadeResult({
      id: arcadeUid("pong"),
      gameId: "pong",
      playedAt: new Date().toISOString(),
      stake: mode === "h2h" ? 0 : stake,
      payout,
      outcome: mode === "h2h" ? "pending" : outcome,
      detail: `Pong ${p}-${c} vs ${mode} · ${outcome}`,
      meta: { p, c, mode },
    });
    setNotice(mode === "h2h" ? "Game over — settle H2H challenge manually." : `You ${outcome}.`);
  }

  function start() {
    setNotice(null);
    const stake = parseStake(stakeStr);
    if (mode === "cpu") {
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
      state.current.stake = stake;
    } else {
      state.current.stake = 0;
    }
    state.current.p = 0;
    state.current.c = 0;
    state.current.settled = false;
    resetBall(state.current, 1);
    setScore({ p: 0, c: 0 });
    setRunning(true);
  }

  if (!howtoReady) {
    return (
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Arcade</p>
            <h3 className="font-display text-2xl font-semibold text-cream">Pong</h3>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream">Back</button>
        </div>
        <ArcadeHowTo {...HOW} gameId="pong" onPlay={markReady} />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Arcade</p>
          <h3 className="font-display text-2xl font-semibold text-cream">Pong</h3>
        </div>
        <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream">Back</button>
      </div>
      <ArcadeHowToExpandable {...HOW} gameId="pong" />
      <p className="text-sm text-muted">
        First to {WIN}. Arrow keys / W S. Vs CPU with optional stake, or H2H E$L side-bet. {ARCADE_SIM_DISCLAIMER}
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setMode("cpu")} className={`min-h-11 rounded-full border px-4 text-sm ${mode === "cpu" ? "border-gold bg-gold text-ink" : "border-gold/30 text-cream"}`}>Vs CPU</button>
        <button type="button" onClick={() => setMode("h2h")} className={`min-h-11 rounded-full border px-4 text-sm ${mode === "h2h" ? "border-gold bg-gold text-ink" : "border-gold/30 text-cream"}`}>H2H E$L</button>
      </div>
      {mode === "cpu" ? (
        <ArcadeStakeBar value={stakeStr} onChange={setStakeStr} bankroll={bankroll} disabled={running} error={notice} />
      ) : (
        <ArcadeH2HPanel gameId="pong" termsExtra={`first to ${WIN} · canvas play / settle after`} defaultStake="5" />
      )}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full max-w-lg touch-none rounded-[var(--radius-md)] border border-gold/30"
        onPointerMove={(e) => {
          const c = canvasRef.current;
          if (!c) return;
          const rect = c.getBoundingClientRect();
          const y = ((e.clientY - rect.top) / rect.height) * H;
          state.current.py = Math.max(0, Math.min(H - PADDLE_H, y - PADDLE_H / 2));
        }}
      />
      <p className="text-sm text-cream tabular-nums">Score {score.p} – {score.c}</p>
      {!running ? (
        <button type="button" onClick={start} className="min-h-11 rounded-full border border-gold bg-gold px-5 text-sm text-ink">
          {score.p || score.c ? "Play again" : "Start"}
        </button>
      ) : null}
      {notice ? <p className="text-sm text-gold">{notice}</p> : null}
    </section>
  );
}
