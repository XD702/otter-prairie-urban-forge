/**
 * Eastside Arcade hub — After Dark felt-floor cabinet.
 * Void bg, gold accents, neon. Simulation only — not real money.
 * Currency: E$L coin$ (same STARTING_BANKROLL=100 as Board).
 */
import { useMemo, useState } from "react";
import { useBook, STARTING_BANKROLL } from "@/lib/betting/store";
import { useBookFeeds } from "@/lib/feeds/use-feeds";
import { loadArcadeHistory } from "@/lib/arcade/history";
import {
  ARCADE_CURRENCY,
  ARCADE_GAME_META,
  ARCADE_SIM_DISCLAIMER,
  type ArcadeGameId,
  type ArcadeResult,
} from "@/lib/arcade/types";
import { PickemGame } from "@/components/sportsbook/arcade/pickem";
import { HigherLowerGame } from "@/components/sportsbook/arcade/higher-lower";
import { SpeedTriviaGame } from "@/components/sportsbook/arcade/speed-trivia";
import { MatchupDodgeGame } from "@/components/sportsbook/arcade/matchup-dodge";
import { PongGame } from "@/components/sportsbook/arcade/pong";
import { ChessGame } from "@/components/sportsbook/arcade/chess";
import { TicTacToeGame } from "@/components/sportsbook/arcade/tic-tac-toe";
import { CoinTossGame } from "@/components/sportsbook/arcade/coin-toss";
import { EndlessRunnerGame } from "@/components/sportsbook/arcade/endless-runner";
import { PlinkoGame } from "@/components/sportsbook/arcade/plinko";
import { NeonWheelGame } from "@/components/sportsbook/arcade/neon-wheel";

const SPORTS: ArcadeGameId[] = [
  "pickem",
  "higher-lower",
  "speed-trivia",
  "matchup-dodge",
];
const CLASSICS: ArcadeGameId[] = [
  "pong",
  "chess",
  "tic-tac-toe",
  "coin-toss",
  "endless-runner",
];
const NEW_GAMES: ArcadeGameId[] = ["plinko", "neon-wheel"];

function bestScoreFor(gameId: ArcadeGameId, history: ArcadeResult[]): string | null {
  const rows = history.filter((h) => h.gameId === gameId);
  if (!rows.length) return null;
  if (gameId === "endless-runner") {
    const d = Math.max(0, ...rows.map((r) => Number(r.meta?.distance ?? 0)));
    return d > 0 ? `Best ${Math.floor(d)}` : null;
  }
  if (gameId === "speed-trivia") {
    const c = Math.max(0, ...rows.map((r) => Number(r.meta?.correct ?? 0)));
    return c > 0 ? `Best ${c} correct` : null;
  }
  if (gameId === "plinko" || gameId === "neon-wheel") {
    const m = Math.max(0, ...rows.map((r) => Number(r.meta?.mult ?? 0)));
    return m > 0 ? `Best ×${m}` : null;
  }
  const wins = rows.filter((r) => r.outcome === "won").length;
  return wins > 0 ? `${wins} win${wins === 1 ? "" : "s"}` : null;
}

