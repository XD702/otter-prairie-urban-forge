import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvitePanel } from "@/components/sportsbook/invite-panel";
import { Input } from "@/components/ui/input";
import {
  LEAGUE_CHAT_CAP,
  joinLeagueChat,
  loadLeagueChat,
  sendLeagueMessage,
  type LeagueChatMember,
  type LeagueChatMessage,
} from "@/lib/chat/league";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { myClaim, type LeagueTeamClaim } from "@/lib/supabase/team-claims";
import { useSupabaseSession } from "@/lib/supabase/use-session";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function LeagueChat() {
  const { user, isPending } = useCurrentUserState();
  const [members, setMembers] = useState<LeagueChatMember[]>([]);
  const [messages, setMessages] = useState<LeagueChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);
  const [full, setFull] = useState(false);
  const [claim, setClaim] = useState<LeagueTeamClaim | null>(null);
  const { user: sbUser } = useSupabaseSession();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const name = useMemo(() => {
    if (!user) return "Member";
    if (user.displayName?.trim()) return user.displayName.trim();
    if (user.primaryEmail?.trim()) return user.primaryEmail.trim();
    return "Member";
  }, [user]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!sbUser) {
        if (alive) setClaim(null);
        return;
      }
      try {
        const own = await myClaim(sbUser.id);
        if (alive) setClaim(own);
      } catch {
        if (alive) setClaim(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [sbUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (isPending || !user) return;
    let alive = true;

    async function refresh() {
      try {
        const snap = await loadLeagueChat();
        if (!alive) return;
        setMembers(snap.members);
        setMessages(snap.messages);
        setJoined(snap.joined);
        setFull(snap.full);
        setError(null);
        return snap;
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Could not load chat.");
        return null;
      }
    }

    (async () => {
      const snap = await refresh();
      if (!alive || !snap) return;
      if (!snap.joined && !snap.full) {
        try {
          const result = await joinLeagueChat({ data: name });
          if (!alive) return;
          if (!result.ok) {
            setError(result.reason ?? "League chat is full.");
            setFull(true);
          } else {
            setJoined(true);
            await refresh();
          }
        } catch (e) {
          if (!alive) return;
          setError(e instanceof Error ? e.message : "Could not join chat.");
        }
      } else if (!snap.joined && snap.full) {
        setError(`League chat is full (${LEAGUE_CHAT_CAP}/${LEAGUE_CHAT_CAP}).`);
      }
    })();

    const timer = window.setInterval(() => {
      void refresh();
    }, 4000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [isPending, user, name]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !joined || busy) return;
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    try {
      const msg = await sendLeagueMessage({ data: text });
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setDraft("");
      const snap = await loadLeagueChat();
      setMembers(snap.members);
      setMessages(snap.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed.");
    } finally {
      setBusy(false);
    }
  }

  if (isPending) {
    return (
      <section className="casino-card rounded-2xl border border-gold/25 p-5 text-sm text-muted">
        Loading chat…
      </section>
    );
  }

  if (!user) {
    return (
      <section className="casino-card rounded-2xl border border-gold/25 p-5">
        <div className="mb-3 flex items-center gap-2 text-gold">
          <MessageCircle className="size-5" />
          <h2 className="font-display text-xl">League chat</h2>
        </div>
        <p className="mb-4 text-sm text-muted">
          Friends: open the invite link to magic-link in and pick your Yahoo team.
          Or sign up with email/password for chat. Max {LEAGUE_CHAT_CAP} members.
          The board stays open without an account.
        </p>
        <div className="flex flex-wrap gap-2">
        <Link
          to="/join"
          search={{ code: "EASTSIDE" }}
          className="inline-flex min-h-11 items-center rounded-full border border-gold/40 px-4 text-sm text-gold hover:border-gold hover:bg-gold/10"
        >
          Invite / pick team
        </Link>
        <Link
          to="/login"
          className="inline-flex min-h-11 items-center rounded-full border border-gold/40 px-4 text-sm text-gold hover:border-gold hover:bg-gold/10"
        >
          Sign up for chat
        </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="casino-card flex min-h-[28rem] flex-col rounded-2xl border border-gold/25">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-5 text-gold" />
          <div>
            <h2 className="font-display text-lg text-cream">League chat</h2>
            <p className="text-xs text-muted">Eastside Legends · simulation only</p>
          </div>
        </div>
        <span className="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold">
          {members.length}/{LEAGUE_CHAT_CAP} members
        </span>
        <div className="w-full basis-full">
          <InvitePanel
            memberCount={members.length}
            myClaim={claim}
            showMagicLinkField={false}
          />
        </div>
      </header>

      <div className="border-b border-gold/15 px-4 py-2">
        <p className="text-[11px] uppercase tracking-wide text-muted">In room</p>
        <ul className="mt-1 flex flex-wrap gap-2">
          {members.map((m) => (
            <li
              key={m.user_id}
              className="rounded-full border border-gold/25 px-2 py-0.5 text-xs text-cream"
            >
              {m.display_name}
            </li>
          ))}
          {members.length === 0 ? (
            <li className="text-xs text-muted">No members yet — you’re first.</li>
          ) : null}
        </ul>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted">No messages yet. Say hi.</p>
        ) : (
          messages.map((msg) => (
            <article key={msg.id} className="rounded-xl bg-felt-deep/60 px-3 py-2">
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-gold">{msg.display_name}</span>
                <time className="text-[11px] text-muted">{formatTime(msg.created_at)}</time>
              </div>
              <p className="whitespace-pre-wrap text-sm text-cream">{msg.body}</p>
            </article>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error ? <p className="px-4 pb-2 text-xs text-amber-300">{error}</p> : null}

      <form onSubmit={onSend} className="flex gap-2 border-t border-gold/20 px-4 py-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            !joined && full
              ? "Room is full (12/12)"
              : joined
                ? "Message the league…"
                : "Joining…"
          }
          disabled={!joined || busy}
          maxLength={2000}
          className="flex-1"
        />
        <Button type="submit" variant="felt" disabled={!joined || busy || !draft.trim()}>
          Send
        </Button>
      </form>
    </section>
  );
}
