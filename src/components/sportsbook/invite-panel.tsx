import { useEffect, useState } from "react";
import { Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LEAGUE_CHAT_CAP } from "@/lib/supabase/league-chat";
import {
  buildInviteUrl,
  inviteEmailRedirectTo,
} from "@/lib/supabase/invite";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import type { LeagueTeamClaim } from "@/lib/supabase/team-claims";

type InvitePanelProps = {
  memberCount: number;
  /** Current user's claim badge (Yahoo name). */
  myClaim?: LeagueTeamClaim | null;
  /** Show optional magic-link email field (real emails only). */
  showMagicLinkField?: boolean;
};

/**
 * Header strip: copy invite link + n/12 + claimed team badge.
 */
export function InvitePanel({
  memberCount,
  myClaim = null,
  showMagicLinkField = false,
}: InvitePanelProps) {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");

  useEffect(() => {
    setInviteUrl(buildInviteUrl());
  }, []);

  function currentInviteUrl() {
    return inviteUrl || buildInviteUrl();
  }

  async function copyLink() {
    const url = currentInviteUrl();
    if (!url) {
      setStatus("Invite link is not ready yet — refresh and try again.");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setStatus("Copy failed — select the link manually.");
    }
  }

  async function sendInviteOtp(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    const trimmed = email.trim();
    if (!sb || !trimmed) return;
    setBusy(true);
    setStatus(null);
    const { error } = await sb.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: inviteEmailRedirectTo() },
    });
    setBusy(false);
    setStatus(
      error
        ? error.message
        : `Magic link sent to ${trimmed}. They'll land on Join.`,
    );
    if (!error) setEmail("");
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gold/20 bg-felt-deep/50 px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link2 className="size-4 text-gold" />
          <span className="text-xs text-muted">Invite</span>
          <code className="max-w-[14rem] truncate rounded border border-gold/20 px-2 py-0.5 text-[11px] text-cream sm:max-w-xs">
            {inviteUrl || "Preparing link…"}
          </code>
          <Button
            type="button"
            variant="felt"
            className="h-8 px-2 text-xs"
            onClick={() => void copyLink()}
          >
            <Copy className="mr-1 size-3" />
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold">
            {memberCount}/{LEAGUE_CHAT_CAP} members
          </span>
          {myClaim ? (
            <span className="rounded-full border border-gold/30 px-3 py-1 text-xs text-cream">
              {myClaim.team_name}
            </span>
          ) : null}
        </div>
      </div>

      {showMagicLinkField && supabaseConfigured ? (
        <form
          onSubmit={sendInviteOtp}
          className="flex flex-col gap-2 border-t border-gold/15 pt-2 sm:flex-row sm:items-center"
        >
          <Input
            type="email"
            autoComplete="email"
            placeholder="Friend's real email (optional)"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            className="h-8 flex-1 text-xs"
          />
          <Button
            type="submit"
            variant="felt"
            className="h-8 text-xs"
            disabled={busy || !email.trim()}
          >
            {busy ? "Sending…" : "Send magic link"}
          </Button>
        </form>
      ) : null}

      {status ? <p className="text-[11px] text-gold">{status}</p> : null}
    </div>
  );
}
