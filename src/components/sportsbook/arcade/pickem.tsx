/**
 * NFL Quick Pick'em — pick away/home from odds board games.
 * Grade later from scores when final; else pending.
 * Solo stake vs house (spend on lock). Simulation only — not real money.
 */
import { useMemo, useState } from "react";
import { useBook } from "@/lib/betting/store";
import { canStake, creditWin, spendStake } from "@/lib/arcade/bankroll";
import { appendArcadeResult, updateArcadeResult, loadArcadeHistory } from "@/lib/arcade/history";
import {
  ARCADE_SIM_DISCLAIMER,
  arcadeUid,
  parseStake,
  type ArcadeResult,
} from "@/lib/arcade/types";
import { peekOddsBoard, type GameLine, type OddsBoard } from "@/lib/odds";
import { peekScoreBoard, type GameScore, type ScoreBoard } from "@/lib/scores";
import { ArcadeStakeBar } from "./stake-bar";
import {
  ARCADE_HOWTO_COPY,
  ArcadeHowTo,
  ArcadeHowToExpandable,
  useArcadeHowToGate,
} from "./arcade-how-to";


type PickSide = "away" | "home";

function gradePick(
  pick: PickSide,
  score: GameScore | undefined,
): "pending" | "won" | "lost" | "push" {
  if (!score || score.phase !== "final") return "pending";
  if (score.homeScore == null || score.awayScore == null) return "pending";
  if (score.homeScore === score.awayScore) return "push";
  const homeWon = score.homeScore > score.awayScore;
  if (pick === "home") return homeWon ? "won" : "lost";
  return homeWon ? "lost" : "won";
}

function settlePending(scores: ScoreBoard) {
  const byId = new Map(scores.games.map((g) => [g.gameId, g]));
  const get = useBook.getState;
  const set = useBook.setState;
  for (const row of loadArcadeHistory()) {
    if (row.gameId !== "pickem" || row.outcome !== "pending") continue;
    const gameId = String(row.meta?.nflGameId ?? "");
    const pick = row.meta?.pick as PickSide | undefined;
    if (!gameId || !pick) continue;
    const outcome = gradePick(pick, byId.get(gameId));
    if (outcome === "pending") continue;
    let payout = 0;
    if (outcome === "won" || outcome === "push") {
      creditWin(row.stake, get, set);
      payout = row.stake;
    }
    updateArcadeResult(row.id, {
      outcome,
      payout,
      detail: `${row.detail} · graded ${outcome}`,
    });
  }
}

