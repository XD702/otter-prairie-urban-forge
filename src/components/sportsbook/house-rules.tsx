export function HouseRules() {
  return (
    <section>
      <p className="font-display text-xs uppercase tracking-[0.28em] text-gold">The house</p>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-cream">House rules</h2>
      <div className="mt-5 space-y-4 text-sm leading-relaxed text-cream/90">
        <p>
          Source dump for this prototype:{" "}
          <a
            href="/eastside-legends-sim-source.zip"
            download="eastside-legends-sim-source.zip"
            className="text-gold underline underline-offset-2 hover:text-gold-bright"
          >
            Download source zip
          </a>
          . Simulation only. No real money.
        </p>
        <ul className="space-y-3 text-muted">
          <li>
            <span className="text-cream">Lines.</span> Week 1 spreads from a dated BetMGM snapshot.
            Source: USA Today, odds courtesy of BetMGM as of Tuesday Sep 8, 2026, 10:45 a.m. ET.
            Not a live scrape. One casino: BetMGM.
          </li>
          <li>
            <span className="text-cream">Markets.</span> Spreads only. Moneyline, total, and juice
            are unavailable on this board and are not invented. The opener is SEA −3 from this
            USA Today card.
          </li>
          <li>
            <span className="text-cream">Scores.</span> ESPN public scoreboard, swappable layer.
            Snapshot / pending / final. Polls every 30 seconds while a game is in progress. Unofficial
            feed — if it fails the ticker shows “Scores unavailable” and the rest of the book stays
            up. Nothing is invented.
          </li>
          <li>
            <span className="text-cream">Roster.</span> League of Eastside Legends (Yahoo 288732).
            Starters and bench are the inserted lineup only. No opponent column. No extra
            players invented.
          </li>
          <li>
            <span className="text-cream">Tickets.</span> Spreads can be booked as unpriced sim
            leans. Payout stays unavailable until juice exists. Open tickets wait on a final
            score.
          </li>
          <li>
            <span className="text-cream">Production.</span> Odds module swaps to The Odds API.
            Scores module swaps the same way — ESPN unofficial now, paid feed later — without
            touching ticker, cards, or tickets. Persistence moves to Supabase. UI stays on the
            same board contract.
          </li>
        </ul>
      </div>
    </section>
  );
}
