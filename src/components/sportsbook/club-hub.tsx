/**
 * Club hub — Door, Programming, Jersey Wheel SOON, plus E$L / Arcade / Markets / House.
 * Night ink cards, gold CTAs. Simulation only — not real money.
 */
"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Coins,
  DoorOpen,
  Gamepad2,
  Landmark,
  ScrollText,
  Shirt,
} from "lucide-react";
import { ArcadeHub } from "@/components/sportsbook/arcade-hub";
import { EeslChallenges } from "@/components/sportsbook/eesl-challenges";
import { HouseRules } from "@/components/sportsbook/house-rules";
import { MarketsBoard } from "@/components/sportsbook/markets-board";
import { useBook } from "@/lib/betting/store";
import { cn } from "@/lib/utils";

export type ClubPanel = "door" | "programming" | "jersey" | "eesl" | "arcade" | "markets" | "house";

const CREATIVE: {
  id: ClubPanel;
  label: string;
  blurb: string;
  cta: string;
  icon: typeof DoorOpen;
  soon?: boolean;
}[] = [
  {
    id: "door",
    label: "The Door",
    blurb: "After Dark. Ring in. Simulation only — E$L coin$, no real money.",
    cta: "Step in",
    icon: DoorOpen,
  },
  {
    id: "programming",
    label: "Programming",
    blurb: "Tonight's card: Week 1 board, scores ticker, league chat.",
    cta: "See the card",
    icon: CalendarDays,
  },
  {
    id: "jersey",
    label: "Jersey Wheel",
    blurb: "Spin the closet. Coming soon — not live this hangout.",
    cta: "SOON",
    icon: Shirt,
    soon: true,
  },
];

const NESTED: {
  id: Exclude<ClubPanel, "door" | "programming" | "jersey">;
  label: string;
  blurb: string;
  icon: typeof Coins;
}[] = [
  {
    id: "eesl",
    label: "E$L",
    blurb: "Side-bet challenges in E$L coin$. Simulation only.",
    icon: Coins,
  },
  {
    id: "arcade",
    label: "Arcade",
    blurb: "Sports mini-games and classics. Play for fun chips.",
    icon: Gamepad2,
  },
  {
    id: "markets",
    label: "Markets",
    blurb: "League prop boards and season markets.",
    icon: Landmark,
  },
  {
    id: "house",
    label: "House",
    blurb: "House rules, sim disclaimers, and how the book works.",
    icon: ScrollText,
  },
];

