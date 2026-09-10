import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  claimTeam,
  listClaims,
  myClaim,
  resolveTeamOptions,
  type LeagueTeamClaim,
  type TeamOption,
} from "@/lib/supabase/team-claims";
import { useSupabaseSession } from "@/lib/supabase/use-session";

type TeamPickerProps = {
  /** True when user is in league_chat_members. */
  isMember: boolean;
  /** Optional refresh tick from parent after join. */
  refreshKey?: number;
  onClaimed?: (claim: LeagueTeamClaim) => void;
};

/**
 * Lists the 12 Yahoo team NAMES only (never "Team 1–12").
 * Taken / Available by name. Claim uses stable team_id under the hood.
 * First claim wins.
 */
export function TeamPicker({
  isMember,
  refreshKey = 0,
  onClaimed,
}: TeamPickerProps) {
  const { user, ready } = useSupabaseSession();
  const options = useMemo(() => resolveTeamOptions(), []);
  const [claims, setClaims] = useState<LeagueTeamClaim[]>([]);
  const [mine, setMine] = useState<LeagueTeamClaim | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ready || !user) {
      setClaims([]);
      setMine(null);
      return;
    }
    try {
      setError(null);
      const [all, own] = await Promise.all([listClaims(), myClaim(user.id)]);
      setClaims(all);
      setMine(own);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load claims.");
    }
  }, [ready, user]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const claimedByTeam = useMemo(() => {
    const map = new Map<string, LeagueTeamClaim>();
    for (const c of claims) map.set(c.team_id, c);
    return map;
  }, [claims]);

  async function onClaim(opt: TeamOption) {
    if (!user || !isMember || mine || busyId) return;
    setBusyId(opt.teamId);
    setError(null);
    try {
      const status = await claimTeam(opt.teamId);
      if (status === "ok" || status === "already") {
        await load();
        const own = await myClaim(user.id);
        if (own) onClaimed?.(own);
      } else if (status === "taken") {
        setError(`${opt.teamName} was just taken — pick another.`);
        await load();
      } else if (status === "not_member") {
        setError("Join league chat first, then claim a team.");
      } else if (status === "unauth") {
        setError("Sign in with the invite magic link first.");
      } else {
        setError("Could not claim that team.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Claim failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (!ready) {
    return (
      <p className="text-sm text-muted">Loading teams…</p>
    );
  }

  if (!user) {
    return (
      <p className="text-sm text-muted">
        Sign in with the invite magic link to claim a Yahoo team by name.
      </p>
    );
  }

  return (
    <section className="rounded-2xl border border-gold/25 bg-felt-deep/60 p-4">
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="font-display text-lg text-gold">Pick your team</h3>
          <p className="text-xs text-muted">
            Exact Yahoo names · one team per person · first claim wins
          </p>
        </div>
        {mine ? (
          <span className="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold">
            Yours: {mine.team_name}
          </span>
        ) : null}
      </header>

      {!isMember ? (
        <p className="mb-3 text-xs text-amber-300">
          Join the league chat room first (max 12), then claim a team.
        </p>
      ) : null}

      <ul className="grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const claim = claimedByTeam.get(opt.teamId);
          const taken = Boolean(claim);
          const isMine = mine?.team_id === opt.teamId;
          const canClaim =
            isMember && !mine && !taken && !busyId;
          return (
            <li
              key={opt.teamId}
              className="flex items-center justify-between gap-2 rounded-xl border border-gold/20 bg-felt/40 px-3 py-2"
            >
              <div className="min-w-0">
                {/* UI shows teamName only — never numbered Team 1–12 */}
                <p className="truncate text-sm font-medium text-cream">
                  {opt.teamName}
                </p>
                <p className="text-[11px] text-muted">
                  {isMine
                    ? "Your claim"
                    : taken
                      ? "Taken"
                      : "Available"}
                </p>
              </div>
              {canClaim ? (
                <Button
                  type="button"
                  variant="felt"
                  disabled={busyId === opt.teamId}
                  onClick={() => void onClaim(opt)}
                >
                  {busyId === opt.teamId ? "…" : "Claim"}
                </Button>
              ) : (
                <span
                  className={
                    isMine
                      ? "text-xs text-gold"
                      : taken
                        ? "text-xs text-muted"
                        : "text-xs text-muted"
                  }
                >
                  {isMine ? "Claimed" : taken ? "Taken" : "—"}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {error ? <p className="mt-3 text-xs text-amber-300">{error}</p> : null}
    </section>
  );
}
