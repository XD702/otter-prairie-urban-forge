import { useCallback, useEffect, useMemo, useState } from "react";
import { Landmark, TrendingUp } from "lucide-react";
import { AccountBar } from "@/components/sportsbook/account-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabaseConfigured } from "@/lib/supabase/client";
import {
  EESL_LABEL,
  MARKETS_BANNER,
  MARKETS_SIM_DISCLAIMER,
  approveMarket,
  buyMarket,
  cancelMarket,
  ensureBalance,
  formatOutcomeLabel,
  isEastsideAdmin,
  listMarkets,
  listMyPositions,
  proposeMarket,
  rejectMarket,
  resolveMarket,
  type EeslMarket,
  type EeslMarketPosition,
  type EeslMarketStatus,
} from "@/lib/supabase/markets";
import { useSupabaseSession } from "@/lib/supabase/use-session";

type MarketsBoardProps = {
  setLocalBankroll?: (n: number) => void;
};

type BoardTab = "pending" | "live" | "resolved";

function formatStake(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/**
 * Markets board — propose → admin approve → stake E$L coin$ → admin resolve.
 * First house market: "Who will win Super Bowl?" (top-6 DK teams, live seed).
 */
export function MarketsBoard({ setLocalBankroll }: MarketsBoardProps = {}) {
  const { ready, user } = useSupabaseSession();
  const admin = isEastsideAdmin(user?.email ?? null);
  const [balance, setBalance] = useState<number | null>(null);
  const [markets, setMarkets] = useState<EeslMarket[]>([]);
  const [myPositions, setMyPositions] = useState<EeslMarketPosition[]>([]);
  const [tab, setTab] = useState<BoardTab>("live");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [question, setQuestion] = useState("");
  const [rules, setRules] = useState("");
  const [stakeDraft, setStakeDraft] = useState<Record<string, string>>({});
  const [rejectDraft, setRejectDraft] = useState<Record<string, string>>({});
  const [resolveDraft, setResolveDraft] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    if (!user) return;
    const statuses: EeslMarketStatus[] = admin
      ? ["pending", "live", "resolved", "canceled", "rejected"]
      : ["live", "resolved", "canceled", "pending"];
    const [bal, list, positions] = await Promise.all([
      ensureBalance(),
      listMarkets(statuses),
      listMyPositions(),
    ]);
    setBalance(bal);
    setLocalBankroll?.(bal);
    setMarkets(list);
    setMyPositions(positions);
  }, [user, admin, setLocalBankroll]);

  useEffect(() => {
    if (!ready || !user || !supabaseConfigured) return;
    let alive = true;
    (async () => {
      try {
        setError(null);
        await refresh();
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Could not load Markets.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [ready, user, refresh]);

  useEffect(() => {
    if (admin && tab === "live") {
      /* keep */
    } else if (!admin && tab === "pending") {
      setTab("live");
    }
  }, [admin, tab]);

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

  async function onPropose(e: React.FormEvent) {
    e.preventDefault();
    if (!user || busy) return;
    const q = question.trim();
    if (!q || q.length > 280) {
      setError("Question required (1–280 characters).");
      return;
    }
    await runAction(async () => {
      await proposeMarket(q, rules.trim(), null, null);
      setQuestion("");
      setRules("");
    });
  }

  const filtered = useMemo(() => {
    if (tab === "pending") {
      return markets.filter((m) => m.status === "pending");
    }
    if (tab === "live") {
      return markets.filter((m) => m.status === "live");
    }
    return markets.filter((m) =>
      ["resolved", "canceled", "rejected"].includes(m.status),
    );
  }, [markets, tab]);

  const myStakeByMarketOutcome = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of myPositions) {
      const key = `${p.market_id}:${p.outcome_id}`;
      map.set(key, (map.get(key) ?? 0) + p.stake);
    }
    return map;
  }, [myPositions]);

  if (!supabaseConfigured) {
    return (
      <section className="casino-card rounded-2xl border border-gold/25 p-5">
        <h2 className="font-display text-xl text-gold">Markets</h2>
        <p className="mt-2 text-sm text-muted">
          Supabase env is missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
        </p>
        <p className="mt-2 text-xs text-muted">{MARKETS_BANNER}</p>
      </section>
    );
  }

  if (!ready) {
    return (
      <section className="casino-card rounded-2xl border border-gold/25 p-5 text-sm text-muted">
        Loading Markets…
      </section>
    );
  }

  if (!user) {
    return (
      <section className="casino-card rounded-2xl border border-gold/25 p-5">
        <div className="mb-3 flex items-center gap-2 text-gold">
          <Landmark className="size-5" />
          <h2 className="font-display text-xl">Markets</h2>
        </div>
        <p className="mb-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {MARKETS_BANNER}
        </p>
        <p className="mb-4 text-sm text-muted">
          Sign in to propose markets and stake {EESL_LABEL}. Admin (Rob) approves
          and resolves.
        </p>
        <AccountBar />
      </section>
    );
  }

  return (
    <section className="casino-card flex min-h-[28rem] flex-col rounded-2xl border border-gold/25">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <Landmark className="size-5 text-gold" />
          <div>
            <h2 className="font-display text-lg text-cream">Markets</h2>
            <p className="text-xs text-muted">
              In-house prediction · Eastside · pool payouts
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full border border-gold/40 px-3 py-1 text-sm tabular-nums text-gold">
            {balance == null ? "…" : formatStake(balance)} {EESL_LABEL}
          </span>
          {admin ? (
            <span className="text-[10px] uppercase tracking-wide text-emerald-300/90">
              Admin
            </span>
          ) : null}
        </div>
      </header>

      <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-100">
        {MARKETS_BANNER}
      </div>

      <div className="flex gap-1 border-b border-gold/15 px-3 py-2">
        {(
          [
            ...(admin ? (["pending"] as const) : []),
            "live",
            "resolved",
          ] as BoardTab[]
        ).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-xs capitalize ${
              tab === t
                ? "bg-gold/20 text-gold"
                : "text-muted hover:text-cream"
            }`}
          >
            {t}
            {t === "pending"
              ? ` (${markets.filter((m) => m.status === "pending").length})`
              : ""}
          </button>
        ))}
      </div>

      {tab === "live" || tab === "pending" ? (
        <form
          onSubmit={onPropose}
          className="space-y-2 border-b border-gold/15 px-4 py-3"
        >
          <p className="text-[11px] uppercase tracking-wide text-muted">
            Propose Yes/No market
          </p>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Will Go Birds cover this week?"
            maxLength={280}
            disabled={busy}
          />
          <Input
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Rules / resolution source (optional)"
            maxLength={2000}
            disabled={busy}
          />
          <p className="text-[11px] text-muted">
            Submits as <strong>pending</strong>. Admin must approve before it goes
            live. Default outcomes: Yes / No.
          </p>
          <Button type="submit" variant="felt" disabled={busy || !question.trim()}>
            Propose market
          </Button>
        </form>
      ) : null}

      {error ? (
        <p className="px-4 pt-2 text-xs text-amber-300">{error}</p>
      ) : null}

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted">No markets in this tab.</p>
        ) : (
          filtered.map((m) => (
            <MarketCard
              key={m.id}
              market={m}
              admin={admin}
              busy={busy}
              stakeValue={stakeDraft[m.id] ?? "10"}
              onStakeChange={(v) =>
                setStakeDraft((s) => ({ ...s, [m.id]: v }))
              }
              rejectValue={rejectDraft[m.id] ?? ""}
              onRejectChange={(v) =>
                setRejectDraft((s) => ({ ...s, [m.id]: v }))
              }
              resolveValue={resolveDraft[m.id] ?? ""}
              onResolveChange={(v) =>
                setResolveDraft((s) => ({ ...s, [m.id]: v }))
              }
              myStakeByOutcome={myStakeByMarketOutcome}
              onBuy={(outcomeId) => {
                const stakeNum = Number(stakeDraft[m.id] ?? "10");
                if (!Number.isFinite(stakeNum) || stakeNum <= 0) {
                  setError(`Stake must be a positive amount of ${EESL_LABEL}.`);
                  return;
                }
                void runAction(async () => { await buyMarket(m.id, outcomeId, stakeNum); });
              }}
              onApprove={() => void runAction(() => approveMarket(m.id))}
              onReject={() =>
                void runAction(() =>
                  rejectMarket(m.id, rejectDraft[m.id] ?? ""),
                )
              }
              onResolve={() => {
                const oid = resolveDraft[m.id];
                if (!oid) {
                  setError("Pick the winning outcome before resolving.");
                  return;
                }
                void runAction(() => resolveMarket(m.id, oid));
              }}
              onCancel={() => void runAction(() => cancelMarket(m.id))}
            />
          ))
        )}
      </div>
    </section>
  );
}

type CardProps = {
  market: EeslMarket;
  admin: boolean;
  busy: boolean;
  stakeValue: string;
  onStakeChange: (v: string) => void;
  rejectValue: string;
  onRejectChange: (v: string) => void;
  resolveValue: string;
  onResolveChange: (v: string) => void;
  myStakeByOutcome: Map<string, number>;
  onBuy: (outcomeId: string) => void | Promise<unknown>;
  onApprove: () => void;
  onReject: () => void;
  onResolve: () => void;
  onCancel: () => void;
};

function MarketCard({
  market: m,
  admin,
  busy,
  stakeValue,
  onStakeChange,
  rejectValue,
  onRejectChange,
  resolveValue,
  onResolveChange,
  myStakeByOutcome,
  onBuy,
  onApprove,
  onReject,
  onResolve,
  onCancel,
}: CardProps) {
  const closed =
    m.closes_at != null && new Date(m.closes_at).getTime() <= Date.now();

  return (
    <article className="rounded-xl border border-gold/20 bg-felt-deep/40 p-3">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base text-cream">{m.question}</h3>
          {m.rules ? (
            <p className="mt-1 text-xs text-muted whitespace-pre-wrap">{m.rules}</p>
          ) : null}
          <p className="mt-1 text-[10px] uppercase tracking-wide text-muted">
            {m.status}
            {m.seed_key ? " · house seed" : ""}
            {m.pot > 0 ? ` · pot ${formatStake(m.pot)} ${EESL_LABEL}` : ""}
          </p>
        </div>
        <TrendingUp className="size-4 shrink-0 text-gold/70" />
      </div>

      {m.status === "resolved" && m.resolved_outcome_id ? (
        <p className="mb-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-100">
          Resolved:{" "}
          {formatOutcomeLabel(
            m.outcomes.find((o) => o.id === m.resolved_outcome_id) ?? {
              label: "—",
            },
          )}
        </p>
      ) : null}

      {m.status === "rejected" && m.reject_reason ? (
        <p className="mb-2 text-xs text-amber-200">Rejected: {m.reject_reason}</p>
      ) : null}

      <ul className="space-y-1.5">
        {m.outcomes.map((o) => {
          const mine = myStakeByOutcome.get(`${m.id}:${o.id}`) ?? 0;
          const share =
            m.pot > 0 && (o.pool ?? 0) > 0
              ? (((o.pool ?? 0) / m.pot) * 100).toFixed(0)
              : "0";
          return (
            <li
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gold/10 px-2 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-cream">
                  {formatOutcomeLabel(o)}
                </p>
                <p className="text-[10px] text-muted">
                  pool {formatStake(o.pool ?? 0)} · {share}% of pot
                  {mine > 0 ? ` · you ${formatStake(mine)}` : ""}
                  {o.ref_odds ? " · DK ref only" : ""}
                </p>
              </div>
              {m.status === "live" && !closed ? (
                <Button
                  type="button"
                  size="sm"
                  variant="felt"
                  disabled={busy}
                  onClick={() => onBuy(o.id)}
                >
                  Buy
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {m.status === "live" && !closed ? (
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <label className="text-xs text-muted">
            Stake ({EESL_LABEL})
            <Input
              type="number"
              min={0.01}
              step="any"
              value={stakeValue}
              onChange={(e) => onStakeChange(e.target.value)}
              disabled={busy}
              className="mt-1 w-28"
            />
          </label>
          <p className="pb-2 text-[10px] text-muted">{MARKETS_SIM_DISCLAIMER}</p>
        </div>
      ) : null}

      {admin && m.status === "pending" ? (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-gold/10 pt-2">
          <Button type="button" variant="felt" disabled={busy} onClick={onApprove}>
            Approve → live
          </Button>
          <Input
            value={rejectValue}
            onChange={(e) => onRejectChange(e.target.value)}
            placeholder="Reject reason"
            disabled={busy}
            className="max-w-xs"
          />
          <Button type="button" variant="ghost" disabled={busy} onClick={onReject}>
            Reject
          </Button>
        </div>
      ) : null}

      {admin && m.status === "live" ? (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-gold/10 pt-2">
          <label className="text-xs text-muted">
            Resolve winner
            <select
              className="mt-1 block w-full min-w-[12rem] rounded-md border border-gold/25 bg-felt-deep px-2 py-2 text-sm text-cream"
              value={resolveValue}
              onChange={(e) => onResolveChange(e.target.value)}
              disabled={busy}
            >
              <option value="">Select outcome…</option>
              {m.outcomes.map((o) => (
                <option key={o.id} value={o.id}>
                  {formatOutcomeLabel(o)}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" variant="felt" disabled={busy} onClick={onResolve}>
            Resolve & pay
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>
            Cancel & refund
          </Button>
        </div>
      ) : null}
    </article>
  );
}