export function ClubHub() {
  const [clubPanel, setClubPanel] = useState<ClubPanel | null>(null);
  const setTab = useBook((s) => s.setTab);

  if (clubPanel === "eesl") {
    return (
      <ClubBack onBack={() => setClubPanel(null)}>
        <EeslChallenges />
      </ClubBack>
    );
  }
  if (clubPanel === "arcade") {
    return (
      <ClubBack onBack={() => setClubPanel(null)}>
        <ArcadeHub />
      </ClubBack>
    );
  }
  if (clubPanel === "markets") {
    return (
      <ClubBack onBack={() => setClubPanel(null)}>
        <MarketsBoard />
      </ClubBack>
    );
  }
  if (clubPanel === "house") {
    return (
      <ClubBack onBack={() => setClubPanel(null)}>
        <HouseRules />
      </ClubBack>
    );
  }
  if (clubPanel === "door") {
    return (
      <ClubBack onBack={() => setClubPanel(null)}>
        <section className="surface-ink rounded-[var(--radius-xl)] border border-gold/25 p-5 sm:p-6">
          <p className="club-kicker">Las Vegas · After dark</p>
          <h2 className="mt-2 font-display text-3xl text-cream">The Door</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            East Side Social Club. Game-day hangout. Simulation only. E$L coin$ —
            no real money, no bookmaker login, no bank.
          </p>
          <p className="mt-3 text-sm text-cream">
            Ring the bell, claim a Yahoo team by name, then sit in league chat.
          </p>
          <a
            href="/join?code=EASTSIDE"
            className="mt-5 inline-flex min-h-11 items-center rounded-full border border-gold bg-gold px-5 text-sm font-semibold text-ink"
          >
            Enter with invite
          </a>
        </section>
      </ClubBack>
    );
  }
  if (clubPanel === "programming") {
    return (
      <ClubBack onBack={() => setClubPanel(null)}>
        <section className="surface-ink rounded-[var(--radius-xl)] border border-gold/25 p-5 sm:p-6">
          <p className="club-kicker">Tonight's card</p>
          <h2 className="mt-2 font-display text-3xl text-cream">Programming</h2>
          <ul className="mt-4 space-y-3 text-sm text-cream">
            <li className="rounded-[var(--radius-md)] border border-gold/20 px-4 py-3">
              <span className="text-gold">Board</span> — Week 1 spreads sim. Dated snapshot.
            </li>
            <li className="rounded-[var(--radius-md)] border border-gold/20 px-4 py-3">
              <span className="text-gold">Ticker</span> — live-ish ESPN scores when the wire is up.
            </li>
            <li className="rounded-[var(--radius-md)] border border-gold/20 px-4 py-3">
              <span className="text-gold">League chat</span> — invite EASTSIDE, then claim a Yahoo name.
            </li>
          </ul>
          <button
            type="button"
            onClick={() => setTab("board")}
            className="mt-5 inline-flex min-h-11 items-center rounded-full border border-gold bg-gold px-5 text-sm font-semibold text-ink"
          >
            Open the board
          </button>
        </section>
      </ClubBack>
    );
  }
  if (clubPanel === "jersey") {
    return (
      <ClubBack onBack={() => setClubPanel(null)}>
        <section className="surface-ink rounded-[var(--radius-xl)] border border-gold/25 p-5 sm:p-6">
          <p className="club-kicker">Closet</p>
          <h2 className="mt-2 font-display text-3xl text-cream">Jersey Wheel</h2>
          <p className="mt-2 inline-flex rounded-full border border-gold/40 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gold">
            SOON
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
            Spin for a kit. Not live this hangout — we're not opening the
            Felt Floor cabinet row from here.
          </p>
        </section>
      </ClubBack>
    );
  }

  return (
    <section>
      <div className="mb-4">
        <p className="club-kicker">After hours</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-cream">Club</h2>
        <p className="mt-1 text-sm text-muted">
          Door · Programming · Jersey Wheel — then E$L, Arcade, Markets, House
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {CREATIVE.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setClubPanel(card.id)}
              className={cn(
                "surface-ink flex flex-col items-start gap-3 rounded-[var(--radius-xl)] border line-gold p-4 text-left transition",
                "hover:border-gold/60 hover:bg-cream/[0.03]",
              )}
            >
              <span className="inline-flex size-10 items-center justify-center rounded-full border border-gold/35 text-gold">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="font-display text-xl font-semibold text-cream">{card.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted text-pretty">{card.blurb}</p>
              </div>
              <span
                className={cn(
                  "mt-auto inline-flex min-h-10 items-center rounded-[var(--radius-pill)] border px-4 text-xs uppercase tracking-[0.16em]",
                  card.soon
                    ? "border-gold/40 text-gold"
                    : "border-gold bg-gold/15 text-gold",
                )}
              >
                {card.cta}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {NESTED.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setClubPanel(card.id)}
              className={cn(
                "surface-ink flex flex-col items-start gap-3 rounded-[var(--radius-xl)] border line-gold p-4 text-left transition",
                "hover:border-gold/60 hover:bg-cream/[0.03]",
              )}
            >
              <span className="inline-flex size-10 items-center justify-center rounded-full border border-gold/35 text-gold">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="font-display text-xl font-semibold text-cream">{card.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted text-pretty">{card.blurb}</p>
              </div>
              <span className="mt-auto inline-flex min-h-10 items-center rounded-[var(--radius-pill)] border border-gold bg-gold/15 px-4 text-xs uppercase tracking-[0.16em] text-gold">
                Open
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ClubBack({
  onBack,
  children,
}: {
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-pill)] border border-gold/30 px-4 text-sm text-gold hover:border-gold/60 hover:bg-cream/5"
      >
        <ArrowLeft className="size-4" />
        Back to Club
      </button>
      {children}
    </section>
  );
}
