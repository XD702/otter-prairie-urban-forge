/**
 * Simulated sportsbook state — bankroll, slip, tickets.
 * Client-only localStorage. No real money.
 *
 * PROTOTYPE. Production: persist tickets and bankroll in Supabase; odds and
 * scores stay on their swappable provider modules.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { combineAmerican, toWin } from "./american";
import { round2, uid } from "@/lib/utils";

export type MarketKind = "spread" | "moneyline" | "total";
export type SelectionSide = "home" | "away" | "over" | "under";
export type TicketStatus = "open" | "won" | "lost" | "push" | "void";
export type BookTab = "board" | "squad" | "league" | "club";

const VALID_TABS: readonly BookTab[] = ["board", "squad", "league", "club"] as const;

export function coerceBookTab(tab: unknown): BookTab {
  if (tab === "board" || tab === "squad" || tab === "league" || tab === "club") return tab;
  return "board";
}

/** Map legacy root tabs (pre–4-tab IA) to the new BookTab + optional slipOpen. */
export function migrateLegacyBookTab(raw: unknown): { tab: BookTab; slipOpen?: boolean; leagueSub?: "chat" } {
  if (raw === "tickets") return { tab: "board", slipOpen: true };
  if (raw === "fantasy") return { tab: "squad" };
  if (raw === "chat") return { tab: "league", leagueSub: "chat" };
  if (raw === "challenges" || raw === "markets" || raw === "arcade" || raw === "house") {
    return { tab: "club" };
  }
  return { tab: coerceBookTab(raw) };
}

export interface BetLeg {
  id: string;
  gameId: string;
  label: string;
  market: MarketKind;
  side: SelectionSide;
  line: number | null;
  odds: number | null;
  book: string | null;
}

export interface Ticket {
  id: string;
  placedAt: string;
  legs: BetLeg[];
  stake: number;
  americanOdds: number | null;
  toWin: number | null;
  priced: boolean;
  status: TicketStatus;
}

export const STARTING_BANKROLL = 100;
export const STAKE_PRESETS = [5, 10, 25, 50, 100] as const;
const DEFAULT_STAKE = 10;

function isPricedOdds(odds: number | null | undefined): odds is number {
  return odds !== null && odds !== undefined && Number.isFinite(odds) && odds !== 0;
}

interface BookState {
  bankroll: number;
  slip: BetLeg[];
  stake: number;
  tickets: Ticket[];
  tab: BookTab;
  slipOpen: boolean;
  /** Slip sheet secondary panel: active slip vs My tickets. */
  slipPanel: "slip" | "tickets";
  notice: string | null;
  addLeg: (leg: Omit<BetLeg, "id">) => void;
  removeLeg: (id: string) => void;
  clearSlip: () => void;
  setStake: (n: number) => void;
  placeBet: () => void;
  setTab: (tab: BookTab) => void;
  setSlipOpen: (open: boolean) => void;
  setSlipPanel: (panel: "slip" | "tickets") => void;
  clearNotice: () => void;
  resetBook: () => void;
}

export const useBook = create<BookState>()(
  persist(
    (set, get) => ({
      bankroll: STARTING_BANKROLL,
      slip: [],
      stake: DEFAULT_STAKE,
      tickets: [],
      tab: "board",
      slipOpen: false,
      slipPanel: "slip",
      notice: null,
      addLeg: (leg) => {
        const spreadPosted = leg.market === "spread" && leg.line !== null;
        if (!isPricedOdds(leg.odds) && !spreadPosted) {
          set({ notice: "That market is unavailable — no line posted." });
          return;
        }
        const existing = get().slip.find(
          (item) => item.gameId === leg.gameId && item.market === leg.market,
        );
        const next: BetLeg = { ...leg, id: uid("leg") };
        const slip = existing
          ? get().slip.map((item) => (item.id === existing.id ? { ...next, id: existing.id } : item))
          : [...get().slip, next];
        set({ slip, notice: null, slipOpen: true, slipPanel: "slip" });
      },
      removeLeg: (id) => set({ slip: get().slip.filter((leg) => leg.id !== id) }),
      clearSlip: () => set({ slip: [] }),
      setStake: (n) => {
        const stake = Math.max(0, round2(n));
        set({ stake });
      },
      placeBet: () => {
        const { slip, stake, bankroll } = get();
        if (slip.length === 0) {
          set({ notice: "Add a posted line to the slip first." });
          return;
        }
        if (stake <= 0) {
          set({ notice: "Enter a stake greater than zero." });
          return;
        }
        if (stake > bankroll) {
          set({ notice: "Stake is larger than the simulated bankroll." });
          return;
        }
        const priced = slip.every((leg) => isPricedOdds(leg.odds));
        const americanOdds = priced ? combineAmerican(slip.map((leg) => leg.odds as number)) : null;
        const win = priced && americanOdds !== null ? toWin(stake, americanOdds) : null;
        const ticket: Ticket = {
          id: uid("tkt"),
          placedAt: new Date().toISOString(),
          legs: slip,
          stake,
          americanOdds,
          toWin: win,
          priced,
          status: "open",
        };
        set({
          bankroll: round2(bankroll - stake),
          tickets: [ticket, ...get().tickets],
          slip: [],
          notice: priced
            ? null
            : "Ticket booked unpriced — juice was not on this BetMGM snapshot. Simulation only.",
          slipOpen: true,
          slipPanel: "tickets",
        });
      },
      setTab: (tab) => {
        const next = coerceBookTab(tab);
        set({ tab: next, slipOpen: false });
      },
      setSlipOpen: (slipOpen) => set({ slipOpen }),
      setSlipPanel: (slipPanel) => set({ slipPanel }),
      clearNotice: () => set({ notice: null }),
      resetBook: () =>
        set({
          bankroll: STARTING_BANKROLL,
          slip: [],
          stake: DEFAULT_STAKE,
          tickets: [],
          notice: null,
        }),
    }),
    {
      name: "eastside-legends-sim",
      version: 3,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as {
          bankroll?: number;
          slip?: BetLeg[];
          stake?: number;
          tickets?: Ticket[];
          tab?: unknown;
          slipOpen?: boolean;
          slipPanel?: "slip" | "tickets";
        };
        let next = { ...state };
        if (version < 2) {
          next = {
            ...next,
            bankroll: STARTING_BANKROLL,
            stake: Math.min(state.stake ?? DEFAULT_STAKE, STARTING_BANKROLL),
          };
        }
        if (version < 3) {
          const migrated = migrateLegacyBookTab(state.tab);
          next = {
            ...next,
            tab: migrated.tab,
            slipOpen: migrated.slipOpen ?? state.slipOpen ?? false,
            slipPanel: state.slipPanel === "tickets" ? "tickets" : "slip",
          };
          // Stash league chat intent for shell (session) when migrating from chat tab
          if (migrated.leagueSub === "chat") {
            try {
              sessionStorage.setItem("eastside-open-chat", "1");
            } catch {
              /* ignore */
            }
          }
        } else {
          next = {
            ...next,
            tab: coerceBookTab(state.tab),
          };
        }
        if (!VALID_TABS.includes(next.tab as BookTab)) {
          next.tab = "board";
        }
        return next;
      },
      partialize: (state) => ({
        bankroll: state.bankroll,
        slip: state.slip,
        stake: state.stake,
        tickets: state.tickets,
        tab: state.tab,
        slipOpen: state.slipOpen,
        slipPanel: state.slipPanel,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const tab = coerceBookTab(state.tab);
        if (tab !== state.tab) state.tab = tab;
      },
    },
  ),
);
