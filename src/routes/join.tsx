import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { InviteBar } from "@/components/sportsbook/invite-bar";
import { TeamPicker } from "@/components/sportsbook/team-picker";
import { Button } from "@/components/ui/button";
import { supabaseConfigured } from "@/lib/supabase/client";
import {
  INVITE_CODE,
  inviteEmailRedirectTo,
  markOpenChatOnHome,
  parseInviteFromLocation,
} from "@/lib/supabase/invite";
import {
  LEAGUE_CHAT_CAP,
  fetchLeagueMembers,
  joinLeagueChat,
} from "@/lib/supabase/league-chat";
import { myClaim, type LeagueTeamClaim } from "@/lib/supabase/team-claims";
import { useSupabaseSession } from "@/lib/supabase/use-session";

/**
 * /join?code=EASTSIDE
 *
 * Auth: Supabase magic link via InviteBar (signInWithOtp).
 * /login is a separate Better Auth club account — it does NOT land in chat.
 * After session: auto joinLeagueChat → team picker (Yahoo names) → Open Chat.
 */

type JoinSearch = {
  code?: string;
};

export const Route = createFileRoute("/join")({
  validateSearch: (search: Record<string, unknown>): JoinSearch => ({
    code: typeof search.code === "string" ? search.code : undefined,
  }),
  component: JoinPage,
});

function displayFromUser(
  email?: string | null,
  metaName?: string | null,
): string {
  if (metaName?.trim()) return metaName.trim();
  if (email?.trim()) return email.trim();
  return "Member";
}

function JoinPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { session, ready, user } = useSupabaseSession();
  const invite = useMemo(
    () => parseInviteFromLocation({ code: search.code ?? null }),
    [search.code],
  );

  const [memberCount, setMemberCount] = useState(0);
  const [joined, setJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [claim, setClaim] = useState<LeagueTeamClaim | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [busyJoin, setBusyJoin] = useState(false);

  const name = useMemo(
    () =>
      displayFromUser(
        user?.email,
        typeof user?.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : typeof user?.user_metadata?.name === "string"
            ? user.user_metadata.name
            : null,
      ),
    [user],
  );

  void session;

  useEffect(() => {
    if (!ready || !user || !invite.valid || !supabaseConfigured) return;
    let alive = true;
    (async () => {
      setBusyJoin(true);
      setJoinError(null);
      try {
        const ok = await joinLeagueChat(name);
        if (!alive) return;
        setJoined(ok);
        if (!ok) {
          setJoinError(`League chat is full (${LEAGUE_CHAT_CAP}/${LEAGUE_CHAT_CAP}).`);
        }
        const members = await fetchLeagueMembers();
        if (!alive) return;
        setMemberCount(members.length);
        const inRoom = members.some((m) => m.user_id === user.id);
        setJoined(inRoom || ok);
        const own = await myClaim(user.id);
        if (!alive) return;
        setClaim(own);
        setRefreshKey((k) => k + 1);
      } catch (e) {
        if (!alive) return;
        setJoinError(e instanceof Error ? e.message : "Could not join chat.");
      } finally {
        if (alive) setBusyJoin(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ready, user, name, invite.valid]);

  function openChat() {
    markOpenChatOnHome();
    void navigate({ to: "/" });
  }

  return (
    <div className="min-h-dvh bg-felt px-4 py-8 text-cream">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <header className="casino-card rounded-2xl border border-gold/25 p-5">
          <p className="club-kicker">East Side Social Club · After Dark</p>
          <h1 className="mt-2 font-display text-3xl text-gold">Join the league</h1>
          <p className="mt-2 text-sm text-muted">
            Magic link → chat (max {LEAGUE_CHAT_CAP}) → claim one Yahoo team by
            name. First claim wins.
          </p>
          <p className="mt-2 text-xs text-gold/80">
            Simulation only. E$L coin$ — no real money. After Dark hangout, not a
            bank or bookmaker login.
          </p>
          <p className="mt-2 text-xs text-muted">
            Code:{" "}
            <span className="text-gold">{search.code ?? "(missing)"}</span>
            {invite.valid ? " ✓" : ` — expected ${INVITE_CODE}`}
          </p>
        </header>

        {!invite.valid ? (
          <section className="casino-card rounded-2xl border border-amber-500/40 p-5 text-sm text-amber-200">
            Invalid or missing invite code. Ask Rob for{" "}
            <code className="text-gold">/join?code={INVITE_CODE}</code>.
          </section>
        ) : null}

        {!supabaseConfigured ? (
          <section className="casino-card rounded-2xl border border-gold/25 p-5 text-sm text-muted">
            <p className="font-display text-gold">Chat lock is on</p>
            <p className="mt-2">
              League chat needs the club's live key wired on this host. Rob:
              paste <span className="text-cream">VITE_SUPABASE_ANON_KEY</span>{" "}
              (anon only — never service_role) into the app env, then republish.
              Project <code className="text-gold">yqnbeksemcgmggframnd</code>.
            </p>
          </section>
        ) : null}

        {invite.valid && supabaseConfigured && !ready ? (
          <p className="text-sm text-muted">Checking session…</p>
        ) : null}

        {invite.valid && supabaseConfigured && ready && !user ? (
          <InviteBar
            redirectTo={inviteEmailRedirectTo()}
            heading="Sign in to claim a team"
          />
        ) : null}

        {invite.valid && supabaseConfigured && ready && user ? (
          <>
            <section className="casino-card rounded-2xl border border-gold/25 p-5">
              <p className="text-sm text-cream">
                Signed in as{" "}
                <span className="text-gold">{user.email ?? name}</span>
              </p>
              <p className="mt-1 text-xs text-muted">
                {busyJoin
                  ? "Joining league chat…"
                  : joined
                    ? `In room · ${memberCount}/${LEAGUE_CHAT_CAP} members`
                    : joinError ?? "Not in room yet"}
              </p>
              {joinError ? (
                <p className="mt-2 text-xs text-amber-300">{joinError}</p>
              ) : null}
              {claim ? (
                <p className="mt-2 text-xs text-gold">
                  Claimed team: {claim.team_name}
                </p>
              ) : null}
            </section>

            <TeamPicker
              isMember={joined}
              refreshKey={refreshKey}
              onClaimed={(c) => setClaim(c)}
            />

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="felt"
                disabled={!joined}
                onClick={openChat}
              >
                Open Chat
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => void navigate({ to: "/" })}
              >
                Board home
              </Button>
            </div>
          </>
        ) : null}

        <p className="text-[11px] text-muted">
          League chat uses this Join magic link (Supabase). The laptop{" "}
          <Link to="/login" className="text-gold underline-offset-4 hover:underline">
            /login
          </Link>{" "}
          form is a separate club account and will not open chat.
        </p>
      </div>
    </div>
  );
}