export function ArcadeHub() {
  const feeds = useBookFeeds();
  const bankroll = useBook((s) => s.bankroll);
  const [open, setOpen] = useState<ArcadeGameId | null>(null);
  const history = useMemo(() => loadArcadeHistory().slice(0, 8), [open, bankroll]);
  const fullHistory = useMemo(() => loadArcadeHistory(), [open, bankroll]);

  if (open === "pickem") {
    return (
      <PickemGame
        odds={feeds.odds}
        scores={feeds.scores}
        onClose={() => setOpen(null)}
      />
    );
  }
  if (open === "higher-lower") {
    return (
      <HigherLowerGame
        odds={feeds.odds}
        roster={feeds.roster}
        onClose={() => setOpen(null)}
      />
    );
  }
  if (open === "speed-trivia") {
    return <SpeedTriviaGame onClose={() => setOpen(null)} />;
  }
  if (open === "matchup-dodge") {
    return <MatchupDodgeGame onClose={() => setOpen(null)} />;
  }
  if (open === "pong") return <PongGame onClose={() => setOpen(null)} />;
  if (open === "chess") return <ChessGame onClose={() => setOpen(null)} />;
  if (open === "tic-tac-toe") return <TicTacToeGame onClose={() => setOpen(null)} />;
  if (open === "coin-toss") return <CoinTossGame onClose={() => setOpen(null)} />;
  if (open === "endless-runner") {
    return <EndlessRunnerGame onClose={() => setOpen(null)} />;
  }
  if (open === "plinko") return <PlinkoGame onClose={() => setOpen(null)} />;
  if (open === "neon-wheel") return <NeonWheelGame onClose={() => setOpen(null)} />;

  return (
    <section
      className="space-y-6 rounded-[var(--radius-lg)] p-4 sm:p-5"
      style={{
        background:
          "radial-gradient(ellipse at top left, rgba(255,43,214,0.08), transparent 45%), radial-gradient(ellipse at bottom right, rgba(94,240,255,0.06), transparent 40%), #07070c",
        boxShadow: "inset 0 0 0 1px rgba(212,175,55,0.22)",
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">
            After Dark · Felt Floor
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-cream">
            Arcade Cabinet
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Sports · Classics · New. Solo stakes use the Board bankroll (
            {STARTING_BANKROLL} start). H2H uses the E$L challenges ledger.{" "}
            {ARCADE_SIM_DISCLAIMER}
          </p>
        </div>
        <div
          className="rounded-full border border-gold/40 px-4 py-2"
          style={{
            background: "rgba(10,10,16,0.9)",
            boxShadow: "0 0 16px rgba(212,175,55,0.25)",
          }}
        >
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Bankroll</p>
          <p className="font-display text-xl tabular-nums text-cream">
            {bankroll}{" "}
            <span className="text-xs text-muted">{ARCADE_CURRENCY}</span>
          </p>
        </div>
      </div>

      <Group title="Sports" ids={SPORTS} onOpen={setOpen} history={fullHistory} />
      <Group title="Classics" ids={CLASSICS} onOpen={setOpen} history={fullHistory} />
      <Group title="New" ids={NEW_GAMES} onOpen={setOpen} history={fullHistory} />

      <div
        className="rounded-[var(--radius-lg)] border border-gold/25 p-4"
        style={{ background: "rgba(12,12,18,0.85)" }}
      >
        <p className="font-display text-xs uppercase tracking-[0.22em] text-gold">
          Recent plays
        </p>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No plays yet — pick a cabinet card.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-cream">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap gap-2 text-muted">
                <span className="text-cream">{ARCADE_GAME_META[h.gameId]?.title ?? h.gameId}</span>
                <span className="tabular-nums text-[#ff2bd6]">{h.outcome}</span>
                <span className="tabular-nums">
                  stake {h.stake} · pay {h.payout}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[10px] text-muted">{ARCADE_SIM_DISCLAIMER}</p>
      </div>
    </section>
  );
}

function Group({
  title,
  ids,
  onOpen,
  history,
}: {
  title: string;
  ids: ArcadeGameId[];
  onOpen: (id: ArcadeGameId) => void;
  history: ArcadeResult[];
}) {
  return (
    <div>
      <p className="mb-3 font-display text-xs uppercase tracking-[0.28em] text-gold">
        {title}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ids.map((id) => {
          const meta = ARCADE_GAME_META[id];
          const best = bestScoreFor(id, history);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onOpen(id)}
              className="group rounded-[var(--radius-lg)] border border-gold/30 p-4 text-left transition hover:border-gold hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              style={{
                background:
                  "linear-gradient(160deg, rgba(18,18,28,0.95), rgba(7,7,12,0.98))",
              }}
            >
              <div className="flex flex-wrap gap-1.5">
                {meta.badges.map((b) => (
                  <span
                    key={b}
                    className="rounded-full border border-gold/35 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-gold"
                  >
                    {b}
                  </span>
                ))}
              </div>
              <p className="mt-2 font-display text-lg text-cream group-hover:text-gold">
                {meta.title}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{meta.blurb}</p>
              {best ? (
                <p className="mt-2 text-xs tabular-nums text-[#5ef0ff]">{best}</p>
              ) : (
                <p className="mt-2 text-xs text-muted/80">No local best yet</p>
              )}
              <span className="mt-3 inline-flex min-h-11 items-center rounded-full border border-gold bg-gold px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink">
                Play
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
