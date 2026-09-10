/**
 * Thin E$L coin$ H2H challenge UI for Arcade 1v1 games.
 * Reuses eesl_challenges RPCs. Simulation only — not real money.
 */
import { useCallback, useEffect, useState } from "react";
import { supabaseConfigured } from "@/lib/supabase/client";
import { useSupabaseSession } from "@/lib/supabase/use-session";
import {
  acceptChallenge,
  cancelChallenge,
  declineChallenge,
  EESL_LABEL,
  EESL_SIM_DISCLAIMER,
  listArcadeH2HChallenges,
  listOpponentOptions,
  proposeArcadeChallenge,
  settleChallenge,
  type EeslChallenge,
  type EeslOpponentOption,
  type EeslSettleResult,
} from "@/lib/arcade/h2h";
import type { ArcadeGameId } from "@/lib/arcade/types";

type Props = {
  gameId: ArcadeGameId;
  /** Extra terms fragment (matchup, “first to 5”, etc.). */
  termsExtra: string;
  /** Default stake suggestion (H2H requires > 0). */
  defaultStake?: string;
  /** Optional stake min/max hints (coin toss 1–5). */
  stakeHint?: string;
  onProposed?: (challengeId: string) => void;
};

export function ArcadeH2HPanel({
  gameId,
  termsExtra,
  defaultStake = "5",
  stakeHint,
  onProposed,
}: Props) {
  const { ready, user } = useSupabaseSession();
  const [opponents, setOpponents] = useState<EeslOpponentOption[]>([]);
  const [opponentId, setOpponentId] = useState("");
  const [stake, setStake] = useState(defaultStake);
  const [list, setList] = useState<EeslChallenge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [opts, challenges] = await Promise.all([
      listOpponentOptions(user.id),
      listArcadeH2HChallenges(),
    ]);
    setOpponents(opts);
    setOpponentId((prev) =>
      prev && opts.some((o) => o.userId === prev) ? prev : opts[0]?.userId ?? "",
    );
    const needle =
      gameId === "tic-tac-toe"
        ? "tic-tac-toe"
        : gameId === "matchup-dodge"
          ? "matchup dodge"
          : gameId.replace(/-/g, " ");
    setList(
      challenges.filter((c) => c.terms.toLowerCase().includes(needle)),
    );
  }, [user, gameId, termsExtra]);

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

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!supabaseConfigured) {
    return (
      <div className="rounded-[var(--radius-md)] border border-gold/20 bg-ink/30 p-3 text-sm text-muted">
        Supabase not configured — H2H {EESL_LABEL} unavailable. Solo play still works.
      </div>
    );
  }

  if (!ready) {
    return <p className="text-sm text-muted">Checking session…</p>;
  }

  if (!user) {
    return (
      <div className="rounded-[var(--radius-md)] border border-gold/20 bg-ink/30 p-3 text-sm text-muted">
        Sign in to propose / accept E$L coin$ H2H challenges. {EESL_SIM_DISCLAIMER}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-[var(--radius-lg)] border border-gold/25 bg-ink/40 p-3">
      <p className="font-display text-xs uppercase tracking-[0.22em] text-gold">
        H2H · {EESL_LABEL}
      </p>
      <p className="text-[11px] text-muted">
        Same ledger as E$L tab: propose (no deduct) → accept (each puts up stake, pot 2×) →
        settle. {EESL_SIM_DISCLAIMER}
      </p>
      {stakeHint ? <p className="text-[11px] text-gold">{stakeHint}</p> : null}

      <div className="flex flex-wrap gap-2">
        <select
          className="min-h-11 flex-1 rounded-[var(--radius-md)] border border-gold/30 bg-felt-deep/80 px-3 text-sm text-cream"
          value={opponentId}
          onChange={(e) => setOpponentId(e.target.value)}
          disabled={busy || opponents.length === 0}
        >
          {opponents.length === 0 ? (
            <option value="">No chat-member opponents</option>
          ) : (
            opponents.map((o) => (
              <option key={o.userId} value={o.userId}>
                {o.label}
              </option>
            ))
          )}
        </select>
        <input
          type="number"
          min={1}
          step={1}
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          className="min-h-11 w-24 rounded-[var(--radius-md)] border border-gold/30 bg-felt-deep/80 px-3 text-sm tabular-nums text-cream"
          aria-label="H2H stake"
        />
        <button
          type="button"
          disabled={busy || !opponentId}
          onClick={() =>
            run(async () => {
              const n = Number(stake);
              if (!(n > 0)) throw new Error(`Stake must be > 0 ${EESL_LABEL}.`);
              const id = await proposeArcadeChallenge(
                opponentId,
                n,
                gameId,
                termsExtra,
              );
              onProposed?.(id);
            })
          }
          className="min-h-11 rounded-full border border-gold bg-gold px-4 text-sm text-ink disabled:opacity-50"
        >
          Propose
        </button>
      </div>

      {error ? <p className="text-sm text-amber-300">{error}</p> : null}

      <ul className="space-y-2">
        {list.length === 0 ? (
          <li className="text-xs text-muted">No open/accepted Arcade H2H for this game.</li>
        ) : (
          list.map((c) => (
            <ChallengeRow
              key={c.id}
              c={c}
              userId={user.id}
              busy={busy}
              onAccept={() => run(() => acceptChallenge(c.id))}
              onDecline={() => run(() => declineChallenge(c.id))}
              onCancel={() => run(() => cancelChallenge(c.id))}
              onSettle={(r) => run(() => settleChallenge(c.id, r))}
            />
          ))
        )}
      </ul>
    </div>
  );
}

function ChallengeRow({
  c,
  userId,
  busy,
  onAccept,
  onDecline,
  onCancel,
  onSettle,
}: {
  c: EeslChallenge;
  userId: string;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
  onSettle: (r: EeslSettleResult) => void;
}) {
  const iAmChallenger = c.challenger_id === userId;
  const iAmOpponent = c.opponent_id === userId;
  return (
    <li className="rounded-[var(--radius-md)] border border-gold/15 bg-felt-deep/50 p-2 text-xs text-cream">
      <p className="text-muted">{c.terms}</p>
      <p className="mt-1 tabular-nums">
        {c.stake} {EESL_LABEL} · {c.status}
        {c.settled_as ? ` · ${c.settled_as}` : ""}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {c.status === "open" && iAmOpponent ? (
          <>
            <MiniBtn disabled={busy} onClick={onAccept} label="Accept" />
            <MiniBtn disabled={busy} onClick={onDecline} label="Decline" />
          </>
        ) : null}
        {c.status === "open" && iAmChallenger ? (
          <MiniBtn disabled={busy} onClick={onCancel} label="Cancel" />
        ) : null}
        {c.status === "accepted" && (iAmChallenger || iAmOpponent) ? (
          <>
            <MiniBtn disabled={busy} onClick={() => onSettle("challenger")} label="Settle: me (challenger)" />
            <MiniBtn disabled={busy} onClick={() => onSettle("opponent")} label="Settle: opponent" />
            <MiniBtn disabled={busy} onClick={() => onSettle("push")} label="Push" />
          </>
        ) : null}
      </div>
    </li>
  );
}

function MiniBtn({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="min-h-9 rounded-full border border-gold/40 px-3 text-[11px] text-cream hover:border-gold disabled:opacity-50"
    >
      {label}
    </button>
  );
}
