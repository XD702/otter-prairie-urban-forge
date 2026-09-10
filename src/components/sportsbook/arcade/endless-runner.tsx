/**
 * Endless Runner — jump/dodge, distance score.
 * Optional E$L buy-in; sim prize table by distance. Simulation only.
 */
import { useEffect, useRef, useState } from "react";
import { useBook } from "@/lib/betting/store";
import { canStake, creditWin, spendStake } from "@/lib/arcade/bankroll";
import { appendArcadeResult } from "@/lib/arcade/history";
import { ARCADE_SIM_DISCLAIMER, arcadeUid, parseStake } from "@/lib/arcade/types";
import { ArcadeStakeBar } from "./stake-bar";
import { ArcadeH2HPanel } from "./h2h-panel";

const W = 480;
const H = 220;
const GROUND = H - 36;

/** Sim-only prize multipliers on buy-in (distance thresholds). */
const PRIZE_TABLE: { minDist: number; mult: number; label: string }[] = [
  { minDist: 1500, mult: 3, label: "x3" },
  { minDist: 800, mult: 2, label: "x2" },
  { minDist: 400, mult: 1, label: "even" },
];

function prizeFor(dist: number, stake: number): { payout: number; label: string } {
  for (const row of PRIZE_TABLE) {
    if (dist >= row.minDist) {
      return { payout: Math.round(stake * row.mult * 100) / 100, label: row.label };
    }
  }
  return { payout: 0, label: "none" };
}

