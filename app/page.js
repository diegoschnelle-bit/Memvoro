import {
  getLeaderboard,
  getTodayLeaderboard,
  getHallOfFame,
  getRecentActivity,
  getStats,
  getThroneSince,
} from "@/lib/store";
import Home from "./components/Home";

// The leaderboard changes every time someone pays, so it must never be
// served from a stale, build-time cache.
export const dynamic = "force-dynamic";

export default async function Page() {
  const [
    allTimeProjects,
    todayProjects,
    hallOfFame,
    recentActivity,
    stats,
    throneAllTime,
    throneToday,
  ] = await Promise.all([
    getLeaderboard(),
    getTodayLeaderboard(),
    getHallOfFame(),
    getRecentActivity(),
    getStats(),
    getThroneSince(false),
    getThroneSince(true),
  ]);

  // Tag each recent-activity entry that was the exact bid which took #1,
  // so the ticker/activity feed can say "took #1" instead of "added $X".
  const leadershipBidIds = new Set(throneAllTime?.leadershipChangeBidIds || []);
  const taggedActivity = recentActivity.map((a) => ({
    ...a,
    tookLead: leadershipBidIds.has(a.id),
  }));

  return (
    <Home
      allTimeProjects={allTimeProjects}
      todayProjects={todayProjects}
      hallOfFame={hallOfFame}
      recentActivity={taggedActivity}
      stats={stats}
      throneSince={{ all: throneAllTime?.since, today: throneToday?.since }}
    />
  );
}
