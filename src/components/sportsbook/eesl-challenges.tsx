import { useCallback, useEffect, useMemo, useState } from "react";
import { Coins } from "lucide-react";
import { AccountBar } from "@/components/sportsbook/account-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabaseConfigured } from "@/lib/supabase/client";
import {
  EESL_LABEL,
  EESL_SIM_DISCLAIMER,
  acceptChallenge,
  cancelChallenge,
  createChallenge,
  declineChallenge,
  ensureBalance,
  listChallenges,
  listOpponentOptions,
  settleChallenge,
  type EeslChallenge,
  type EeslOpponentOption,
  type EeslSettleResult,
} from "@/lib/supabase/eesl";
import { useSupabaseSession } from "@/lib/supabase/use-session";

/**
 * Optional bridge to Board zustand bankroll.
 * When signed in, E$L coin$ live in eesl_balances; callers may pass
 * setLocalBankroll so the chip counter shows the synced remote balance.
 * Logged-out Board keeps local zustand only — this panel requires sign-in.
 */
type EeslChallengesProps = {
  /** Sync remote E$L coin$ balance into zustand STARTING_BANKROLL store. */
  setLocalBankroll?: (n: number) => void;
};

function formatStake(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function shortId(id: string): string {
  return id.slice(0, 8);
}

/**
 * E$L coin$ side-bet challenges panel.
 * One balance with Board sims when signed in. Simulation only — not real money.
 */
export function EeslChallenges({ setLocalBankroll }: EeslChallengesProps = {}) {
  const { ready, user } = useSupabaseSession();
  const [balance, setBalance] = useState<number | null>(null);
  const [challenges, setChallenges] = useState<EeslChallenge[]>([]);
  const [opponents, setOpponents] = useState<EeslOpponentOption[]>([]);
  const [opponentId, setOpponentId] = useState("");
  const [stake, setStake] = useState("10");
  const [terms, setTerms] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const nameByUser = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of opponents) m.set(o.userId, o.label);
    if (user) m.set(user.id, "You");
    return m;
  }, [opponents, user]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [bal, list, opts] = await Promise.all([
      ensureBalance(),
      listChallenges(["open", "accepted"]),
      listOpponentOptions(user.id),
    ]);
    setBalance(bal);
    setLocalBankroll?.(bal);
    setChallenges(list);
    setOpponents(opts);
    setOpponentId((prev) =>
      prev && opts.some((o) => o.userId === prev)
        ? prev
        : opts[0]?.userId ?? "",
    );
  }, [user, setLocalBankroll]);

  useEffect(() => {
    if (!ready || !user || !supabaseConfigured) return;
    let alive = true;
    (async () => {
      try {
        setError(null);
        await refresh();
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : `Could not load ${EESL_LABEL}.`);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ready, user, refresh]);

  async function runAction(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || busy) return;
    const stakeNum = Number(stake);
    if (!opponentId) {
      setError("Pick an opponent.");
      return;
    }
    if (!Number.isFinite(stakeNum) || stakeNum <= 0) {
      setError(`Stake must be a positive amount of ${EESL_LABEL}.`);
      return;
    }
    const trimmed = terms.trim();
    if (!trimmed || trimmed.length > 280) {
      setError("Terms required (1–280 characters).");
      return;
    }
    await runAction(async () => {
      await createChallenge(opponentId, stakeNum, trimmed);
      setTerms("");
    });
  }

  if (!supabaseConfigured) {
    return (
      <section className="casino-card rounded-2xl border border-gold/25 p-5">
        <h2 className="font-display text-xl text-gold">{EESL_LABEL}</h2>
        <p className="mt-2 text-sm text-muted">
          Supabase env is missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY,
          then restart npm run dev.
        </p>
        <p className="mt-2 text-xs text-muted">{EESL_SIM_DISCLAIMER}</p>
      </section>
    );
  }

  if (!ready) {
    return (
      <section className="casino-card rounded-2xl border border-gold/25 p-5 text-sm text-muted">
        Loading {EESL_LABEL}…
      </section>
    );
  }

  if (!user) {
    return (
      <section className="casino-card rounded-2xl border border-gold/25 p-5">
        <div className="mb-3 flex items-center gap-2 text-gold">
          <Coins className="size-5" />
          <h2 className="font-display text-xl">{EESL_LABEL}</h2>
        </div>
        <p className="mb-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {EESL_SIM_DISCLAIMER}
        </p>
        <p className="mb-4 text-sm text-muted">
          Sign in to challenge league mates with {EESL_LABEL}. Board bets still work
          on the local sim bankroll while logged out.
        </p>
        <AccountBar />
      </section>
    );
  }

  const open = challenges.filter((c) => c.status === "open");
  const accepted = challenges.filter((c) => c.status === "accepted");

  return (
    <section className="casino-card flex min-h-[28rem] flex-col rounded-2xl border border-gold/25">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <Coins className="size-5 text-gold" />
          <div>
            <h2 className="font-display text-lg text-cream">{EESL_LABEL}</h2>
            <p className="text-xs text-muted">Side-bet challenges · Eastside</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full border border-gold/40 px-3 py-1 text-sm tabular-nums text-gold">
            {balance == null ? "…" : formatStake(balance)} {EESL_LABEL}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-amber-200/90">
            {EESL_SIM_DISCLAIMER}
          </span>
        </div>
      </header>

      <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-100">
        {EESL_SIM_DISCLAIMER} Same balance as Board sim bets when signed in.
      </div>

      <form
        onSubmit={onCreate}
        className="space-y-3 border-b border-gold/15 px-4 py-3"
      >
        <p className="text-[11px] uppercase tracking-wide text-muted">
          New challenge
        </p>
        <label className="block text-xs text-muted">
          Opponent
          <select
            className="mt-1 w-full rounded-md border border-gold/25 bg-felt-deep px-3 py-2 text-sm text-cream"
            value={opponentId}
            onChange={(e) => setOpponentId(e.target.value)}
            disabled={busy || opponents.length === 0}
          >
            {opponents.length === 0 ? (
              <option value="">No other members yet</option>
            ) : (
              opponents.map((o) => (
                <option key={o.userId} value={o.userId}>
                  {o.label}
                </option>
              ))
            )}
          </select>
        </label>
        <label className="block text-xs text-muted">
          Stake ({EESL_LABEL})
          <Input
            type="number"
            min={0.01}
            step="any"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            disabled={busy}
            className="mt-1"
          />
        </label>
        <label className="block text-xs text-muted">
          Terms
          <Input
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="e.g. Go Birds covers the spread"
            maxLength={280}
            disabled={busy}
            className="mt-1"
          />
        </label>
        <p className="text-[11px] text-muted">
          Stake is checked now but not taken until they accept. On accept, each
          puts up the stake (pot = 2×).
        </p>
        <Button
          type="submit"
          variant="felt"
          disabled={busy || !opponentId || !terms.trim()}
        >
          Create challenge
        </Button>
      </form>

      {error ? (
        <p className="px-4 pt-2 text-xs text-amber-300">{error}</p>
      ) : null}

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
        <ChallengeList
          title="Open"
          items={open}
          selfId={user.id}
          nameByUser={nameByUser}
          busy={busy}
          onAccept={(id) => void runAction(() => acceptChallenge(id))}
          onDecline={(id) => void runAction(() => declineChallenge(id))}
          onCancel={(id) => void runAction(() => cancelChallenge(id))}
        />
        <ChallengeList
          title="Accepted"
          items={accepted}
          selfId={user.id}
          nameByUser={nameByUser}
          busy={busy}
          onSettle={(id, result) =>
            void runAction(() => settleChallenge(id, result))
          }
        />
      </div>
    </section>
  );
}

