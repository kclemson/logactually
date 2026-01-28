import { Navigate } from "react-router-dom";
import { useAdminStats, useAdminUserStats } from "@/hooks/useAdminStats";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { format, parseISO } from "date-fns";

const USER_NAMES: Record<number, string> = {
  1: "KC",
  2: "Jared",
  3: "Kristy",
  4: "Elisabetta1",
  5: "Elisabetta2",
  6: "test",
  8: "test2",
  9: "Malcolm",
  10: "Jenny",
};

export default function Admin() {
  // All hooks must be called before any conditional returns
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data: stats, isLoading, error } = useAdminStats();
  const { data: userStats } = useAdminUserStats();

  // Render nothing while checking admin status - no spinner, no flash
  if (isAdminLoading) {
    return null;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-destructive">Error loading stats: {(error as Error).message}</div>;
  }

  const avgEntriesPerUser = stats && stats.total_users > 0 ? (stats.total_entries / stats.total_users).toFixed(1) : "0";

  const pct = (value: number) => (stats && stats.total_users > 0 ? Math.round((value / stats.total_users) * 100) : 0);

  return (
    <div className="px-1 py-2 space-y-4">
      {/* Stats grid: 3 columns, 2 rows */}
      <div className="grid grid-cols-[auto_auto_auto] gap-x-1 gap-y-0.5 text-muted-foreground text-xs">
        {/* Row 1: Headers */}
        <p className="font-medium">Users: {stats?.total_users ?? 0}</p>
        <p className="font-medium">Logged Items: {stats?.total_entries ?? 0}</p>
        <p className="font-medium">Saved Meals: {stats?.total_saved_meals ?? 0}</p>

        {/* Row 2: Sub-stats */}
        <div className="space-y-0">
          <p>
            w/logged items: {stats?.users_with_entries ?? 0} ({pct(stats?.users_with_entries ?? 0)}%)
          </p>
          <p>
            Active RL7: {stats?.active_last_7_days ?? 0} ({pct(stats?.active_last_7_days ?? 0)}%)
          </p>
          <p>
            Created RL7: {stats?.users_created_last_7_days ?? 0} ({pct(stats?.users_created_last_7_days ?? 0)}%)
          </p>
        </div>
        <div className="space-y-0">
          <p>Avg/user: {avgEntriesPerUser}</p>
          <p>Created RL7: {stats?.entries_created_last_7_days ?? 0}</p>
        </div>
        <div className="space-y-0">
          <p>Users w/SM: {stats?.users_with_saved_meals ?? 0}</p>
          <p>Avg SM/user: {stats?.avg_saved_meals_per_user ?? 0}</p>
          <p>SM used RL7: {stats?.saved_meals_used_last_7_days ?? 0}</p>
        </div>
      </div>

      {/* User stats table */}
      {userStats && userStats.length > 0 ? (
        <table className="w-auto text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left py-0.5 pr-2 font-medium text-muted-foreground">User</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Total Logged Items</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Items Logged Today</th>
              <th className="text-center py-0.5 font-medium text-muted-foreground">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {userStats.map((user) => (
              <tr key={user.user_id} className="border-b border-border/50">
                <td className="py-0.5 pr-2">
                  User {user.user_number}
                  {USER_NAMES[user.user_number] && ` (${USER_NAMES[user.user_number]})`}
                </td>
                <td className="text-center py-0.5 pr-2">{user.total_entries}</td>
                <td className="text-center py-0.5 pr-2">{user.entries_today}</td>
                <td className="text-center py-0.5">
                  {user.last_active ? format(parseISO(user.last_active), "MMM d") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-muted-foreground text-xs">No users found.</p>
      )}

      {/* Daily stats table */}
      {stats?.daily_stats && stats.daily_stats.length > 0 ? (
        <table className="w-auto text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left py-0.5 pr-2 font-medium text-muted-foreground">Date</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Logged Items</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Users</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Users w/Logged Items</th>
              <th className="text-center py-0.5 font-medium text-muted-foreground">New Users</th>
            </tr>
          </thead>
          <tbody>
            {stats.daily_stats.slice(0, 3).map((row) => (
              <tr key={row.stat_date} className="border-b border-border/50">
                <td className="py-0.5 pr-2">{format(parseISO(row.stat_date), "MMM-dd")}</td>
                <td className="text-center py-0.5 pr-2">{row.entry_count}</td>
                <td className="text-center py-0.5 pr-2">{row.total_users}</td>
                <td className="text-center py-0.5 pr-2">{row.users_with_entries}</td>
                <td className="text-center py-0.5">{row.users_created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-muted-foreground text-xs">No data in the last 14 days.</p>
      )}
    </div>
  );
}
