/**
 * Eastside in-house prediction markets (simulation only — not real money).
 * Currency label: "E$L coin$" (exact). Same eesl_balances as Board/challenges.
 * NOT Kalshi / Polymarket. DK American odds on labels are reference only.
 *
 * Admin gate: VITE_EASTSIDE_ADMIN_EMAILS comma-list → isEastsideAdmin(email)
 * (client-visible OK for Prototype). SQL RPCs also check eastside_admin_emails.
 */

import { getSupabase } from "@/lib/supabase/client";
import { EASTSIDE_LEAGUE_ID } from "@/lib/supabase/league-chat";

/** User-facing currency — exact branding. */
export const EESL_LABEL = "E$L coin$";

export const MARKETS_BANNER =
  "E$L coin$ · simulation only · not real money · not Kalshi or Polymarket";

export const MARKETS_SIM_DISCLAIMER = "Simulation only — not real money.";

export type EeslMarketStatus =
  | "pending"
  | "live"
  | "rejected"
  | "resolved"
  | "canceled";

export type EeslMarketOutcome = {
  id: string;
  market_id: string;
  label: string;
  ref_odds: string | null;
  sort_order: number;
  /** Sum of stakes on this outcome (client-aggregated). */
  pool?: number;
};

export type EeslMarket = {
  id: string;
  league_id: string;
  question: string;
  rules: string;
  status: EeslMarketStatus;
  created_by: string | null;
  created_at: string;
  closes_at: string | null;
  approved_by: string | null;
  resolved_outcome_id: string | null;
  reject_reason: string | null;
  seed_key: string | null;
  outcomes: EeslMarketOutcome[];
  /** Total pot across outcomes. */
  pot: number;
};

export type EeslMarketPosition = {
  id: string;
  market_id: string;
  user_id: string;
  outcome_id: string;
  stake: number;
  created_at: string;
};

export type ProposeOutcomeInput = {
  label: string;
  ref_odds?: string | null;
};

/**
 * Prototype admin gate — client-visible env is OK.
 * Put Rob's Supabase sign-in email in .env.local, e.g.:
 *   VITE_EASTSIDE_ADMIN_EMAILS=you@example.com
 * Also seed the same address into public.eastside_admin_emails via SQL Editor
 * so security-definer RPCs accept approve/reject/resolve.
 */
export function isEastsideAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = String(import.meta.env.VITE_EASTSIDE_ADMIN_EMAILS ?? "");
  const allow = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allow.length === 0) return false;
  return allow.includes(email.trim().toLowerCase());
}

/** Display label: exact team/outcome + optional DK ref odds. */
export function formatOutcomeLabel(o: {
  label: string;
  ref_odds?: string | null;
}): string {
  const odds = o.ref_odds?.trim();
  if (odds) return `${o.label} (${odds})`;
  return o.label;
}

function rpcErrorMessage(err: { message?: string; details?: string }): string {
  const raw = `${err.message ?? ""} ${err.details ?? ""}`.toLowerCase();
  if (raw.includes("eesl_insufficient")) {
    return `Not enough ${EESL_LABEL} for this stake.`;
  }
  if (raw.includes("eesl_not_member")) {
    return "Join Eastside chat to use Markets.";
  }
  if (raw.includes("eesl_invalid_stake")) {
    return "Stake must be greater than zero.";
  }
  if (raw.includes("eesl_invalid_question")) {
    return "Question required (1–280 characters).";
  }
  if (raw.includes("eesl_invalid_rules")) {
    return "Rules too long.";
  }
  if (raw.includes("eesl_invalid_outcomes") || raw.includes("eesl_invalid_outcome")) {
    return "Pick a valid outcome.";
  }
  if (raw.includes("eesl_invalid_closes_at")) {
    return "Close time must be in the future.";
  }
  if (raw.includes("eesl_market_closed")) {
    return "This market is closed for new stakes.";
  }
  if (raw.includes("eesl_bad_status")) {
    return "Market is not in the right status for that action.";
  }
  if (raw.includes("eesl_forbidden")) {
    return "Admin only — your email is not on the Eastside admin list.";
  }
  if (raw.includes("eesl_not_found")) {
    return "Market not found.";
  }
  if (raw.includes("eesl_unauth")) {
    return "Sign in to use Markets.";
  }
  return err.message || "Markets request failed.";
}

function mapOutcome(row: Record<string, unknown>): EeslMarketOutcome {
  return {
    id: String(row.id),
    market_id: String(row.market_id),
    label: String(row.label),
    ref_odds: row.ref_odds != null ? String(row.ref_odds) : null,
    sort_order: Number(row.sort_order ?? 0),
  };
}

function mapMarket(
  row: Record<string, unknown>,
  outcomes: EeslMarketOutcome[],
  poolByOutcome: Map<string, number>,
): EeslMarket {
  const withPools = outcomes
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((o) => ({ ...o, pool: poolByOutcome.get(o.id) ?? 0 }));
  const pot = withPools.reduce((s, o) => s + (o.pool ?? 0), 0);
  return {
    id: String(row.id),
    league_id: String(row.league_id),
    question: String(row.question),
    rules: String(row.rules ?? ""),
    status: row.status as EeslMarketStatus,
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_at: String(row.created_at),
    closes_at: row.closes_at != null ? String(row.closes_at) : null,
    approved_by: row.approved_by != null ? String(row.approved_by) : null,
    resolved_outcome_id:
      row.resolved_outcome_id != null ? String(row.resolved_outcome_id) : null,
    reject_reason: row.reject_reason != null ? String(row.reject_reason) : null,
    seed_key: row.seed_key != null ? String(row.seed_key) : null,
    outcomes: withPools,
    pot,
  };
}

