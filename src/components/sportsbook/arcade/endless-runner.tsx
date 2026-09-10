/**
 * Eastside Run — Mario-like side-scroller (no Nintendo IP/assets/names).
 * Geometric gold chip mascot, void night + felt mid-ground, gold geometry.
 * Simulation only — not real money.
 */
import { useEffect, useRef, useState, type TouchEvent } from "react";
import { useBook } from "@/lib/betting/store";
import { canStake, creditWin, spendStake } from "@/lib/arcade/bankroll";
import { appendArcadeResult } from "@/lib/arcade/history";
import { ARCADE_SIM_DISCLAIMER, arcadeUid, parseStake } from "@/lib/arcade/types";
import { ArcadeStakeBar } from "./stake-bar";
import { ArcadeH2HPanel } from "./h2h-panel";
import {
  ARCADE_HOWTO_COPY,
  ArcadeHowToExpandable,
  useArcadeHowToGate,
  ArcadeHowTo,
} from "./arcade-how-to";

const W = 560;
const H = 280;
const GROUND = H - 40;
const PLAYER_W = 26;
const PLAYER_H = 28;
const COYOTE_MS = 80;
const GRAVITY = 0.52;
const JUMP_V = -10.2;
const HOLD_GRAVITY = 0.28;
const DUCK_H = 16;

type HazardKind = "chip" | "spike" | "pit";
type Hazard = { x: number; w: number; h: number; kind: HazardKind; rolling?: number };
type Coin = { x: number; y: number; taken: boolean };

