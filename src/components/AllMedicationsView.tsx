import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { CustomLogType } from '@/hooks/useCustomLogTypes';
import type { CustomLogEntry } from '@/hooks/useCustomLogEntries';

interface AllMedicationsViewProps {
  entries: CustomLogEntry[];
  logTypes: CustomLogType[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  isReadOnly: boolean;
}

function formatDateHeader(dateStr: string): string {
  const dt = parseISO(dateStr);
  if (isToday(dt)) return 'Today';
  if (isYesterday(dt)) return 'Yesterday';
  return format(dt, 'MMM d, yyyy');
}

function formatTime(logged_time: string | null): string {
  if (!logged_time) return '—';
  const [h, m] = logged_time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return format(d, 'h:mm a');
}

export function AllMedicationsView({
  entries,
  logTypes,
  isLoading,
  onDelete,
  isReadOnly,
}: AllMedicationsViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-full rounded" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No medications logged yet.
      </div>
    );
  }

  // Group entries by logged_date
  const groups: { date: string; items: CustomLogEntry[] }[] = [];
  const seen = new Map<string, number>();
  for (const entry of entries) {
    const idx = seen.get(entry.logged_date);
    if (idx !== undefined) {
      groups[idx].items.push(entry);
    } else {
      seen.set(entry.logged_date, groups.length);
      groups.push({ date: entry.logged_date, items: [entry] });
    }
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.date} className="space-y-0">
          {/* Date header */}
          <div className="text-center py-1">
            <span className="text-xs font-medium text-muted-foreground">
              {formatDateHeader(group.date)}
            </span>
          </div>

          {/* Entries */}
          {group.items.map((entry) => {
            const logType = logTypes.find((t) => t.id === entry.log_type_id);
            const dose =
              entry.numeric_value != null
                ? entry.unit
                  ? `${entry.numeric_value} ${entry.unit}`
                  : logType?.unit
                  ? `${entry.numeric_value} ${logType.unit}`
                  : String(entry.numeric_value)
                : '—';

            return (
              <div
                key={entry.id}
                className="border-b border-border/50 last:border-0 group"
              >
                <div className="flex items-center gap-2 py-2">
                  {/* Medication name */}
                  <span className="text-sm flex-1 truncate">
                    {logType?.name ?? 'Unknown'}
                  </span>
                  {/* Dose */}
                  <span className="text-sm tabular-nums text-foreground w-28 shrink-0">
                    {dose}
                  </span>
                  {/* Time */}
                  <span className="text-xs text-muted-foreground w-16 shrink-0 text-right">
                    {formatTime(entry.logged_time)}
                  </span>
                  {/* Delete */}
                  {!isReadOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={() => onDelete(entry.id)}
                      aria-label="Delete entry"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {entry.entry_notes && (
                  <p className="text-xs text-muted-foreground italic pb-1.5 pl-0 pr-2">
                    {entry.entry_notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
