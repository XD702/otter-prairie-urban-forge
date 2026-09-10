/**
 * Shared Arcade how-to sheet + expandable help.
 * sessionStorage key: eastside-arcade-howto-${gameId}
 * Simulation only — not real money.
 */
import { useMemo, useState, type ReactNode } from "react";
import type { ArcadeGameId } from "@/lib/arcade/types";
import { ARCADE_SIM_DISCLAIMER } from "@/lib/arcade/types";

export type ArcadeHowToProps = {
  gameId: ArcadeGameId | string;
  title: string;
  goal: string;
  stakeRules: string;
  desktopControls: string;
  mobileControls: string;
  scoring?: string;
  /** 3–5 first-run steps */
  firstRunSteps: string[];
  onPlay: () => void;
};

export function arcadeHowToStorageKey(gameId: string): string {
  return `eastside-arcade-howto-${gameId}`;
}

export function hasArcadeHowToAck(gameId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(arcadeHowToStorageKey(gameId)) === "1";
  } catch {
    return false;
  }
}

export function ackArcadeHowTo(gameId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(arcadeHowToStorageKey(gameId), "1");
  } catch {
    /* private mode */
  }
}

/** Hook: gate play until Got it — Play once per session. */
export function useArcadeHowToGate(gameId: string) {
  const [ready, setReady] = useState(() => hasArcadeHowToAck(gameId));
  return {
    ready,
    markReady: () => {
      ackArcadeHowTo(gameId);
      setReady(true);
    },
  };
}

function ControlsBody({
  desktopControls,
  mobileControls,
  tab,
}: {
  desktopControls: string;
  mobileControls: string;
  tab: "desktop" | "mobile";
}) {
  return (
    <p className="text-sm text-cream">
      {tab === "desktop" ? desktopControls : mobileControls}
    </p>
  );
}

function Segmented({
  tab,
  onChange,
}: {
  tab: "desktop" | "mobile";
  onChange: (t: "desktop" | "mobile") => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-gold/35 p-1">
      {(["desktop", "mobile"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`min-h-11 min-w-[5.5rem] rounded-full px-4 text-xs font-semibold uppercase tracking-[0.18em] ${
            tab === t ? "bg-gold text-ink" : "text-cream hover:text-gold"
          }`}
        >
          {t === "desktop" ? "Desktop" : "Mobile"}
        </button>
      ))}
    </div>
  );
}

function HowToContent({
  goal,
  stakeRules,
  desktopControls,
  mobileControls,
  scoring,
  firstRunSteps,
  tab,
  onTab,
}: Omit<ArcadeHowToProps, "gameId" | "title" | "onPlay"> & {
  tab: "desktop" | "mobile";
  onTab: (t: "desktop" | "mobile") => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Goal</p>
        <p className="mt-1 text-sm text-cream">{goal}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Stake</p>
        <p className="mt-1 text-sm text-cream">{stakeRules}</p>
      </div>
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Controls</p>
        <Segmented tab={tab} onChange={onTab} />
        <ControlsBody
          desktopControls={desktopControls}
          mobileControls={mobileControls}
          tab={tab}
        />
      </div>
      {scoring ? (
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Scoring</p>
          <p className="mt-1 text-sm text-cream">{scoring}</p>
        </div>
      ) : null}
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-gold">First run</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-cream">
          {firstRunSteps.slice(0, 5).map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
      <p className="text-[10px] text-muted">{ARCADE_SIM_DISCLAIMER}</p>
    </div>
  );
}

/** Full sheet — show before first play each session. */
export function ArcadeHowTo(props: ArcadeHowToProps) {
  const [tab, setTab] = useState<"desktop" | "mobile">("desktop");
  return (
    <div
      className="rounded-[var(--radius-lg)] border border-gold/40 p-4 sm:p-5"
      style={{
        background:
          "radial-gradient(ellipse at top, rgba(212,175,55,0.12), transparent 55%), #07070c",
        boxShadow: "0 0 24px rgba(212,175,55,0.18), inset 0 0 0 1px rgba(255,0,200,0.12)",
      }}
    >
      <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">
        How to play
      </p>
      <h3 className="mt-1 font-display text-2xl font-semibold text-cream">{props.title}</h3>
      <div className="mt-4">
        <HowToContent {...props} tab={tab} onTab={setTab} />
      </div>
      <button
        type="button"
        onClick={props.onPlay}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-gold bg-gold px-5 text-sm font-semibold uppercase tracking-[0.16em] text-ink sm:w-auto"
      >
        Got it — Play
      </button>
    </div>
  );
}

/** Always-available expandable help after first-run ack. */
export function ArcadeHowToExpandable(props: Omit<ArcadeHowToProps, "onPlay">) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"desktop" | "mobile">("desktop");
  return (
    <div className="rounded-[var(--radius-lg)] border border-gold/25 bg-ink/50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left text-sm text-cream"
      >
        <span className="font-display text-xs uppercase tracking-[0.22em] text-gold">
          How to play
        </span>
        <span className="text-muted">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? (
        <div className="border-t border-gold/20 px-4 pb-4 pt-3">
          <HowToContent {...props} tab={tab} onTab={setTab} />
        </div>
      ) : null}
    </div>
  );
}

