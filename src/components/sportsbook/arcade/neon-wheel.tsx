/**
 * Neon Wheel — spin for 0 / even / ×2 / ×3. Solo stake only.
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

const SEGMENTS: { label: string; mult: number; color: string }[] = [
  { label: "0", mult: 0, color: "#ff2bd6" },
  { label: "even", mult: 1, color: "#d4af37" },
  { label: "×2", mult: 2, color: "#5ef0ff" },
  { label: "×3", mult: 3, color: "#9b5cff" },
  { label: "0", mult: 0, color: "#ff2bd6" },
  { label: "even", mult: 1, color: "#c9a227" },
  { label: "×2", mult: 2, color: "#00e0ff" },
  { label: "even", mult: 1, color: "#d4af37" },
];

const SIZE = 280;
const HOW = ARCADE_HOWTO_COPY["neon-wheel"];

export function NeonWheelGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bankroll = useBook((s) => s.bankroll);
  const { ready: howtoReady, markReady } = useArcadeHowToGate("neon-wheel");
  const [stakeStr, setStakeStr] = useState("0");
  const [spinning, setSpinning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastLabel, setLastLabel] = useState<string | null>(null);
  const angle = useRef(0);
  const vel = useRef(0);
  const stakeRef = useRef(0);
  const settled = useRef(true);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const loop = () => {
      if (vel.current > 0.002) {
        angle.current += vel.current;
        vel.current *= 0.985;
        if (vel.current <= 0.002) {
          vel.current = 0;
          if (!settled.current) finishSpin();
        }
      }
      draw(ctx);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  function draw(ctx: CanvasRenderingContext2D) {
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const r = SIZE / 2 - 8;
    ctx.fillStyle = "#07070c";
    ctx.fillRect(0, 0, SIZE, SIZE);
    const n = SEGMENTS.length;
    const slice = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
      const a0 = angle.current + i * slice;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a0, a0 + slice);
      ctx.closePath();
      ctx.fillStyle = SEGMENTS[i].color;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a0 + slice / 2);
      ctx.fillStyle = "#07070c";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(SEGMENTS[i].label, r * 0.55, 4);
      ctx.restore();
    }
    ctx.strokeStyle = "rgba(212,175,55,0.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    // pointer at top
    ctx.fillStyle = "#f5f0e6";
    ctx.beginPath();
    ctx.moveTo(cx, 4);
    ctx.lineTo(cx - 8, 22);
    ctx.lineTo(cx + 8, 22);
    ctx.closePath();
    ctx.fill();
  }

  function finishSpin() {
    settled.current = true;
    setSpinning(false);
    const n = SEGMENTS.length;
    const slice = (Math.PI * 2) / n;
    // pointer at -PI/2 (top); which segment is under it
    let a = (-Math.PI / 2 - angle.current) % (Math.PI * 2);
    if (a < 0) a += Math.PI * 2;
    const idx = Math.floor(a / slice) % n;
    const seg = SEGMENTS[idx];
    setLastLabel(seg.label);
    const stake = stakeRef.current;
    const payout = Math.round(stake * seg.mult * 100) / 100;
    if (payout > 0) creditWin(payout, useBook.getState, useBook.setState);
    appendArcadeResult({
      id: arcadeUid("wheel"),
      gameId: "neon-wheel",
      playedAt: new Date().toISOString(),
      stake,
      payout,
      outcome: payout > 0 ? (seg.mult > 1 ? "won" : "push") : stake > 0 ? "lost" : "void",
      detail: `Neon Wheel ${seg.label} → ${payout}`,
      meta: { label: seg.label, mult: seg.mult },
    });
    setNotice(
      seg.mult === 0
        ? "Hit 0 — stake kept (sim)."
        : `Landed ${seg.label}: +${payout} E$L coin$.`,
    );
  }

  function spin() {
    setNotice(null);
    if (spinning) return;
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
    setLastLabel(null);
    vel.current = 0.35 + Math.random() * 0.35;
    setSpinning(true);
  }

  if (!howtoReady) {
    return (
      <section className="space-y-4">
        <Hdr onClose={onClose} />
        <ArcadeHowTo {...HOW} gameId="neon-wheel" onPlay={markReady} />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <Hdr onClose={onClose} />
      <ArcadeHowToExpandable {...HOW} gameId="neon-wheel" />
      <p className="text-sm text-muted">
        Solo only. Segments: 0 / even / ×2 / ×3. {ARCADE_SIM_DISCLAIMER}
      </p>
      <ArcadeStakeBar
        value={stakeStr}
        onChange={setStakeStr}
        bankroll={bankroll}
        disabled={spinning}
        error={notice}
      />
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        className="mx-auto rounded-full border border-gold/40"
        style={{ background: "#07070c", boxShadow: "0 0 28px rgba(255,43,214,0.25)" }}
      />
      <button
        type="button"
        disabled={spinning}
        onClick={spin}
        className="min-h-11 w-full max-w-xs rounded-full border border-gold bg-gold px-6 text-sm font-semibold uppercase tracking-[0.2em] text-ink disabled:opacity-50"
      >
        {spinning ? "Spinning…" : "SPIN"}
      </button>
      {lastLabel ? <p className="text-sm text-gold">Last: {lastLabel}</p> : null}
      {notice ? <p className="text-sm text-cream">{notice}</p> : null}
    </section>
  );
}

function Hdr({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Arcade</p>
        <h3 className="font-display text-2xl font-semibold text-cream">Neon Wheel</h3>
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