export function EndlessRunnerGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bankroll = useBook((s) => s.bankroll);
  const [mode, setMode] = useState<"solo" | "h2h">("solo");
  const [stakeStr, setStakeStr] = useState("0");
  const [running, setRunning] = useState(false);
  const [dist, setDist] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const g = useRef({
    y: GROUND - 28,
    vy: 0,
    onGround: true,
    obstacles: [] as { x: number; w: number; h: number }[],
    speed: 4,
    dist: 0,
    stake: 0,
    alive: true,
    spawn: 0,
  });

  useEffect(() => {
    const jump = (e: Event) => {
      e.preventDefault();
      if (!running) return;
      const s = g.current;
      if (s.onGround && s.alive) {
        s.vy = -9.2;
        s.onGround = false;
      }
    };
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" || e.key === "ArrowUp") jump(e);
    });
    const c = canvasRef.current;
    c?.addEventListener("pointerdown", jump);
    return () => c?.removeEventListener("pointerdown", jump);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const loop = () => {
      const s = g.current;
      if (!s.alive) {
        setRunning(false);
        finish(s.dist, s.stake);
        return;
      }
      s.dist += s.speed;
      s.speed = Math.min(9, 4 + s.dist / 1200);
      s.vy += 0.45;
      s.y += s.vy;
      if (s.y >= GROUND - 28) {
        s.y = GROUND - 28;
        s.vy = 0;
        s.onGround = true;
      }
      s.spawn -= 1;
      if (s.spawn <= 0) {
        s.obstacles.push({
          x: W + 10,
          w: 18 + Math.random() * 16,
          h: 24 + Math.random() * 28,
        });
        s.spawn = 70 + Math.floor(Math.random() * 50);
      }
      for (const o of s.obstacles) o.x -= s.speed;
      s.obstacles = s.obstacles.filter((o) => o.x + o.w > -10);
      const px = 48;
      const pw = 22;
      const ph = 28;
      for (const o of s.obstacles) {
        const ox = o.x;
        const oy = GROUND - o.h;
        if (px < ox + o.w && px + pw > ox && s.y < oy + o.h && s.y + ph > oy) {
          s.alive = false;
        }
      }
      setDist(Math.floor(s.dist));

      ctx.fillStyle = "#0b2e1f";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(212,175,55,0.35)";
      ctx.fillRect(0, GROUND, W, 4);
      ctx.fillStyle = "#d4af37";
      ctx.fillRect(px, s.y, pw, ph);
      ctx.fillStyle = "#8b2942";
      for (const o of s.obstacles) {
        ctx.fillRect(o.x, GROUND - o.h, o.w, o.h);
      }
      ctx.fillStyle = "#f5f0e6";
      ctx.font = "14px sans-serif";
      ctx.fillText(`Dist ${Math.floor(s.dist)}`, 12, 22);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  function finish(distance: number, stake: number) {
    if (mode === "h2h") {
      appendArcadeResult({
        id: arcadeUid("run"),
        gameId: "endless-runner",
        playedAt: new Date().toISOString(),
        stake: 0,
        payout: 0,
        outcome: "pending",
        detail: `Runner dist ${Math.floor(distance)} · settle H2H manually`,
        meta: { distance, mode },
      });
      setNotice(`Distance ${Math.floor(distance)}. Settle H2H if you wagered.`);
      return;
    }
    const { payout, label } = prizeFor(distance, stake);
    if (payout > 0) creditWin(payout, useBook.getState, useBook.setState);
    appendArcadeResult({
      id: arcadeUid("run"),
      gameId: "endless-runner",
      playedAt: new Date().toISOString(),
      stake,
      payout,
      outcome: payout > 0 ? "won" : stake > 0 ? "lost" : "void",
      detail: `Runner dist ${Math.floor(distance)} · prize ${label} → ${payout}`,
      meta: { distance, prize: label },
    });
    setNotice(
      payout > 0
        ? `Prize ${label}: +${payout} E$L coin$ (buy-in was spent).`
        : `No prize (need ≥400). Distance ${Math.floor(distance)}.`,
    );
  }

  function start() {
    setNotice(null);
    const stake = parseStake(stakeStr);
    if (mode === "solo") {
      if (stake === null) { setNotice("Invalid stake."); return; }
      if (!canStake(stake, useBook.getState)) { setNotice("Bankroll too low."); return; }
      if (!spendStake(stake, useBook.getState, useBook.setState)) { setNotice("Could not lock."); return; }
      g.current.stake = stake;
    } else {
      g.current.stake = 0;
    }
    g.current = {
      ...g.current,
      y: GROUND - 28,
      vy: 0,
      onGround: true,
      obstacles: [],
      speed: 4,
      dist: 0,
      alive: true,
      spawn: 40,
    };
    setDist(0);
    setRunning(true);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Arcade</p>
          <h3 className="font-display text-2xl font-semibold text-cream">Endless Runner</h3>
        </div>
        <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream">Back</button>
      </div>
      <p className="text-sm text-muted">
        Space / tap to jump. Buy-in prize table (sim): 400 even · 800 x2 · 1500 x3. {ARCADE_SIM_DISCLAIMER}
      </p>
      <ul className="text-xs text-muted">
        {PRIZE_TABLE.map((r) => (
          <li key={r.minDist}>≥{r.minDist} dist → {r.label} on buy-in</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setMode("solo")} className={`min-h-11 rounded-full border px-4 text-sm ${mode==="solo"?"border-gold bg-gold text-ink":"border-gold/30 text-cream"}`}>Solo buy-in</button>
        <button type="button" onClick={() => setMode("h2h")} className={`min-h-11 rounded-full border px-4 text-sm ${mode==="h2h"?"border-gold bg-gold text-ink":"border-gold/30 text-cream"}`}>H2H E$L</button>
      </div>
      {mode === "solo" ? (
        <ArcadeStakeBar value={stakeStr} onChange={setStakeStr} bankroll={bankroll} disabled={running} error={notice} />
      ) : (
        <ArcadeH2HPanel gameId="endless-runner" termsExtra="high score duel · settle by distance" defaultStake="5" />
      )}
      <canvas ref={canvasRef} width={W} height={H} className="w-full max-w-lg rounded-[var(--radius-md)] border border-gold/30" />
      <p className="text-sm tabular-nums text-cream">Distance {dist}</p>
      {!running ? (
        <button type="button" onClick={start} className="min-h-11 rounded-full border border-gold bg-gold px-5 text-sm text-ink">
          {dist ? "Run again" : "Start run"}
        </button>
      ) : null}
      {notice ? <p className="text-sm text-gold">{notice}</p> : null}
    </section>
  );
}
