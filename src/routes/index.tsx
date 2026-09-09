import { createFileRoute } from "@tanstack/react-router";
import { SportsbookApp } from "@/components/sportsbook/app-shell";
import { loadScoreBoard, unavailableScoreBoard, type ScoreBoard } from "@/lib/scores";

export const Route = createFileRoute("/")({
  loader: async (): Promise<{ scores: ScoreBoard }> => {
    try {
      const scores = await loadScoreBoard();
      if (scores.status === "ready" && scores.games.length > 0) return { scores };
      return { scores: unavailableScoreBoard() };
    } catch {
      return { scores: unavailableScoreBoard() };
    }
  },
  component: Home,
});

function Home() {
  const { scores } = Route.useLoaderData();
  return <SportsbookApp initialScores={scores} />;
}
