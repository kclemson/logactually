import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { CustomLogType } from '@/hooks/useCustomLogTypes';
import type { CustomLogEntry } from '@/hooks/useCustomLogEntries';

interface AllMedicationsViewProps {
  entries: CustomLogEntry[];
  logTypes: CustomLogType[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onEdit?: (entry: CustomLogEntry) => void;
  onExport?: () => void;
  isReadOnly: boolean;
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
  onEdit,
  onExport,
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
      <div className="space-y-4">
        <div className="text-center text-muted-foreground py-8">
          No medications logged for this day.
        </div>
        <p className="text-xs text-muted-foreground text-center">
          For full history across all dates,{' '}
          {onExport ? (
            <button
              onClick={onExport}
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              export your data to CSV
            </button>
          ) : (
            'export your data in Settings → Import/Export.'
          )}
        </p>
      </div>
    );
  }

  // Group entries by medication type
  const groups: { typeId: string; typeName: string; items: CustomLogEntry[] }[] = [];
  const seen = new Map<string, number>();
  for (const entry of entries) {
    const idx = seen.get(entry.log_type_id);
    if (idx !== undefined) {
      groups[idx].items.push(entry);
    } else {
      const logType = logTypes.find((t) => t.id === entry.log_type_id);
      seen.set(entry.log_type_id, groups.length);
      groups.push({ typeId: entry.log_type_id, typeName: logType?.name ?? 'Unknown', items: [entry] });
    }
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const logType = logTypes.find((t) => t.id === group.typeId);
        return (
          <div key={group.typeId} className="space-y-0">
            {/* Med name header */}
            <div className="text-center py-1">
              <span className="text-xs font-medium text-muted-foreground">
                {group.typeName}
              </span>
            </div>

            {/* Entries */}
            {group.items.map((entry) => {
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
                    {/* Time */}
                    <span className="text-xs text-muted-foreground w-16 shrink-0">
                      {formatTime(entry.logged_time)}
                    </span>
                    {/* Dose */}
                    <span className="text-sm tabular-nums text-foreground flex-1">
                      {dose}
                    </span>
                    {/* Edit */}
                    {!isReadOnly && onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => onEdit(entry)}
                        aria-label="Edit entry"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
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
                    <p className="text-xs text-muted-foreground italic pb-1.5 pl-[72px] pr-2">
                      {entry.entry_notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground text-center pt-2">
        For full history across all dates,{' '}
        {onExport ? (
          <button
            onClick={onExport}
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            export your data to CSV
          </button>
        ) : (
          'export your data in Settings → Import/Export.'
        )}
      </p>
    </div>
  );
}
