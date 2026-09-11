import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { markOpenChatOnHome } from "@/lib/supabase/invite";

export const Route = createFileRoute("/chat")({
  component: ChatDeepLink,
});

/** `/chat` used to 404. Open League → Chat on the board. */
function ChatDeepLink() {
  const navigate = useNavigate();

  useEffect(() => {
    markOpenChatOnHome();
    void navigate({ to: "/" });
  }, [navigate]);

  return (
    <main className="felt-bg grid min-h-dvh place-items-center p-6 text-cream">
      <div className="max-w-md rounded-2xl border border-gold/25 bg-void/90 p-6 text-center">
        <p className="club-kicker">After Dark</p>
        <h1 className="mt-2 font-display text-2xl text-gold">Opening league chat</h1>
        <p className="mt-2 text-sm text-muted">
          Simulation only. E$L coin$ — no real money.
        </p>
      </div>
    </main>
  );
}
