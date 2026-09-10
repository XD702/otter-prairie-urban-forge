/**
 * Eastside Plinko — chip down pegs; multipliers 0 / 0.5 / 1 / 2 / 5.
 * Solo stake only. Simulation only — not real money.
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

const W = 360;
const H = 420;
const ROWS = 8;
const SLOTS = [0, 0.5, 1, 2, 5, 2, 1, 0.5, 0] as const;
const HOW = ARCADE_HOWTO_COPY.plinko;

type Peg = { x: number; y: number };
type Ball = { x: number; y: number; vx: number; vy: number; alive: boolean };

function buildPegs(): Peg[] {
  const pegs: Peg[] = [];
  const top = 56;
  const gapY = 36;
  for (let r = 0; r < ROWS; r++) {
    const cols = r + 3;
    const span = W - 48;
    for (let c = 0; c < cols; c++) {
      const x = 24 + (span / (cols - 1 || 1)) * c;
      pegs.push({ x, y: top + r * gapY });
    }
  }
  return pegs;
}

export function PlinkoGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bankroll = useBook((s) => s.bankroll);
  const { ready: howtoReady, markReady } = useArcadeHowToGate("plinko");
  const [stakeStr, setStakeStr] = useState("0");
  const [dropping, setDropping] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastMult, setLastMult] = useState<number | null>(null);
  const pegs = useRef(buildPegs());
  const ball = useRef<Ball | null>(null);
  const stakeRef = useRef(0);
  const settled = useRef(false);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const loop = () => {
      draw(ctx);
      const b = ball.current;
      if (b && b.alive) {
        b.vy += 0.28;
        b.x += b.vx;
        b.y += b.vy;
        // walls
        if (b.x < 14) {
          b.x = 14;
          b.vx = Math.abs(b.vx) * 0.7;
        }
        if (b.x > W - 14) {
          b.x = W - 14;
          b.vx = -Math.abs(b.vx) * 0.7;
        }
        // peg collisions
        for (const p of pegs.current) {
          const dx = b.x - p.x;
          const dy = b.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 12) {
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            b.vx += nx * 1.4 + (Math.random() - 0.5) * 0.8;
            b.vy = Math.abs(b.vy) * 0.35 + 0.6;
            b.x = p.x + nx * 12;
            b.y = p.y + ny * 12;
          }
        }
        // slot floor
        if (b.y >= H - 36) {
          b.alive = false;
          b.y = H - 36;
          settleSlot(b.x);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  function draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#07070c";
    ctx.fillRect(0, 0, W, H);
    // neon frame
    ctx.strokeStyle = "rgba(212,175,55,0.45)";
    ctx.strokeRect(4, 4, W - 8, H - 8);

    // lane hints
    const laneW = (W - 40) / 5;
    for (let i = 0; i < 5; i++) {
      const x = 20 + i * laneW + laneW / 2;
      ctx.fillStyle = "rgba(255,43,214,0.25)";
      ctx.fillRect(x - 10, 12, 20, 18);
      ctx.fillStyle = "#f5f0e6";
      ctx.font = "10px sans-serif";
      ctx.fillText(String(i + 1), x - 3, 25);
    }

    for (const p of pegs.current) {
      ctx.fillStyle = "#d4af37";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // slots
    const slotW = (W - 20) / SLOTS.length;
    SLOTS.forEach((m, i) => {
      const x = 10 + i * slotW;
      ctx.fillStyle = i % 2 === 0 ? "#12261c" : "#1a1a24";
      ctx.fillRect(x, H - 34, slotW - 2, 28);
      ctx.fillStyle = m === 0 ? "#ff2bd6" : m >= 2 ? "#5ef0ff" : "#d4af37";
      ctx.font = "11px sans-serif";
      ctx.fillText(m === 0 ? "0" : `×${m}`, x + 6, H - 14);
    });

    const b = ball.current;
    if (b) {
      ctx.fillStyle = "#d4af37";
      ctx.beginPath();
      ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#5ef0ff";
      ctx.stroke();
    }
  }

  function settleSlot(x: number) {
    if (settled.current) return;
    settled.current = true;
    setDropping(false);
    const slotW = (W - 20) / SLOTS.length;
    let idx = Math.floor((x - 10) / slotW);
    idx = Math.max(0, Math.min(SLOTS.length - 1, idx));
    const mult = SLOTS[idx];
    setLastMult(mult);
    const stake = stakeRef.current;
    const payout = Math.round(stake * mult * 100) / 100;
    if (payout > 0) creditWin(payout, useBook.getState, useBook.setState);
    appendArcadeResult({
      id: arcadeUid("plinko"),
      gameId: "plinko",
      playedAt: new Date().toISOString(),
      stake,
      payout,
      outcome: payout > 0 ? (mult >= 1 ? "won" : "push") : stake > 0 ? "lost" : "void",
      detail: `Plinko lane land ×${mult} → ${payout}`,
      meta: { mult, slot: idx },
    });
    setNotice(
      mult === 0
        ? "Slot 0 — stake kept by the house (sim)."
        : `Landed ×${mult}: +${payout} E$L coin$.`,
    );
  }

  function drop(lane: number) {
    setNotice(null);
    if (dropping) return;
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
    stakeRef.current = stake;
    settled.current = false;
    setLastMult(null);
    const laneW = (W - 40) / 5;
    const x = 20 + lane * laneW + laneW / 2;
    ball.current = {
      x,
      y: 36,
      vx: (Math.random() - 0.5) * 1.2,
      vy: 0.5,
      alive: true,
    };
    setDropping(true);
  }

  if (!howtoReady) {
    return (
      <section className="space-y-4">
        <Hdr onClose={onClose} />
        <ArcadeHowTo {...HOW} gameId="plinko" onPlay={markReady} />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <Hdr onClose={onClose} />
      <ArcadeHowToExpandable {...HOW} gameId="plinko" />
      <p className="text-sm text-muted">
        Solo only. Multipliers 0 / 0.5 / 1 / 2 / 5. {ARCADE_SIM_DISCLAIMER}
      </p>
      <ArcadeStakeBar
        value={stakeStr}
        onChange={setStakeStr}
        bankroll={bankroll}
        disabled={dropping}
        error={notice}
      />
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="mx-auto w-full max-w-sm rounded-[var(--radius-md)] border border-gold/30"
        style={{ background: "#07070c" }}
      />
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3, 4].map((lane) => (
          <button
            key={lane}
            type="button"
            disabled={dropping}
            onClick={() => drop(lane)}
            className="min-h-11 min-w-11 flex-1 rounded-full border border-gold/40 px-3 text-sm text-cream disabled:opacity-50 hover:border-gold"
          >
            Lane {lane + 1}
          </button>
        ))}
      </div>
      {lastMult != null ? (
        <p className="text-sm text-gold">Last result ×{lastMult}</p>
      ) : null}
      {notice ? <p className="text-sm text-cream">{notice}</p> : null}
    </section>
  );
}

function Hdr({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Arcade</p>
        <h3 className="font-display text-2xl font-semibold text-cream">Eastside Plinko</h3>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream"
      >
        Back
      </button>
    </div>
  );
}
