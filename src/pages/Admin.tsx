import { Navigate } from 'react-router-dom';
import { useAdminStats } from '@/hooks/useAdminStats';
import { format, parseISO } from 'date-fns';

export default function Admin() {
  if (!import.meta.env.DEV) {
    return <Navigate to="/" replace />;
  }

  const { data: stats, isLoading, error } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-destructive">
        Error loading stats: {(error as Error).message}
      </div>
    );
  }

  const avgEntriesPerUser = stats && stats.total_users > 0 
    ? (stats.total_entries / stats.total_users).toFixed(1) 
    : '0';

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-body font-semibold text-center">Admin Stats</h1>
      
      <div className="text-muted-foreground space-y-2">
        <div>
          <p>Users: {stats?.total_users ?? 0}</p>
          <p className="ml-6">Active in last 7 days: {stats?.active_last_7_days ?? 0}</p>
          <p className="ml-6">Created in last 7 days: {stats?.users_created_last_7_days ?? 0}</p>
        </div>
        
        <div>
          <p>Entries: {stats?.total_entries ?? 0}</p>
          <p className="ml-6">Average per user: {avgEntriesPerUser}</p>
          <p className="ml-6">Created in last 7 days: {stats?.entries_created_last_7_days ?? 0}</p>
        </div>
      </div>

      {stats?.daily_stats && stats.daily_stats.length > 0 ? (
        <table className="w-auto">
          <thead>
            <tr className="border-b">
              <th className="text-left py-1 pr-4 font-medium text-muted-foreground">Date</th>
              <th className="text-right py-1 pr-4 font-medium text-muted-foreground">Entries</th>
              <th className="text-right py-1 pr-4 font-medium text-muted-foreground">Users</th>
              <th className="text-right py-1 font-medium text-muted-foreground">New</th>
            </tr>
          </thead>
          <tbody>
            {stats.daily_stats.map((row) => (
              <tr key={row.stat_date} className="border-b border-border/50">
                <td className="py-1 pr-4">{format(parseISO(row.stat_date), 'MMM-dd')}</td>
                <td className="text-right py-1 pr-4">{row.entry_count}</td>
                <td className="text-right py-1 pr-4">{row.total_users}</td>
                <td className="text-right py-1">{row.users_created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-muted-foreground">No data in the last 14 days.</p>
      )}
    </div>
  );
}
