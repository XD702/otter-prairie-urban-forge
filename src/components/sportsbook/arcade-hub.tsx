/**
 * Eastside Arcade hub — sports mini-games + classics.
 * Gold/felt sportsbook style. Simulation only — not real money.
 * Currency: E$L coin$ (same STARTING_BANKROLL=100 as Board).
 */
import { useMemo, useState } from "react";
import { Gamepad2 } from "lucide-react";
import { useBook, STARTING_BANKROLL } from "@/lib/betting/store";
import { useBookFeeds } from "@/lib/feeds/use-feeds";
import { loadArcadeHistory } from "@/lib/arcade/history";
import {
  ARCADE_CURRENCY,
  ARCADE_GAME_META,
  ARCADE_SIM_DISCLAIMER,
  type ArcadeGameId,
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

export function ArcadeHub() {
  const feeds = useBookFeeds();
  const bankroll = useBook((s) => s.bankroll);
  const [open, setOpen] = useState<ArcadeGameId | null>(null);
  const history = useMemo(() => loadArcadeHistory().slice(0, 8), [open, bankroll]);

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

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">
            After Dark
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-cream">
            Arcade
          </h2>
          <p className="mt-1 text-sm text-muted">
            Sports pick games + classics. Solo stakes use the Board bankroll (
            {STARTING_BANKROLL} start). H2H uses the E$L challenges ledger.{" "}
            {ARCADE_SIM_DISCLAIMER}
          </p>
        </div>
        <div className="surface-ink rounded-[var(--radius-lg)] px-4 py-2">
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold">{ARCADE_CURRENCY}</p>
          <p className="font-display text-2xl tabular-nums text-cream">
            {bankroll} {ARCADE_CURRENCY}
          </p>
        </div>
      </div>

      <Group title="Sports" ids={SPORTS} onOpen={setOpen} />
      <Group title="Classics" ids={CLASSICS} onOpen={setOpen} />

      <div className="surface-ink rounded-[var(--radius-lg)] p-4">
        <p className="font-display text-xs uppercase tracking-[0.22em] text-gold">
          Recent (local)
        </p>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No plays yet.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-cream">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap gap-2 text-muted">
                <span className="text-cream">{ARCADE_GAME_META[h.gameId].title}</span>
                <span className="tabular-nums">{h.outcome}</span>
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
}: {
  title: string;
  ids: ArcadeGameId[];
  onOpen: (id: ArcadeGameId) => void;
}) {
  return (
    <div>
      <p className="mb-3 font-display text-xs uppercase tracking-[0.28em] text-gold">
        {title}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ids.map((id) => {
          const meta = ARCADE_GAME_META[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => onOpen(id)}
              className="surface-ink rounded-[var(--radius-lg)] p-4 text-left transition hover:border-gold/50 hover:bg-ink"
            >
              <div className="mb-2 flex items-center gap-2 text-gold">
                <Gamepad2 className="size-4" />
                <span className="font-display text-lg text-cream">{meta.title}</span>
              </div>
              <p className="text-sm text-muted">{meta.blurb}</p>
              <span className="mt-3 inline-flex rounded-[var(--radius-pill)] bg-gold px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink">
                Open
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