type ListProps = {
  title: string;
  items: EeslChallenge[];
  selfId: string;
  nameByUser: Map<string, string>;
  busy: boolean;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onCancel?: (id: string) => void;
  onSettle?: (id: string, result: EeslSettleResult) => void;
};

function ChallengeList({
  title,
  items,
  selfId,
  nameByUser,
  busy,
  onAccept,
  onDecline,
  onCancel,
  onSettle,
}: ListProps) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] uppercase tracking-wide text-gold/80">
        {title} ({items.length})
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted">None.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => {
            const iAmChallenger = c.challenger_id === selfId;
            const iAmOpponent = c.opponent_id === selfId;
            const otherId = iAmChallenger ? c.opponent_id : c.challenger_id;
            const otherLabel =
              nameByUser.get(otherId) ?? `Member ${shortId(otherId)}`;
            return (
              <li
                key={c.id}
                className="rounded-xl border border-gold/20 bg-felt-deep/60 px-3 py-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm text-cream">
                    {iAmChallenger ? "You" : otherLabel}
                    <span className="text-muted"> vs </span>
                    {iAmChallenger ? otherLabel : "You"}
                  </span>
                  <span className="text-sm tabular-nums text-gold">
                    {formatStake(c.stake)} {EESL_LABEL}
                    <span className="ml-1 text-[10px] text-muted">
                      pot {formatStake(c.stake * 2)}
                    </span>
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-cream/90">
                  {c.terms}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.status === "open" && iAmOpponent ? (
                    <>
                      <Button
                        type="button"
                        variant="felt"
                        className="h-8 px-2 text-xs"
                        disabled={busy}
                        onClick={() => onAccept?.(c.id)}
                      >
                        Accept
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 px-2 text-xs"
                        disabled={busy}
                        onClick={() => onDecline?.(c.id)}
                      >
                        Decline
                      </Button>
                    </>
                  ) : null}
                  {c.status === "open" && iAmChallenger ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 px-2 text-xs"
                      disabled={busy}
                      onClick={() => onCancel?.(c.id)}
                    >
                      Cancel
                    </Button>
                  ) : null}
                  {c.status === "accepted" && (iAmChallenger || iAmOpponent) ? (
                    <>
                      <Button
                        type="button"
                        variant="felt"
                        className="h-8 px-2 text-xs"
                        disabled={busy}
                        onClick={() => onSettle?.(c.id, "challenger")}
                      >
                        Challenger wins
                      </Button>
                      <Button
                        type="button"
                        variant="felt"
                        className="h-8 px-2 text-xs"
                        disabled={busy}
                        onClick={() => onSettle?.(c.id, "opponent")}
                      >
                        Opponent wins
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 px-2 text-xs"
                        disabled={busy}
                        onClick={() => onSettle?.(c.id, "push")}
                      >
                        Push
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
