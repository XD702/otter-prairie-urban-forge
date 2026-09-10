/**
 * E$L coin$ side-bet challenges (simulation only — not real money).
 * Same balance as Board sim bankroll when signed in (eesl_balances).
 * Code/table ids: eesl_*. User-facing label: "E$L coin$".
 * STARTING_BANKROLL = 100 seeded once via ensure_eesl_balance (never +100 again).
 */

import { getSupabase } from "@/lib/supabase/client";
import { EASTSIDE_LEAGUE_ID } from "@/lib/supabase/league-chat";

/** User-facing currency label — exact branding. */
export const EESL_LABEL = "E$L coin$";

/** Matches STARTING_BANKROLL in src/lib/betting/store.ts and SQL seed. */
export const EESL_STARTING_BALANCE = 100;

export const EESL_SIM_DISCLAIMER = "Simulation only — not real money.";

export type EeslChallengeStatus =
  | "open"
  | "accepted"
  | "declined"
  | "settled"
  | "canceled";

export type EeslSettleResult = "challenger" | "opponent" | "push";

export type EeslChallenge = {
  id: string;
  league_id: string;
  challenger_id: string;
  opponent_id: string;
  stake: number;
  terms: string;
  status: EeslChallengeStatus;
  winner_id: string | null;
  settled_as: EeslSettleResult | null;
  created_at: string;
  updated_at: string;
};

function mapChallenge(row: Record<string, unknown>): EeslChallenge {
  return {
    id: String(row.id),
    league_id: String(row.league_id),
    challenger_id: String(row.challenger_id),
    opponent_id: String(row.opponent_id),
    stake: Number(row.stake),
    terms: String(row.terms),
    status: row.status as EeslChallengeStatus,
    winner_id: row.winner_id != null ? String(row.winner_id) : null,
    settled_as: (row.settled_as as EeslSettleResult | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function rpcErrorMessage(err: { message?: string; details?: string }): string {
  const raw = `${err.message ?? ""} ${err.details ?? ""}`.toLowerCase();
  if (raw.includes("eesl_insufficient") || raw.includes("challenger_insufficient")) {
    return `Not enough ${EESL_LABEL} for this stake.`;
  }
  if (raw.includes("eesl_not_member") || raw.includes("opponent_not_member")) {
    return "Both players must be Eastside chat members.";
  }
  if (raw.includes("eesl_invalid_opponent")) {
    return "Pick a different opponent.";
  }
  if (raw.includes("eesl_invalid_stake")) {
    return "Stake must be greater than zero.";
  }
  if (raw.includes("eesl_invalid_terms")) {
    return "Terms required (1–280 characters).";
  }
  if (raw.includes("eesl_bad_status")) {
    return "Challenge is not in the right status for that action.";
  }
  if (raw.includes("eesl_forbidden")) {
    return "You can’t do that on this challenge.";
  }
  if (raw.includes("eesl_not_found")) {
    return "Challenge not found.";
  }
  if (raw.includes("eesl_unauth")) {
    return "Sign in to use E$L coin$ challenges.";
  }
  if (raw.includes("eesl_invalid_result")) {
    return "Settle as challenger, opponent, or push.";
  }
  return err.message || "E$L coin$ request failed.";
}

/**
 * Ensure balance row exists; returns current balance.
 * Seeds 100 E$L coin$ only on first touch — never credits again.
 */
export async function ensureBalance(): Promise<number> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb.rpc("ensure_eesl_balance");
  if (error) throw new Error(rpcErrorMessage(error));
  return Number(data ?? 0);
}

/** Read own balance row (null if none / logged out / no client). */
export async function getBalance(): Promise<number | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb
    .from("eesl_balances")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(rpcErrorMessage(error));
  if (!data) return null;
  return Number(data.balance);
}

/**
 * Challenges where the current user is challenger or opponent.
 * Optionally filter by status list (default: open + accepted for the panel).
 */
export async function listChallenges(
  statuses: EeslChallengeStatus[] = ["open", "accepted"],
): Promise<EeslChallenge[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return [];

  let q = sb
    .from("eesl_challenges")
    .select(
      "id,league_id,challenger_id,opponent_id,stake,terms,status,winner_id,settled_as,created_at,updated_at",
    )
    .eq("league_id", EASTSIDE_LEAGUE_ID)
    .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (statuses.length > 0) {
    q = q.in("status", statuses);
  }

  const { data, error } = await q;
  if (error) throw new Error(rpcErrorMessage(error));
  return (data ?? []).map((row) => mapChallenge(row as Record<string, unknown>));
}

/** Create open challenge — checks funds, does NOT deduct until accept. */
export async function createChallenge(
  opponentId: string,
  stake: number,
  terms: string,
): Promise<string> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb.rpc("create_eesl_challenge", {
    p_opponent: opponentId,
    p_stake: stake,
    p_terms: terms,
  });
  if (error) throw new Error(rpcErrorMessage(error));
  return String(data);
}

/** Opponent accepts: each puts up stake; pot = 2×stake. */
export async function acceptChallenge(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.rpc("accept_eesl_challenge", { p_id: id });
  if (error) throw new Error(rpcErrorMessage(error));
}

/** Opponent declines — no balance change. */
export async function declineChallenge(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.rpc("decline_eesl_challenge", { p_id: id });
  if (error) throw new Error(rpcErrorMessage(error));
}

/** Challenger cancels while open — no balance change. */
export async function cancelChallenge(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.rpc("cancel_eesl_challenge", { p_id: id });
  if (error) throw new Error(rpcErrorMessage(error));
}

/**
 * Settle accepted challenge.
 * challenger|opponent → winner gets 2×stake; push → refund stake each.
 */
export async function settleChallenge(
  id: string,
  result: EeslSettleResult,
): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.rpc("settle_eesl_challenge", {
    p_id: id,
    p_result: result,
  });
  if (error) throw new Error(rpcErrorMessage(error));
}

export type EeslOpponentOption = {
  userId: string;
  label: string;
  teamName?: string | null;
};

/**
 * Opponents = chat members except self, optionally enriched with team claim names.
 */
export async function listOpponentOptions(
  selfUserId: string,
): Promise<EeslOpponentOption[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data: members, error: mErr } = await sb
    .from("league_chat_members")
    .select("user_id,display_name")
    .eq("league_id", EASTSIDE_LEAGUE_ID)
    .order("joined_at", { ascending: true });
  if (mErr) throw new Error(rpcErrorMessage(mErr));

  const { data: claims } = await sb
    .from("league_team_claims")
    .select("user_id,team_name")
    .eq("league_id", EASTSIDE_LEAGUE_ID);

  const claimMap = new Map<string, string>();
  for (const c of claims ?? []) {
    claimMap.set(String(c.user_id), String(c.team_name));
  }

  return (members ?? [])
    .filter((m) => String(m.user_id) !== selfUserId)
    .map((m) => {
      const userId = String(m.user_id);
      const teamName = claimMap.get(userId) ?? null;
      const display = String(m.display_name || "Member");
      return {
        userId,
        label: teamName ? `${display} · ${teamName}` : display,
        teamName,
      };
    });
}
