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
      <div className="p-4 text-size-compact text-destructive">
        Error loading stats: {(error as Error).message}
      </div>
    );
  }

  const avgEntriesPerUser = stats && stats.total_users > 0 
    ? (stats.total_entries / stats.total_users).toFixed(1) 
    : '0';

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-body font-semibold">Admin Stats (Dev Only)</h1>
      
      <div className="text-size-compact text-muted-foreground space-y-0.5">
        <p>Users: {stats?.total_users ?? 0} (active in last 7 days: {stats?.active_last_7_days ?? 0})</p>
        <p>Entries: {stats?.total_entries ?? 0} (avg per user: {avgEntriesPerUser})</p>
      </div>

      <div>
        <h2 className="text-size-compact font-medium mb-1">Entries by Date</h2>
        {stats?.entries_by_date && stats.entries_by_date.length > 0 ? (
          <table className="text-size-caption w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1 font-medium text-muted-foreground">Date</th>
                <th className="text-right py-1 font-medium text-muted-foreground">Entries</th>
              </tr>
            </thead>
            <tbody>
              {stats.entries_by_date.map((row) => (
                <tr key={row.eaten_date} className="border-b border-border/50">
                  <td className="py-1">{format(parseISO(row.eaten_date), 'MMM-dd')}</td>
                  <td className="text-right py-1">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-size-caption text-muted-foreground">No entries in the last 14 days.</p>
        )}
      </div>
    </div>
  );
}