/** Gate: sheet until ack, then expandable + children. */
export function ArcadeHowToGate({
  howTo,
  onClose,
  children,
}: {
  howTo: Omit<ArcadeHowToProps, "onPlay">;
  onClose?: () => void;
  children: ReactNode;
}) {
  const { ready, markReady } = useArcadeHowToGate(howTo.gameId);
  const header = useMemo(
    () => (
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Arcade</p>
          <h3 className="font-display text-2xl font-semibold text-cream">{howTo.title}</h3>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream hover:border-gold"
          >
            Back
          </button>
        ) : null}
      </div>
    ),
    [howTo.title, onClose],
  );

  if (!ready) {
    return (
      <section className="space-y-4">
        {header}
        <ArcadeHowTo {...howTo} onPlay={markReady} />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {header}
      <ArcadeHowToExpandable {...howTo} />
      {children}
    </section>
  );
}

/** Canonical control copy + first-run steps per game. */
export const ARCADE_HOWTO_COPY: Record<
  ArcadeGameId,
  Omit<ArcadeHowToProps, "gameId" | "onPlay">
> = {
  pickem: {
    title: "NFL Quick Pick'em",
    goal: "Pick the winner (away or home) on posted odds-board games.",
    stakeRules: "Solo stake vs house (E$L coin$). Grades when the NFL score is final.",
    desktopControls: "Click away or home on each game row.",
    mobileControls: "Tap the team you want to win.",
    scoring: "Even money when graded won; push refunds; pending until final.",
    firstRunSteps: [
      "Set an optional stake (0 allowed).",
      "Pick away or home on one or more games.",
      "Lock picks — stake spends from the Board bankroll.",
      "Wait for final scores to grade.",
    ],
  },
  "higher-lower": {
    title: "Higher / Lower",
    goal: "Guess whether the next card’s number is higher or lower — 3 rounds.",
    stakeRules: "Solo stake vs house. Win session with 2+ correct (even money).",
    desktopControls: "Tap Higher or Lower. Skip missing data — nothing is invented.",
    mobileControls: "Tap Higher or Lower. Skip missing data — nothing is invented.",
    scoring: "3 rounds; ≥2 correct wins even money.",
    firstRunSteps: [
      "Confirm cards exist (spread or projectedPts).",
      "Set stake and start 3 rounds.",
      "Compare B to A each round.",
      "Session settles when rounds finish.",
    ],
  },
  "speed-trivia": {
    title: "Speed Trivia",
    goal: "Answer as many NFL history questions as you can in 60 seconds.",
    stakeRules: "Solo stake vs house. Win with ≥60% correct and ≥3 answered (even money).",
    desktopControls: "Tap an answer. 60s clock. NFL history / famous games / records only.",
    mobileControls: "Tap an answer. 60s clock. NFL history / famous games / records only.",
    scoring: "≥60% correct with at least 3 answered → even money win.",
    firstRunSteps: [
      "Set stake (0 allowed).",
      "Start the 60s run.",
      "Tap answers quickly.",
      "Settle when time ends or the pack runs out.",
    ],
  },
  "matchup-dodge": {
    title: "Matchup Dodge",
    goal: "Pick a survivor side in a Week 1 fantasy matchup.",
    stakeRules: "Solo stake vs house (pending) or H2H E$L challenge.",
    desktopControls: "Pick a survivor side (team A or B). Solo or H2H.",
    mobileControls: "Tap a survivor side. Solo or H2H.",
    firstRunSteps: [
      "Choose Solo or H2H.",
      "Pick team A or B.",
      "Lock solo stake or propose an E$L challenge.",
      "Solo stays pending without real scores.",
    ],
  },
  pong: {
    title: "Pong",
    goal: "Beat the CPU (or settle H2H) — first to 5.",
    stakeRules: "Solo stake vs CPU house, or H2H E$L side-bet.",
    desktopControls: "W/S or arrow keys move your paddle. First to 5.",
    mobileControls: "Drag paddle / stick on the canvas. First to 5.",
    scoring: "First to 5 points wins.",
    firstRunSteps: [
      "Pick Vs CPU or H2H.",
      "Set stake if Solo.",
      "Press Start.",
      "First paddle to 5 wins the round.",
    ],
  },
  chess: {
    title: "Chess",
    goal: "Checkmate (thin local rules) vs CPU or local 2P.",
    stakeRules: "Optional Solo stake vs CPU or H2H E$L challenge.",
    desktopControls: "Click a piece, then click a destination square. CPU or local 2P.",
    mobileControls: "Tap a piece, then tap a destination square. CPU or local 2P.",
    firstRunSteps: [
      "Choose CPU or local 2P / H2H.",
      "Lock optional stake.",
      "Move pieces legally.",
      "Capture the king to end (thin engine).",
    ],
  },
  "tic-tac-toe": {
    title: "Tic-Tac-Toe",
    goal: "Get three in a row vs CPU or local 1v1.",
    stakeRules: "Optional Solo stake or H2H E$L.",
    desktopControls: "Tap a cell to place your mark.",
    mobileControls: "Tap a cell to place your mark.",
    firstRunSteps: [
      "Choose CPU or 1v1 / H2H.",
      "Lock optional stake.",
      "Tap empty cells.",
      "Three in a row wins.",
    ],
  },
  "coin-toss": {
    title: "Coin Toss Flick",
    goal: "Call heads or tails, charge the flick, release.",
    stakeRules: "House stake max 5 E$L coin$, or H2H 1–5.",
    desktopControls: "Hold charge + release. Watch the power meter for help.",
    mobileControls: "Hold charge + release. Watch the power meter for help.",
    scoring: "Even money if your call matches the face.",
    firstRunSteps: [
      "Pick heads or tails.",
      "Set stake (house max 5).",
      "Hold charge to fill the power meter.",
      "Release to flick and settle.",
    ],
  },
  "endless-runner": {
    title: "Eastside Run",
    goal: "Run as far as you can, collect coins, clear hazards.",
    stakeRules: "Solo buy-in prize table: 400 even · 800×2 · 1500×3. Optional H2H.",
    desktopControls: "Space / ↑ jump (hold for higher). ↓ duck. Esc pause.",
    mobileControls: "JUMP button + tap to jump. Swipe down to duck. Pause button.",
    scoring: "Distance prizes on buy-in: ≥400 even, ≥800 ×2, ≥1500 ×3.",
    firstRunSteps: [
      "Set Solo buy-in or open H2H.",
      "Tap Got it — Play, then Start run.",
      "Jump pits and spiked blocks; collect cyan coins.",
      "Optional short double-jump after a coin.",
      "Reach prize distance tiers before a wipeout.",
    ],
  },
  plinko: {
    title: "Eastside Plinko",
    goal: "Drop a chip down the pegs into a multiplier slot.",
    stakeRules: "Solo stake only. Payout = stake × slot (0 / 0.5 / 1 / 2 / 5).",
    desktopControls: "Tap a lane at the top to drop the chip.",
    mobileControls: "Tap a lane at the top to drop the chip.",
    scoring: "Slot multipliers: 0 · 0.5 · 1 · 2 · 5 (sim).",
    firstRunSteps: [
      "Set Solo stake.",
      "Tap a drop lane.",
      "Watch the chip bounce through pegs.",
      "Settle when it lands in a multiplier slot.",
    ],
  },
  "neon-wheel": {
    title: "Neon Wheel",
    goal: "Spin the neon wheel for a multiplier.",
    stakeRules: "Solo stake only. Results: 0 / even / ×2 / ×3.",
    desktopControls: "Tap SPIN to start the wheel.",
    mobileControls: "Tap SPIN to start the wheel.",
    scoring: "0 loses stake · even returns stake · ×2 / ×3 credit mult×stake.",
    firstRunSteps: [
      "Set Solo stake.",
      "Tap SPIN.",
      "Wait for the wheel to stop.",
      "Bankroll updates from the landed segment.",
    ],
  },
};