/** Sim-only prize multipliers on buy-in (distance thresholds). */
const PRIZE_TABLE: { minDist: number; mult: number; label: string }[] = [
  { minDist: 1500, mult: 3, label: "×3" },
  { minDist: 800, mult: 2, label: "×2" },
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

const HOW = ARCADE_HOWTO_COPY["endless-runner"];

export function EndlessRunnerGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bankroll = useBook((s) => s.bankroll);
  const { ready: howtoReady, markReady } = useArcadeHowToGate("endless-runner");
  const [mode, setMode] = useState<"solo" | "h2h">("solo");
  const [stakeStr, setStakeStr] = useState("0");
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [dist, setDist] = useState(0);
  const [coinsHud, setCoinsHud] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [coinFlash, setCoinFlash] = useState(0);

  const g = useRef({
    y: GROUND - PLAYER_H,
    vy: 0,
    onGround: true,
    ducking: false,
    coyote: 0,
    doubleReady: false,
    usedDouble: false,
    jumpHeld: false,
    hazards: [] as Hazard[],
    coins: [] as Coin[],
    speed: 4.2,
    dist: 0,
    coinCount: 0,
    stake: 0,
    alive: true,
    spawn: 0,
    coinSpawn: 0,
    parallax: 0,
    camera: 0,
  });

  const keys = useRef({ jump: false, duck: false, pauseEdge: false });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "ArrowUp") {
        e.preventDefault();
        keys.current.jump = true;
        tryJump();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        keys.current.duck = true;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "ArrowUp") {
        keys.current.jump = false;
        g.current.jumpHeld = false;
      }
      if (e.key === "ArrowDown") keys.current.duck = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  });

  function tryJump() {
    if (!running || paused) return;
    const s = g.current;
    if (!s.alive) return;
    const canCoyote = s.coyote > 0;
    if ((s.onGround || canCoyote) && !s.ducking) {
      s.vy = JUMP_V;
      s.onGround = false;
      s.coyote = 0;
      s.jumpHeld = true;
      s.usedDouble = false;
      return;
    }
    if (s.doubleReady && !s.usedDouble && !s.onGround) {
      s.vy = JUMP_V * 0.82;
      s.usedDouble = true;
      s.doubleReady = false;
      s.jumpHeld = true;
    }
  }

  useEffect(() => {
    if (!running || paused) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      const s = g.current;
      if (!s.alive) {
        setRunning(false);
        finish(s.dist, s.stake, s.coinCount);
        return;
      }

      s.ducking = keys.current.duck && s.onGround;
      const ph = s.ducking ? DUCK_H : PLAYER_H;

      // physics
      const grav = s.jumpHeld && s.vy < 0 ? HOLD_GRAVITY : GRAVITY;
      s.vy += grav * (dt / 16.67);
      s.y += s.vy * (dt / 16.67);
      if (s.y >= GROUND - ph) {
        s.y = GROUND - ph;
        s.vy = 0;
        s.onGround = true;
        s.coyote = COYOTE_MS;
      } else {
        s.onGround = false;
        s.coyote = Math.max(0, s.coyote - dt);
      }

      s.dist += s.speed * (dt / 16.67);
      s.speed = Math.min(10, 4.2 + s.dist / 1400);
      s.parallax += s.speed * 0.35;
      s.camera += s.speed;

      s.spawn -= dt;
      if (s.spawn <= 0) {
        const roll = Math.random();
        if (roll < 0.22) {
          s.hazards.push({ x: W + 20, w: 56, h: 18, kind: "pit" });
        } else if (roll < 0.55) {
          s.hazards.push({
            x: W + 20,
            w: 22,
            h: 22,
            kind: "chip",
            rolling: Math.random() * Math.PI * 2,
          });
        } else {
          s.hazards.push({
            x: W + 20,
            w: 28 + Math.random() * 12,
            h: 28 + Math.random() * 20,
            kind: "spike",
          });
        }
        s.spawn = 780 + Math.random() * 700;
      }

      s.coinSpawn -= dt;
      if (s.coinSpawn <= 0) {
        s.coins.push({
          x: W + 30,
          y: GROUND - 70 - Math.random() * 50,
          taken: false,
        });
        s.coinSpawn = 900 + Math.random() * 800;
      }

      for (const h of s.hazards) {
        h.x -= s.speed * (dt / 16.67);
        if (h.kind === "chip" && h.rolling != null) h.rolling += 0.12;
      }
      s.hazards = s.hazards.filter((h) => h.x + h.w > -40);
      for (const c of s.coins) c.x -= s.speed * (dt / 16.67);
      s.coins = s.coins.filter((c) => c.x > -20 && !c.taken);

      const px = 56;
      const pw = PLAYER_W;
      const py = s.y;
      const pBottom = py + ph;

      for (const h of s.hazards) {
        if (h.kind === "pit") {
          const overPit = px + pw > h.x + 8 && px < h.x + h.w - 8;
          if (overPit && s.onGround) {
            s.alive = false;
          }
          continue;
        }
        const hy = GROUND - h.h;
        const hit =
          px < h.x + h.w &&
          px + pw > h.x &&
          py < hy + h.h &&
          pBottom > hy + (h.kind === "spike" && s.ducking ? 10 : 0);
        if (hit) s.alive = false;
      }

      for (const c of s.coins) {
        if (c.taken) continue;
        if (px < c.x + 14 && px + pw > c.x && py < c.y + 14 && pBottom > c.y) {
          c.taken = true;
          s.coinCount += 1;
          s.doubleReady = true;
          setCoinFlash(performance.now() + 180);
        }
      }

      setDist(Math.floor(s.dist));
      setCoinsHud(s.coinCount);

      // —— draw After Dark void ——
      ctx.fillStyle = "#07070c";
      ctx.fillRect(0, 0, W, H);

      // far stars / neon dust
      ctx.fillStyle = "rgba(0,255,255,0.15)";
      for (let i = 0; i < 18; i++) {
        const sx = ((i * 97 - s.parallax * 0.2) % W + W) % W;
        const sy = 12 + ((i * 37) % 90);
        ctx.fillRect(sx, sy, 2, 2);
      }

      // felt mid-ground hills
      ctx.fillStyle = "#12261c";
      ctx.beginPath();
      ctx.moveTo(0, GROUND - 30);
      for (let x = 0; x <= W; x += 40) {
        const y =
          GROUND - 28 - Math.sin((x + s.parallax * 0.5) * 0.02) * 10;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.fill();

      // ground felt strip
      ctx.fillStyle = "#1a3326";
      ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = "rgba(212,175,55,0.55)";
      ctx.fillRect(0, GROUND, W, 3);

      // gold geometry pipes / blocks (decorative)
      ctx.fillStyle = "#d4af37";
      for (let i = 0; i < 4; i++) {
        const bx = ((i * 160 - s.camera * 0.6) % (W + 80)) + 40;
        ctx.fillRect(bx, GROUND - 48, 18, 48);
        ctx.fillRect(bx - 4, GROUND - 56, 26, 10);
      }

      // hazards
      for (const h of s.hazards) {
        if (h.kind === "pit") {
          ctx.fillStyle = "#050508";
          ctx.fillRect(h.x, GROUND, h.w, H - GROUND);
          ctx.strokeStyle = "rgba(255,0,170,0.5)";
          ctx.strokeRect(h.x, GROUND, h.w, 2);
        } else if (h.kind === "chip") {
          ctx.save();
          ctx.translate(h.x + h.w / 2, GROUND - h.h / 2);
          ctx.rotate(h.rolling ?? 0);
          ctx.fillStyle = "#c9a227";
          ctx.beginPath();
          ctx.arc(0, 0, h.w / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#07070c";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        } else {
          // spiked felt block
          ctx.fillStyle = "#1e3d2c";
          ctx.fillRect(h.x, GROUND - h.h, h.w, h.h);
          ctx.fillStyle = "#ff2bd6";
          const spikes = Math.max(2, Math.floor(h.w / 8));
          for (let i = 0; i < spikes; i++) {
            const sx = h.x + (i + 0.5) * (h.w / spikes);
            ctx.beginPath();
            ctx.moveTo(sx - 4, GROUND - h.h);
            ctx.lineTo(sx, GROUND - h.h - 10);
            ctx.lineTo(sx + 4, GROUND - h.h);
            ctx.fill();
          }
        }
      }

      // coins
      const flash = performance.now() < (coinFlash || 0);
      for (const c of s.coins) {
        if (c.taken) continue;
        ctx.fillStyle = flash ? "#00fff0" : "#5ef0ff";
        ctx.beginPath();
        ctx.arc(c.x + 7, c.y + 7, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#d4af37";
        ctx.stroke();
      }

      // player — geometric gold chip mascot + cream eyes
      const pcx = px + pw / 2;
      const pcy = py + ph / 2;
      ctx.fillStyle = "#d4af37";
      ctx.beginPath();
      ctx.arc(pcx, pcy, Math.min(pw, ph) / 2 + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f5f0e6";
      const eyeY = py + (s.ducking ? 4 : 8);
      ctx.beginPath();
      ctx.arc(px + 8, eyeY, 3, 0, Math.PI * 2);
      ctx.arc(px + 18, eyeY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#07070c";
      ctx.beginPath();
      ctx.arc(px + 9, eyeY, 1.2, 0, Math.PI * 2);
      ctx.arc(px + 19, eyeY, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // HUD
      ctx.fillStyle = "#ff2bd6";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("LIVE RUN", 12, 20);
      ctx.fillStyle = "#f5f0e6";
      ctx.font = "14px sans-serif";
      ctx.fillText(`Dist ${Math.floor(s.dist)}`, 100, 20);
      ctx.fillStyle = "#5ef0ff";
      ctx.fillText(`Coins ${s.coinCount}`, 210, 20);
      ctx.fillStyle = "#d4af37";
      ctx.fillText(`Stake ${s.stake}`, 300, 20);
      ctx.fillStyle = "rgba(245,240,230,0.75)";
      ctx.font = "11px sans-serif";
      ctx.fillText("400 even · 800×2 · 1500×3", 380, 20);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, paused, coinFlash]);

  function finish(distance: number, stake: number, coins: number) {
    if (mode === "h2h") {
      appendArcadeResult({
        id: arcadeUid("run"),
        gameId: "endless-runner",
        playedAt: new Date().toISOString(),
        stake: 0,
        payout: 0,
        outcome: "pending",
        detail: `Eastside Run dist ${Math.floor(distance)} · coins ${coins} · settle H2H manually`,
        meta: { distance, coins, mode },
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
      detail: `Eastside Run dist ${Math.floor(distance)} · coins ${coins} · prize ${label} → ${payout}`,
      meta: { distance, coins, prize: label },
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
      if (stake === null) {
        setNotice("Invalid stake.");
        return;
      }
      if (!canStake(stake, useBook.getState)) {
        setNotice("Bankroll too low.");
        return;
      }
      if (!spendStake(stake, useBook.getState, useBook.setState)) {
        setNotice("Could not lock.");
        return;
      }
    }
    g.current = {
      y: GROUND - PLAYER_H,
      vy: 0,
      onGround: true,
      ducking: false,
      coyote: 0,
      doubleReady: false,
      usedDouble: false,
      jumpHeld: false,
      hazards: [],
      coins: [],
      speed: 4.2,
      dist: 0,
      coinCount: 0,
      stake: mode === "solo" ? (stake ?? 0) : 0,
      alive: true,
      spawn: 600,
      coinSpawn: 400,
      parallax: 0,
      camera: 0,
    };
    setDist(0);
    setCoinsHud(0);
    setPaused(false);
    setRunning(true);
  }

  function onSwipeDuck(e: TouchEvent<HTMLCanvasElement>) {
    const t = e.changedTouches[0];
    const startY = (e.target as HTMLElement).dataset.sy;
    if (!startY) return;
    const dy = t.clientY - Number(startY);
    if (dy > 36) keys.current.duck = true;
  }

  if (!howtoReady) {
    return (
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Arcade</p>
            <h3 className="font-display text-2xl font-semibold text-cream">Eastside Run</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream"
          >
            Back
          </button>
        </div>
        <ArcadeHowTo {...HOW} gameId="endless-runner" onPlay={markReady} />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Arcade</p>
          <h3 className="font-display text-2xl font-semibold text-cream">Eastside Run</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream"
        >
          Back
        </button>
      </div>
      <ArcadeHowToExpandable {...HOW} gameId="endless-runner" />
      <p className="text-sm text-muted">
        Prize table (sim): 400 even · 800 ×2 · 1500 ×3. {ARCADE_SIM_DISCLAIMER}
      </p>
      <ul className="text-xs text-muted">
        {PRIZE_TABLE.map((r) => (
          <li key={r.minDist}>
            ≥{r.minDist} dist → {r.label} on buy-in
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("solo")}
          className={`min-h-11 rounded-full border px-4 text-sm ${
            mode === "solo" ? "border-gold bg-gold text-ink" : "border-gold/30 text-cream"
          }`}
        >
          Solo buy-in
        </button>
        <button
          type="button"
          onClick={() => setMode("h2h")}
          className={`min-h-11 rounded-full border px-4 text-sm ${
            mode === "h2h" ? "border-gold bg-gold text-ink" : "border-gold/30 text-cream"
          }`}
        >
          H2H E$L
        </button>
      </div>
      {mode === "solo" ? (
        <ArcadeStakeBar
          value={stakeStr}
          onChange={setStakeStr}
          bankroll={bankroll}
          disabled={running}
          error={notice}
        />
      ) : (
        <ArcadeH2HPanel
          gameId="endless-runner"
          termsExtra="Eastside Run high score duel · settle by distance"
          defaultStake="5"
        />
      )}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full max-w-xl touch-none rounded-[var(--radius-md)] border border-gold/30"
        style={{ background: "#07070c" }}
        onPointerDown={() => tryJump()}
        onTouchStart={(e) => {
          (e.currentTarget as HTMLElement).dataset.sy = String(e.touches[0].clientY);
        }}
        onTouchEnd={onSwipeDuck}
      />
      <div className="flex flex-wrap items-center gap-3 text-sm tabular-nums text-cream">
        <span>Distance {dist}</span>
        <span className="text-cyan-300">Coins {coinsHud}</span>
        {paused ? <span className="text-[#ff2bd6]">PAUSED</span> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {!running ? (
          <button
            type="button"
            onClick={start}
            className="min-h-11 rounded-full border border-gold bg-gold px-5 text-sm text-ink"
          >
            {dist ? "Run again" : "Start run"}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => tryJump()}
              className="min-h-11 min-w-[5.5rem] rounded-full border border-gold bg-gold px-5 text-sm font-semibold text-ink"
            >
              JUMP
            </button>
            <button
              type="button"
              onClick={() => {
                keys.current.duck = true;
                window.setTimeout(() => {
                  keys.current.duck = false;
                }, 280);
              }}
              className="min-h-11 rounded-full border border-gold/40 px-4 text-sm text-cream"
            >
              Duck
            </button>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="min-h-11 rounded-full border border-[#ff2bd6]/60 px-4 text-sm text-cream"
            >
              {paused ? "Resume" : "Pause"}
            </button>
          </>
        )}
      </div>
      {notice ? <p className="text-sm text-gold">{notice}</p> : null}
    </section>
  );
}
