/**
 * Coin Toss Flick — timing/flick vs house or friend (1–5 E$L H2H).
 * Simulation only — not real money. No NFL invent.
 */
import { useRef, useState } from "react";
import { useBook } from "@/lib/betting/store";
import { canStake, creditWin, spendStake } from "@/lib/arcade/bankroll";
import { appendArcadeResult } from "@/lib/arcade/history";
import { ARCADE_SIM_DISCLAIMER, arcadeUid, parseStake } from "@/lib/arcade/types";
import { ArcadeStakeBar } from "./stake-bar";
import { ArcadeH2HPanel } from "./h2h-panel";

type Face = "heads" | "tails";

export function CoinTossGame({ onClose }: { onClose: () => void }) {
  const bankroll = useBook((s) => s.bankroll);
  const [mode, setMode] = useState<"house" | "h2h">("house");
  const [call, setCall] = useState<Face>("heads");
  const [stakeStr, setStakeStr] = useState("0");
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Face | null>(null);
  const [power, setPower] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const raf = useRef<number | null>(null);
  const dir = useRef(1);

  function startPower() {
    if (spinning) return;
    setResult(null);
    const tick = () => {
      setPower((p) => {
        let n = p + dir.current * 2;
        if (n >= 100) { dir.current = -1; n = 100; }
        if (n <= 0) { dir.current = 1; n = 0; }
        return n;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  function flick() {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    if (mode === "h2h") {
      setNotice("H2H: use the challenge panel for stakes; flick is for fun / local reveal.");
    }
    const stake = parseStake(stakeStr);
    if (mode === "house") {
      if (stake === null) {
        setNotice("Invalid stake.");
        return;
      }
      if (stake > 5) {
        setNotice("House coin toss stake max 5 E$L coin$.");
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
    }
    setSpinning(true);
    // Timing bias: mid-power (~50) is fairest; extremes slightly noise — still 50/50 face
    const face: Face = Math.random() < 0.5 ? "heads" : "tails";
    window.setTimeout(() => {
      setResult(face);
      setSpinning(false);
      if (mode === "house") {
        const stakeN = parseStake(stakeStr) ?? 0;
        const won = face === call;
        let payout = 0;
        let outcome: "won" | "lost" = "lost";
        if (won) {
          creditWin(stakeN, useBook.getState, useBook.setState);
          payout = stakeN;
          outcome = "won";
        }
        appendArcadeResult({
          id: arcadeUid("coin"),
          gameId: "coin-toss",
          playedAt: new Date().toISOString(),
          stake: stakeN,
          payout,
          outcome,
          detail: `Called ${call}, got ${face} · power ${power} · ${outcome}`,
          meta: { call, face, power },
        });
        setNotice(won ? "Even money win." : "Loss — stake kept.");
      }
    }, 700 + power * 8);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Arcade</p>
          <h3 className="font-display text-2xl font-semibold text-cream">Coin Toss Flick</h3>
        </div>
        <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream">Back</button>
      </div>
      <p className="text-sm text-muted">
        Hold to charge, release to flick. Vs house (0–5) or friend H2H (1–5 E$L). {ARCADE_SIM_DISCLAIMER}
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setMode("house")} className={`min-h-11 rounded-full border px-4 text-sm ${mode === "house" ? "border-gold bg-gold text-ink" : "border-gold/30 text-cream"}`}>Vs house</button>
        <button type="button" onClick={() => setMode("h2h")} className={`min-h-11 rounded-full border px-4 text-sm ${mode === "h2h" ? "border-gold bg-gold text-ink" : "border-gold/30 text-cream"}`}>H2H 1–5 E$L</button>
      </div>
      <div className="flex gap-2">
        {(["heads", "tails"] as Face[]).map((f) => (
          <button key={f} type="button" onClick={() => setCall(f)} className={`min-h-11 rounded-full border px-4 capitalize text-sm ${call === f ? "border-gold bg-gold text-ink" : "border-gold/30 text-cream"}`}>{f}</button>
        ))}
      </div>
      {mode === "house" ? (
        <ArcadeStakeBar value={stakeStr} onChange={setStakeStr} bankroll={bankroll} error={notice} />
      ) : (
        <ArcadeH2HPanel gameId="coin-toss" termsExtra={`call:${call} · 1–5 E$L`} defaultStake="1" stakeHint="Friend H2H stake 1–5 E$L coin$ (RPC requires > 0)." />
      )}
      <div className="h-3 overflow-hidden rounded-full border border-gold/30 bg-ink/50">
        <div className="h-full bg-gold transition-[width]" style={{ width: `${power}%` }} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onMouseDown={startPower} onTouchStart={startPower} className="min-h-11 rounded-full border border-gold/40 px-4 text-sm text-cream">Hold charge</button>
        <button type="button" disabled={spinning} onClick={flick} className="min-h-11 rounded-full border border-gold bg-gold px-5 text-sm text-ink disabled:opacity-50">Flick</button>
      </div>
      <div className={`mx-auto flex size-28 items-center justify-center rounded-full border-4 border-gold bg-ink/60 font-display text-xl text-gold ${spinning ? "animate-spin" : ""}`}>
        {spinning ? "…" : result ? result.toUpperCase() : "COIN"}
      </div>
      {notice && mode === "h2h" ? <p className="text-sm text-cream">{notice}</p> : null}
    </section>
  );
}
