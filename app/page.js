import {
  getLeaderboard,
  getTodayLeaderboard,
  getHallOfFame,
  getRecentActivity,
  getStats,
} from "@/lib/store";
import Home from "./components/Home";

// The leaderboard changes every time someone pays, so it must never be
// served from a stale, build-time cache.
export const dynamic = "force-dynamic";

export default async function Page() {
  const [allTimeProjects, todayProjects, hallOfFame, recentActivity, stats] =
    await Promise.all([
      getLeaderboard(),
      getTodayLeaderboard(),
      getHallOfFame(),
      getRecentActivity(),
      getStats(),
    ]);

  return (
    <Home
      allTimeProjects={allTimeProjects}
      todayProjects={todayProjects}
      hallOfFame={hallOfFame}
      recentActivity={recentActivity}
      stats={stats}
    />
  );
}
