/**
 * Eastside team claims — one Yahoo team per chat member.
 * UI shows exact Yahoo teamName only (never "Team 1–12").
 * Persist via stable team_id; first claim wins (RPC claim_eastside_team).
 */

import { getSupabase } from "@/lib/supabase/client";
import { TEAMS } from "@/lib/fantasy";
import { EASTSIDE_LEAGUE_ID } from "@/lib/supabase/league-chat";

export type ClaimStatus =
  | "ok"
  | "taken"
  | "already"
  | "not_member"
  | "invalid"
  | "unauth";

export type TeamOption = {
  /** Stable id for RPC / DB (e.g. go-birds). Never shown as "Team N". */
  teamId: string;
  /** Exact Yahoo display name — UI label only. */
  teamName: string;
};

export type LeagueTeamClaim = {
  league_id: string;
  team_id: string;
  team_name: string;
  user_id: string;
  claimed_at: string;
};

/** Exact Yahoo names from fantasy TEAMS seed — UI must list these only. */
export const TEAM_OPTIONS: TeamOption[] = TEAMS.map((t) => ({
  teamId: t.id,
  teamName: t.teamName,
}));

/** Fallback if TEAMS import shape differs — same 12 names/ids. */
export const TEAM_OPTIONS_FALLBACK: TeamOption[] = [
  { teamId: "go-birds", teamName: "Go birds D**k head" },
  { teamId: "gibb-it-to-me-baby", teamName: "Gibb it to me Baby" },
  { teamId: "goodwrench", teamName: "Goodwrench" },
  { teamId: "apache-dogs", teamName: "APACHEDOGS" },
  { teamId: "juice-booze", teamName: "Juice & Booze" },
  { teamId: "taylor-gang", teamName: "Taylor Gang" },
  { teamId: "cheesehead-hooligans", teamName: "Cheesehead hooligans" },
  { teamId: "zenahc-cool-arrows", teamName: "Zenahc cool arrows" },
  { teamId: "tds-in-yo-face", teamName: "TDsInYoFace" },
  { teamId: "such-a-burden", teamName: "Such a Burden" },
  { teamId: "cheese-me", teamName: "Cheese me!" },
  { teamId: "wstd-mngmnt", teamName: "WSTD MNGMNT" },
];

export function resolveTeamOptions(): TeamOption[] {
  if (Array.isArray(TEAM_OPTIONS) && TEAM_OPTIONS.length === 12) {
    return TEAM_OPTIONS;
  }
  return TEAM_OPTIONS_FALLBACK;
}

export function teamNameForId(teamId: string): string | null {
  return (
    resolveTeamOptions().find((t) => t.teamId === teamId)?.teamName ?? null
  );
}

export async function listClaims(): Promise<LeagueTeamClaim[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("league_team_claims")
    .select("league_id,team_id,team_name,user_id,claimed_at")
    .eq("league_id", EASTSIDE_LEAGUE_ID)
    .order("claimed_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LeagueTeamClaim[];
}

export async function myClaim(
  userId: string | null | undefined,
): Promise<LeagueTeamClaim | null> {
  if (!userId) return null;
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("league_team_claims")
    .select("league_id,team_id,team_name,user_id,claimed_at")
    .eq("league_id", EASTSIDE_LEAGUE_ID)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as LeagueTeamClaim | null) ?? null;
}

/**
 * Claim a team by stable id. Resolves exact Yahoo name for the RPC.
 * Returns status: ok | taken | already | not_member | invalid | unauth
 */
export async function claimTeam(teamId: string): Promise<ClaimStatus> {
  const sb = getSupabase();
  if (!sb) return "unauth";
  const opt = resolveTeamOptions().find((t) => t.teamId === teamId);
  if (!opt) return "invalid";
  const { data, error } = await sb.rpc("claim_eastside_team", {
    p_team_id: opt.teamId,
    p_team_name: opt.teamName,
  });
  if (error) throw error;
  const status = String(data ?? "invalid") as ClaimStatus;
  const allowed: ClaimStatus[] = [
    "ok",
    "taken",
    "already",
    "not_member",
    "invalid",
    "unauth",
  ];
  return allowed.includes(status) ? status : "invalid";
}

export async function releaseMyClaim(): Promise<string> {
  const sb = getSupabase();
  if (!sb) return "unauth";
  const { data, error } = await sb.rpc("release_eastside_team");
  if (error) throw error;
  return String(data ?? "none");
}
