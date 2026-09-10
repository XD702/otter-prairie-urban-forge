import { useEffect, useState } from "react";
import { AccountBar } from "@/components/sportsbook/account-bar";
import { Board } from "@/components/sportsbook/board";
import { BetSlip } from "@/components/sportsbook/bet-slip";
import { ChipCounter } from "@/components/sportsbook/chip-counter";
import { FantasyBoard } from "@/components/sportsbook/fantasy-board";
import { LeagueOffice } from "@/components/sportsbook/league-office";
import { HouseRules } from "@/components/sportsbook/house-rules";
import { EeslChallenges } from "@/components/sportsbook/eesl-challenges";
import { MarketsBoard } from "@/components/sportsbook/markets-board";
import { ArcadeHub } from "@/components/sportsbook/arcade-hub";
import { LeagueChat } from "@/components/sportsbook/league-chat";
import { MyBets } from "@/components/sportsbook/my-bets";
import { Ticker } from "@/components/sportsbook/ticker";
import { Button } from "@/components/ui/button";
import { STARTING_BANKROLL, useBook, type BookTab } from "@/lib/betting/store";
import { useBookFeeds } from "@/lib/feeds/use-feeds";
import type { ScoreBoard } from "@/lib/scores";
import { ClipboardList, Coins, Gamepad2, Landmark, LayoutGrid, MessageCircle, ScrollText, Trophy, Users, X } from "lucide-react";

const TABS: { id: BookTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "board", label: "Board", icon: LayoutGrid },
  { id: "tickets", label: "Tickets", icon: ClipboardList },
  { id: "fantasy", label: "Roster", icon: Users },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "league", label: "League", icon: Trophy },
  { id: "challenges", label: "E$L", icon: Coins },
  { id: "markets", label: "Markets", icon: Landmark },
  { id: "arcade", label: "Arcade", icon: Gamepad2 },
  { id: "house", label: "House", icon: ScrollText },
];

export function SportsbookApp({ initialScores }: { initialScores?: ScoreBoard }) {
  const feeds = useBookFeeds(initialScores);
  const tab = useBook((s) => s.tab);
  const setTab = useBook((s) => s.setTab);
  const slip = useBook((s) => s.slip);
  const slipOpen = useBook((s) => s.slipOpen);
  const setSlipOpen = useBook((s) => s.setSlipOpen);
  const storedBankroll = useBook((s) => s.bankroll);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      if (sessionStorage.getItem("eastside-open-chat") === "1") {
        sessionStorage.removeItem("eastside-open-chat");
        setTab("chat");
      }
    } catch {
      /* ignore */
    }
  }, [setTab]);

  const bankroll = hydrated ? storedBankroll : STARTING_BANKROLL;

  return (
    <div className="felt-bg min-h-dvh text-cream">
      <header className="border-b line-gold bg-void/95">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-display text-[11px] uppercase tracking-[0.32em] text-gold">
              Eastside After Dark · <span className="text-gold-bright">SIM</span>
            </p>
            <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-cream sm:text-4xl">
              Eastside Legends <span className="text-gold">Sim</span>
            </h1>
            <p className="mt-1 text-sm text-muted">
              Prototype NFL betting and fantasy tracker. Simulation only. No real money.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <AccountBar />
            <ChipCounter bankroll={bankroll} />
            <a
              href="/eastside-legends-sim-source.zip"
              download="eastside-legends-sim-source.zip"
              className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border border-gold/30 px-4 text-sm text-cream hover:border-gold/60 hover:bg-cream/5"
            >
              Source zip
            </a>
            <Button
              variant="gold"
              className="lg:hidden"
              onClick={() => setSlipOpen(true)}
            >
              Slip{slip.length ? ` (${slip.length})` : ""}
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto bg-void px-4 pb-3 sm:px-6">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-pill)] border px-4 text-sm ${
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

      <Ticker scores={feeds.scores} />

      <div className="mx-auto grid max-w-[1400px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <div className="hidden lg:block">
          <div className="sticky top-4 max-h-[calc(100dvh-6rem)] overflow-y-auto pr-1">
            <FantasyBoard roster={feeds.roster} compact />
          </div>
        </div>

        <main className="min-w-0 pb-24 lg:pb-8">
          {tab === "board" ? <Board odds={feeds.odds} scores={feeds.scores} /> : null}
          {tab === "tickets" ? <MyBets scores={feeds.scores} /> : null}
          {tab === "fantasy" ? <FantasyBoard /> : null}
          {tab === "chat" ? <LeagueChat /> : null}
          {tab === "league" ? <LeagueOffice /> : null}
          {tab === "challenges" ? <EeslChallenges /> : null}
          {tab === "markets" ? <MarketsBoard /> : null}
          {tab === "arcade" ? <ArcadeHub /> : null}
          {tab === "house" ? <HouseRules /> : null}
        </main>

        <div className="hidden xl:block">
          <div className="sticky top-4">
            <BetSlip scores={feeds.scores} />
          </div>
        </div>
      </div>

      {slipOpen ? (
        <div className="fixed inset-0 z-40 xl:hidden">
          <button
            type="button"
            aria-label="Close slip"
            className="absolute inset-0 bg-ink/70"
            onClick={() => setSlipOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[var(--radius-xl)] p-3">
            <div className="mb-2 flex justify-end">
              <Button variant="ghost" size="icon" onClick={() => setSlipOpen(false)} aria-label="Close">
                <X className="size-4" />
              </Button>
            </div>
            <BetSlip scores={feeds.scores} />
          </div>
        </div>
      ) : null}
    </div>
  );
}