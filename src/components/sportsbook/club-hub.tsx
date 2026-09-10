/**
 * Club hub — E$L, Arcade, Markets, House nested under Club root tab.
 * Night ink cards, gold CTAs. No green fills.
 * Simulation only — not real money.
 */
"use client";

import { useState } from "react";
import { ArrowLeft, Coins, Gamepad2, Landmark, ScrollText } from "lucide-react";
import { ArcadeHub } from "@/components/sportsbook/arcade-hub";
import { EeslChallenges } from "@/components/sportsbook/eesl-challenges";
import { HouseRules } from "@/components/sportsbook/house-rules";
import { MarketsBoard } from "@/components/sportsbook/markets-board";
import { cn } from "@/lib/utils";

export type ClubPanel = "eesl" | "arcade" | "markets" | "house";

const CARDS: {
  id: ClubPanel;
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

  if (clubPanel) {
    return (
      <section className="space-y-4">
        <button
          type="button"
          onClick={() => setClubPanel(null)}
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-pill)] border border-gold/30 px-4 text-sm text-gold hover:border-gold/60 hover:bg-cream/5"
        >
          <ArrowLeft className="size-4" />
          Back to Club
        </button>
        {clubPanel === "eesl" ? <EeslChallenges /> : null}
        {clubPanel === "arcade" ? <ArcadeHub /> : null}
        {clubPanel === "markets" ? <MarketsBoard /> : null}
        {clubPanel === "house" ? <HouseRules /> : null}
      </section>
    );
  }

  return (
    <section>
      <div className="mb-4">
        <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">After hours</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-cream">Club</h2>
        <p className="mt-1 text-sm text-muted">
          E$L · Arcade · Markets · House — tap a card to open
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {CARDS.map((card) => {
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
