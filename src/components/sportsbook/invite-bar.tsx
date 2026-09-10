import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { inviteEmailRedirectTo } from "@/lib/supabase/invite";

type InviteBarProps = {
  /** Override redirect; default is current join URL with code=EASTSIDE. */
  redirectTo?: string;
  /** Compact label for join page. */
  heading?: string;
};

/**
 * Supabase magic-link strip for the invite/join flow.
 *
 * Laptop /login may still use better-auth email+password.
 * Chat RLS needs Supabase auth.uid() — this bar uses signInWithOtp only.
 * Real emails only; no invented accounts.
 */
export function InviteBar({
  redirectTo,
  heading = "Join with magic link",
}: InviteBarProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!supabaseConfigured) {
    return (
      <p className="rounded-xl border border-gold/20 px-3 py-2 text-xs text-muted">
        Supabase env not set — cannot send invite magic links.
      </p>
    );
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    const trimmed = email.trim();
    if (!sb || !trimmed) return;
    setBusy(true);
    setStatus(null);
    const target = redirectTo ?? inviteEmailRedirectTo();
    const { error } = await sb.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: target,
      },
    });
    setBusy(false);
    setStatus(
      error
        ? error.message
        : `Check ${trimmed} for the magic link. You’ll land back on Join.`,
    );
  }

  return (
    <form
      onSubmit={sendMagicLink}
      className="rounded-2xl border border-gold/25 bg-felt-deep/80 p-4"
    >
      <h3 className="font-display text-base text-gold">{heading}</h3>
      <p className="mt-1 text-xs text-muted">
        Supabase magic link (not the /login better-auth form). Use your real
        email — no invented accounts.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          required
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          className="flex-1"
        />
        <Button type="submit" variant="felt" disabled={busy || !email.trim()}>
          {busy ? "Sending…" : "Email me a link"}
        </Button>
      </div>
      {status ? <p className="mt-2 text-xs text-gold">{status}</p> : null}
    </form>
  );
}
