import { Navigate } from "react-router-dom";
import { useAdminStats, useAdminUserStats } from "@/hooks/useAdminStats";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { format, parseISO } from "date-fns";

export default function Admin() {
  // All hooks must be called before any conditional returns
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data: stats, isLoading, error } = useAdminStats();
  const { data: userStats } = useAdminUserStats();

  // Allow access if in dev mode OR if user has admin role
  const hasAccess = import.meta.env.DEV || isAdmin;

  // Show loading only if we're checking admin status (not in dev mode)
  if (!import.meta.env.DEV && isAdminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasAccess) {
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
    <div className="px-1 py-2 space-y-2">
      {/* Row 1: Headers with totals */}
      <div className="grid grid-cols-[auto_auto_auto] gap-1 text-muted-foreground text-xs">
        <p className="font-medium">Users: {stats?.total_users ?? 0}</p>
        <p className="font-medium">Entries: {stats?.total_entries ?? 0}</p>
        <p className="font-medium">Saved Meals: {stats?.total_saved_meals ?? 0}</p>
      </div>

      {/* Row 2: Sub-stats in 3 columns */}
      <div className="grid grid-cols-[auto_auto_auto] gap-1 text-muted-foreground text-xs">
        {/* Users column */}
        <div className="space-y-0">
          <p>
            W/entries: {stats?.users_with_entries ?? 0} ({pct(stats?.users_with_entries ?? 0)}%)
          </p>
          <p>
            Active RL7: {stats?.active_last_7_days ?? 0} ({pct(stats?.active_last_7_days ?? 0)}%)
          </p>
          <p>
            Created RL7: {stats?.users_created_last_7_days ?? 0} ({pct(stats?.users_created_last_7_days ?? 0)}%)
          </p>
        </div>

        {/* Entries column */}
        <div className="space-y-0">
          <p>Avg/user: {avgEntriesPerUser}</p>
          <p>Created RL7: {stats?.entries_created_last_7_days ?? 0}</p>
        </div>

        {/* Saved Meals column */}
        <div className="space-y-0">
          <p>Users w/SM: {stats?.users_with_saved_meals ?? 0}</p>
          <p>Avg/user: {stats?.avg_saved_meals_per_user ?? 0}</p>
          <p>Used RL7: {stats?.saved_meals_used_last_7_days ?? 0}</p>
        </div>
      </div>

      {stats?.daily_stats && stats.daily_stats.length > 0 ? (
        <table className="w-auto mt-3 text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left py-0.5 pr-2 font-medium text-muted-foreground">Date</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Entries</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Users</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">With Entries</th>
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

      {userStats && userStats.length > 0 ? (
        <table className="w-auto mt-4 text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left py-0.5 pr-2 font-medium text-muted-foreground">User</th>
              <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Total Entries</th>
              <th className="text-center py-0.5 font-medium text-muted-foreground">Today</th>
            </tr>
          </thead>
          <tbody>
            {userStats.map((user, index) => (
              <tr key={user.user_id} className="border-b border-border/50">
                <td className="py-0.5 pr-2">User {index + 1}</td>
                <td className="text-center py-0.5 pr-2">{user.total_entries}</td>
                <td className="text-center py-0.5">{user.entries_today}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-muted-foreground text-xs">No users found.</p>
      )}
    </div>
  );
}