export function PickemGame({
  odds: oddsProp,
  scores: scoresProp,
  onClose,
}: {
  odds?: OddsBoard;
  scores?: ScoreBoard;
  onClose: () => void;
}) {
  const { ready: howtoReady, markReady } = useArcadeHowToGate("pickem");
  const HOW = ARCADE_HOWTO_COPY["pickem"];
  const odds = oddsProp ?? peekOddsBoard();
  const scores = scoresProp ?? peekScoreBoard();
  const bankroll = useBook((s) => s.bankroll);
  const [stakeStr, setStakeStr] = useState("0");
  const [picks, setPicks] = useState<Record<string, PickSide>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [locked, setLocked] = useState<ArcadeResult[]>([]);

  const games = odds.status === "ready" ? odds.games : [];
  const scoreById = useMemo(
    () => new Map(scores.games.map((g) => [g.gameId, g])),
    [scores],
  );

  function lockPicks() {
    setNotice(null);
    const stake = parseStake(stakeStr);
    if (stake === null) {
      setNotice("Enter a valid stake (0 allowed).");
      return;
    }
    const entries = Object.entries(picks);
    if (entries.length === 0) {
      setNotice("Pick at least one game (away or home).");
      return;
    }
    const total = Math.round(stake * entries.length * 100) / 100;
    if (!canStake(total, useBook.getState)) {
      setNotice("Bankroll too low for that stake × picks.");
      return;
    }
    const created: ArcadeResult[] = [];
    for (const [gameId, pick] of entries) {
      const g = games.find((x) => x.id === gameId);
      if (!g) continue;
      if (!spendStake(stake, useBook.getState, useBook.setState)) {
        setNotice("Could not lock stake — bankroll changed.");
        break;
      }
      const outcome = gradePick(pick, scoreById.get(gameId));
      let payout = 0;
      if (outcome === "won" || outcome === "push") {
        creditWin(stake, useBook.getState, useBook.setState);
        payout = stake;
      }
      const result: ArcadeResult = {
        id: arcadeUid("pickem"),
        gameId: "pickem",
        playedAt: new Date().toISOString(),
        stake,
        payout,
        outcome,
        detail: `${g.away} @ ${g.home} · pick ${pick}`,
        meta: { nflGameId: gameId, pick },
      };
      appendArcadeResult(result);
      created.push(result);
    }
    setLocked(created);
    settlePending(scores);
    setPicks({});
  }

  if (!howtoReady) {
    return (
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Arcade</p>
            <h3 className="font-display text-2xl font-semibold text-cream">NFL Quick Pick'em</h3>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream">Back</button>
        </div>
        <ArcadeHowTo {...HOW} gameId="pickem" onPlay={markReady} />
      </section>
    );
  }

  if (games.length === 0) {
    return (
      <section className="space-y-4">
        <Header title="NFL Quick Pick'em" onClose={onClose} />
        <ArcadeHowToExpandable {...HOW} gameId="pickem" />
        <Empty
          title="No odds board games"
          detail={
            odds.reason ??
            "Odds feed is empty. Pick'em stays empty until real lines load. No numbers invented."
          }
        />
        <p className="text-[10px] text-muted">{ARCADE_SIM_DISCLAIMER}</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <Header title="NFL Quick Pick'em" onClose={onClose} />
      <ArcadeHowToExpandable {...HOW} gameId="pickem" />
      <p className="text-sm text-muted">
        Pick away or home. Stake spent on lock (per pick). Graded from scores when final;
        otherwise pending. Even money on win; push refunds. {ARCADE_SIM_DISCLAIMER}
      </p>
      <ArcadeStakeBar
        value={stakeStr}
        onChange={setStakeStr}
        bankroll={bankroll}
        error={notice}
      />
      <ul className="space-y-2">
        {games.map((g) => (
          <PickRow
            key={g.id}
            game={g}
            pick={picks[g.id]}
            score={scoreById.get(g.id)}
            onPick={(side) =>
              setPicks((prev) => {
                const next = { ...prev };
                if (next[g.id] === side) delete next[g.id];
                else next[g.id] = side;
                return next;
              })
            }
          />
        ))}
      </ul>
      <button
        type="button"
        onClick={lockPicks}
        className="inline-flex min-h-11 items-center rounded-full border border-gold bg-gold px-5 text-sm font-medium text-ink"
      >
        Lock picks
      </button>
      {locked.length > 0 ? (
        <div className="rounded-[var(--radius-md)] border border-gold/20 bg-ink/30 p-3 text-sm text-cream">
          Locked {locked.length} pick(s). Check history for pending / graded.
        </div>
      ) : null}
    </section>
  );
}

function PickRow({
  game,
  pick,
  score,
  onPick,
}: {
  game: GameLine;
  pick?: PickSide;
  score?: GameScore;
  onPick: (s: PickSide) => void;
}) {
  const phase = score?.phase ?? "—";
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-gold/15 bg-ink/30 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-cream">
          {game.away} @ {game.home}
        </p>
        <p className="text-[10px] text-muted">Score phase: {phase}</p>
      </div>
      <SideBtn active={pick === "away"} label={`${game.away} (away)`} onClick={() => onPick("away")} />
      <SideBtn active={pick === "home"} label={`${game.home} (home)`} onClick={() => onPick("home")} />
    </li>
  );
}

function SideBtn({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-full border px-3 text-xs ${
        active ? "border-gold bg-gold text-ink" : "border-gold/30 text-cream hover:border-gold/60"
      }`}
    >
      {label}
    </button>
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">Arcade</p>
        <h3 className="font-display text-2xl font-semibold text-cream">{title}</h3>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="min-h-11 rounded-full border border-gold/30 px-4 text-sm text-cream hover:border-gold"
      >
        Back
      </button>
    </div>
  );
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-gold/20 bg-ink/40 p-5">
      <p className="font-display text-lg text-cream">{title}</p>
      <p className="mt-2 text-sm text-muted">{detail}</p>
    </div>
  );
}
