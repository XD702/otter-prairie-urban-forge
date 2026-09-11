import { useState, type FormEvent } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GROK_PROVIDERS,
  authClient,
  authEnabled,
  signIn,
} from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [mode, setMode] = useState<"signup" | "signin">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!authEnabled) return;
    setBusy(true);
    setStatus(null);
    try {
      if (mode === "signup") {
        const { error } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.trim().split("@")[0] || "Member",
        });
        if (error) {
          setStatus(error.message ?? "Could not create the account.");
          return;
        }
      } else {
        const { error } = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (error) {
          setStatus(error.message ?? "Could not sign in.");
          return;
        }
      }
      window.location.assign("/");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="felt-bg grid min-h-dvh place-items-center p-6 text-cream">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-gold/25 bg-felt-deep/90 p-6">
        <div>
          <p className="club-kicker">East Side Social Club · After Dark</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            {mode === "signup" ? "Club account" : "Club account"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Simulation only. E$L coin$ — no real money. This is a club profile,
            not Yahoo, Grok, or bank login.
          </p>
        </div>

        <section className="rounded-xl border border-gold/35 bg-gold/10 p-4 text-sm text-cream">
          <p className="font-display text-gold">League chat is next door</p>
          <p className="mt-1 text-muted">
            A club account here does not open group chat. Chat needs the invite
            magic link so the room can see you.
          </p>
          <Link
            to="/join"
            search={{ code: "EASTSIDE" }}
            className="mt-3 inline-flex min-h-11 items-center rounded-full border border-gold bg-gold px-4 text-sm font-semibold text-ink"
          >
            Join chat with invite
          </Link>
        </section>

        {authEnabled ? (
          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" ? (
              <label className="block space-y-1 text-sm">
                <span className="text-muted">Display name</span>
                <Input
                  name="name"
                  autoComplete="name"
                  placeholder="Your name at the club"
                  value={name}
                  onChange={(ev) => setName(ev.target.value)}
                />
              </label>
            ) : null}
            <label className="block space-y-1 text-sm">
              <span className="text-muted">Email</span>
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-muted">Password</span>
              <Input
                type="password"
                required
                minLength={8}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
              />
            </label>
            <Button type="submit" variant="gold" className="w-full" disabled={busy}>
              {busy
                ? "Working…"
                : mode === "signup"
                  ? "Create club account"
                  : "Sign in to club account"}
            </Button>
            {status ? <p className="text-sm text-loss">{status}</p> : null}
          </form>
        ) : (
          <p className="text-sm text-muted">Club accounts are disabled here.</p>
        )}

        <p className="text-sm text-muted">
          {mode === "signup" ? "Already have a club account?" : "New here?"}{" "}
          <button
            type="button"
            className="text-gold underline-offset-4 hover:underline"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setStatus(null);
            }}
          >
            {mode === "signup" ? "Sign in" : "Create a club account"}
          </button>
        </p>

        {authEnabled ? (
          <div className="space-y-2 border-t border-gold/20 pt-4">
            <p className="text-xs uppercase tracking-wide text-muted">Or continue with</p>
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="felt"
                className="w-full"
                onClick={() => {
                  void signIn(p.providerId, { callbackURL: "/" });
                }}
              >
                Continue with {p.label}
              </Button>
            ))}
          </div>
        ) : null}

        <p className="text-center text-sm">
          <Link to="/" className="text-gold underline-offset-4 hover:underline">
            Back to the board
          </Link>
        </p>
      </div>
    </main>
  );
}
