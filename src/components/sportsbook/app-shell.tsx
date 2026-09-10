import { useEffect, useState } from "react";
import { AccountBar } from "@/components/sportsbook/account-bar";
import { Board } from "@/components/sportsbook/board";
import { BetSlip } from "@/components/sportsbook/bet-slip";
import { ChipCounter } from "@/components/sportsbook/chip-counter";
import { ClubHub } from "@/components/sportsbook/club-hub";
import { FantasyBoard } from "@/components/sportsbook/fantasy-board";
import { LeagueOffice, type LeagueSubTab } from "@/components/sportsbook/league-office";
import { MyBets } from "@/components/sportsbook/my-bets";
import { Ticker } from "@/components/sportsbook/ticker";
import { Button } from "@/components/ui/button";
import { STARTING_BANKROLL, useBook, type BookTab } from "@/lib/betting/store";
import { useBookFeeds } from "@/lib/feeds/use-feeds";
import type { ScoreBoard } from "@/lib/scores";
import { LayoutGrid, Trophy, Users, X, Building2 } from "lucide-react";

const TABS: { id: BookTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "board", label: "Board", icon: LayoutGrid },
  { id: "squad", label: "Squad", icon: Users },
  { id: "league", label: "League", icon: Trophy },
  { id: "club", label: "Club", icon: Building2 },
];

export function SportsbookApp({ initialScores }: { initialScores?: ScoreBoard }) {
  const feeds = useBookFeeds(initialScores);
  const tab = useBook((s) => s.tab);
  const setTab = useBook((s) => s.setTab);
  const slip = useBook((s) => s.slip);
  const slipOpen = useBook((s) => s.slipOpen);
  const setSlipOpen = useBook((s) => s.setSlipOpen);
  const slipPanel = useBook((s) => s.slipPanel);
  const setSlipPanel = useBook((s) => s.setSlipPanel);
  const storedBankroll = useBook((s) => s.bankroll);
  const [hydrated, setHydrated] = useState(false);
  const [leagueSub, setLeagueSub] = useState<LeagueSubTab>("standings");

  useEffect(() => {
    setHydrated(true);
    try {
      if (sessionStorage.getItem("eastside-open-chat") === "1") {
        sessionStorage.removeItem("eastside-open-chat");
        setTab("league");
        setLeagueSub("chat");
      }
    } catch {
      /* ignore */
    }
  }, [setTab]);

  const bankroll = hydrated ? storedBankroll : STARTING_BANKROLL;

  return (
    <div className="felt-bg min-h-dvh text-cream">
      <header className="border-b line-gold bg-void/95">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h1 className="font-display text-lg font-semibold uppercase tracking-[0.12em] text-cream sm:text-xl">
              Eastside Legends{" "}
              <span className="ml-1 inline-flex items-center rounded-[var(--radius-pill)] border border-gold/50 bg-gold/15 px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] text-gold">
                SIM
              </span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <AccountBar />
            <ChipCounter bankroll={bankroll} />
            <Button
              variant="gold"
              onClick={() => {
                setSlipPanel("slip");
                setSlipOpen(true);
              }}
            >
              Slip{slip.length ? ` (${slip.length})` : ""}
            </Button>
          </div>
        </div>

        {/* Desktop / tablet top pills */}
        <nav
          className="mx-auto hidden max-w-[1400px] gap-1 overflow-x-auto bg-void px-4 pb-3 sm:px-6 md:flex"
          aria-label="Primary"
        >
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-pill)] border px-4 text-sm ${
                  active
                    ? "border-gold bg-gold text-ink"
                    : "border-transparent text-muted hover:border-gold/30 hover:text-cream"
                }`}
              >
                <Icon className={`size-4 ${active ? "text-ink" : "text-muted"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Magenta LIVE ticker under header */}
      <div className="border-b border-neon-magenta/40">
        <Ticker scores={feeds.scores} />
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6">
        <main className="min-w-0 pb-28 md:pb-8">
          {tab === "board" ? <Board odds={feeds.odds} scores={feeds.scores} /> : null}
          {tab === "squad" ? <FantasyBoard /> : null}
          {tab === "league" ? <LeagueOffice initialSub={leagueSub} /> : null}
          {tab === "club" ? <ClubHub /> : null}
        </main>
      </div>

      {/* Mobile bottom nav — fixed void bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t line-gold bg-void/95 pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Primary mobile"
      >
        <div className="mx-auto flex max-w-[1400px] items-stretch justify-around gap-1 px-2 py-1.5">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-pill)] px-1 text-[10px] uppercase tracking-[0.12em] ${
                  active
                    ? "bg-gold/20 text-gold"
                    : "text-muted"
                }`}
              >
                <Icon className={`size-5 ${active ? "text-gold" : "text-muted"}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Slip peek when legs exist but sheet closed */}
      {!slipOpen && slip.length > 0 ? (
        <button
          type="button"
          onClick={() => {
            setSlipPanel("slip");
            setSlipOpen(true);
          }}
          className="fixed inset-x-0 z-30 mx-auto flex max-w-md items-center justify-between gap-3 rounded-t-[var(--radius-xl)] border line-gold bg-void px-4 py-3 text-sm text-cream shadow-lg bottom-[calc(3.5rem+env(safe-area-inset-bottom))] md:bottom-0"
        >
          <span>
            Slip <span className="text-gold tabular-nums">({slip.length})</span>
          </span>
          <span className="text-xs uppercase tracking-[0.16em] text-gold">Open</span>
        </button>
      ) : null}

      {slipOpen ? (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Close slip"
            className="absolute inset-0 bg-ink/70"
            onClick={() => setSlipOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[var(--radius-xl)] border-t line-gold bg-void p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div
                className="flex gap-1 rounded-[var(--radius-xl)] border line-gold bg-ink p-1"
                role="tablist"
                aria-label="Slip panels"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={slipPanel === "slip"}
                  className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.14em] ${
                    slipPanel === "slip" ? "bg-gold/20 text-gold" : "text-muted"
                  }`}
                  onClick={() => setSlipPanel("slip")}
                >
                  Slip
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={slipPanel === "tickets"}
                  className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.14em] ${
                    slipPanel === "tickets" ? "bg-gold/20 text-gold" : "text-muted"
                  }`}
                  onClick={() => setSlipPanel("tickets")}
                >
                  My tickets
                </button>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSlipOpen(false)} aria-label="Close">
                <X className="size-4" />
              </Button>
            </div>
            {slipPanel === "slip" ? <BetSlip scores={feeds.scores} /> : <MyBets scores={feeds.scores} />}
          </div>
        </div>
      ) : null}
    </div>
  );
}