/** Ensure balance row; seeds 100 E$L coin$ once via ensure_eesl_balance. */
export async function ensureBalance(): Promise<number> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb.rpc("ensure_eesl_balance");
  if (error) throw new Error(rpcErrorMessage(error));
  return Number(data ?? 0);
}

/**
 * List markets visible to the current user.
 * Pass statuses to filter (e.g. pending for admin tab).
 */
export async function listMarkets(
  statuses?: EeslMarketStatus[],
): Promise<EeslMarket[]> {
  const sb = getSupabase();
  if (!sb) return [];

  let q = sb
    .from("eesl_markets")
    .select(
      "id,league_id,question,rules,status,created_by,created_at,closes_at,approved_by,resolved_outcome_id,reject_reason,seed_key",
    )
    .eq("league_id", EASTSIDE_LEAGUE_ID)
    .order("created_at", { ascending: false });

  if (statuses && statuses.length > 0) {
    q = q.in("status", statuses);
  }

  const { data: markets, error } = await q;
  if (error) throw new Error(rpcErrorMessage(error));
  if (!markets?.length) return [];

  const ids = markets.map((m) => String(m.id));

  const [{ data: outcomes, error: oErr }, { data: positions, error: pErr }] =
    await Promise.all([
      sb
        .from("eesl_market_outcomes")
        .select("id,market_id,label,ref_odds,sort_order")
        .in("market_id", ids)
        .order("sort_order", { ascending: true }),
      sb
        .from("eesl_market_positions")
        .select("id,market_id,outcome_id,stake")
        .in("market_id", ids),
    ]);
  if (oErr) throw new Error(rpcErrorMessage(oErr));
  if (pErr) throw new Error(rpcErrorMessage(pErr));

  const outcomesByMarket = new Map<string, EeslMarketOutcome[]>();
  for (const row of outcomes ?? []) {
    const o = mapOutcome(row as Record<string, unknown>);
    const list = outcomesByMarket.get(o.market_id) ?? [];
    list.push(o);
    outcomesByMarket.set(o.market_id, list);
  }

  const poolByMarketOutcome = new Map<string, Map<string, number>>();
  for (const row of positions ?? []) {
    const mid = String(row.market_id);
    const oid = String(row.outcome_id);
    const stake = Number(row.stake);
    let m = poolByMarketOutcome.get(mid);
    if (!m) {
      m = new Map();
      poolByMarketOutcome.set(mid, m);
    }
    m.set(oid, (m.get(oid) ?? 0) + stake);
  }

  return markets.map((row) => {
    const id = String(row.id);
    return mapMarket(
      row as Record<string, unknown>,
      outcomesByMarket.get(id) ?? [],
      poolByMarketOutcome.get(id) ?? new Map(),
    );
  });
}

export async function listMyPositions(
  marketId?: string,
): Promise<EeslMarketPosition[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return [];

  let q = sb
    .from("eesl_market_positions")
    .select("id,market_id,user_id,outcome_id,stake,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (marketId) q = q.eq("market_id", marketId);

  const { data, error } = await q;
  if (error) throw new Error(rpcErrorMessage(error));
  return (data ?? []).map((row) => ({
    id: String(row.id),
    market_id: String(row.market_id),
    user_id: String(row.user_id),
    outcome_id: String(row.outcome_id),
    stake: Number(row.stake),
    created_at: String(row.created_at),
  }));
}

/** Propose a market (pending until admin approves). Default outcomes Yes/No. */
export async function proposeMarket(
  question: string,
  rules: string,
  closesAt: string | null,
  outcomes?: ProposeOutcomeInput[] | null,
): Promise<string> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");

  const payload =
    outcomes && outcomes.length >= 2
      ? outcomes.map((o) => ({
          label: o.label,
          ref_odds: o.ref_odds ?? null,
        }))
      : null;

  const { data, error } = await sb.rpc("propose_eesl_market", {
    p_question: question,
    p_rules: rules,
    p_closes_at: closesAt,
    p_outcomes: payload,
  });
  if (error) throw new Error(rpcErrorMessage(error));
  return String(data);
}

export async function approveMarket(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.rpc("admin_approve_eesl_market", { p_id: id });
  if (error) throw new Error(rpcErrorMessage(error));
}

export async function rejectMarket(id: string, reason: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.rpc("admin_reject_eesl_market", {
    p_id: id,
    p_reason: reason,
  });
  if (error) throw new Error(rpcErrorMessage(error));
}

export async function buyMarket(
  marketId: string,
  outcomeId: string,
  stake: number,
): Promise<string> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb.rpc("buy_eesl_market", {
    p_id: marketId,
    p_outcome_id: outcomeId,
    p_stake: stake,
  });
  if (error) throw new Error(rpcErrorMessage(error));
  return String(data);
}

/** Admin resolve — pass the winning outcome id; never invent. */
export async function resolveMarket(
  id: string,
  outcomeId: string,
): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.rpc("admin_resolve_eesl_market", {
    p_id: id,
    p_outcome_id: outcomeId,
  });
  if (error) throw new Error(rpcErrorMessage(error));
}

export async function cancelMarket(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.rpc("admin_cancel_eesl_market", { p_id: id });
  if (error) throw new Error(rpcErrorMessage(error));
}
