import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomLogEntryRow } from '@/components/CustomLogEntryRow';
import type { CustomLogType } from '@/hooks/useCustomLogTypes';
import type { CustomLogEntry } from '@/hooks/useCustomLogEntries';

interface CustomLogEntriesViewProps {
  entries: CustomLogEntry[];
  logTypes: CustomLogType[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onEdit?: (entry: CustomLogEntry) => void;
  onUpdate?: (params: { id: string; numeric_value?: number | null; numeric_value_2?: number | null; text_value?: string | null }) => void;
  onExport?: () => void;
  isReadOnly: boolean;
  medicationsOnly?: boolean;
}

function formatTime(dose_time: string | null): string {
  if (!dose_time) return '—';
  const [h, m] = dose_time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return format(d, 'h:mm a');
}

export function CustomLogEntriesView({
  entries,
  logTypes,
  isLoading,
  onDelete,
  onEdit,
  onUpdate,
  onExport,
  isReadOnly,
  medicationsOnly = false,
}: CustomLogEntriesViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-full rounded" />
        ))}
      </div>
    );
  }

  // Build groups, preserving insertion order (order of first appearance in entries)
  const groups: { typeId: string; items: CustomLogEntry[] }[] = [];
  const seen = new Map<string, number>();
  for (const entry of entries) {
    const idx = seen.get(entry.log_type_id);
    if (idx !== undefined) {
      groups[idx].items.push(entry);
    } else {
      seen.set(entry.log_type_id, groups.length);
      groups.push({ typeId: entry.log_type_id, items: [entry] });
    }
  }

  // Filter to medication-only groups when requested
  const visibleGroups = medicationsOnly
    ? groups.filter((g) => {
        const lt = logTypes.find((t) => t.id === g.typeId);
        return lt?.value_type === 'medication';
      })
    : groups;

  if (visibleGroups.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center text-muted-foreground py-8">
          {medicationsOnly
            ? 'No medications logged for this day.'
            : 'No custom log items for this day'}
        </div>
        {onExport && (
          <p className="text-xs text-muted-foreground text-center">
            For full history across all dates,{' '}
            <button
              onClick={onExport}
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              export your data to CSV
            </button>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {visibleGroups.map((group) => {
        const logType = logTypes.find((t) => t.id === group.typeId);
        const isMedication = logType?.value_type === 'medication';

        return (
          <div key={group.typeId} className="space-y-0">
            {/* Section header */}
            <div className="py-0.5">
              <span className="text-xs font-medium text-muted-foreground">
                {logType?.name ?? 'Unknown'}
              </span>
            </div>

            {isMedication ? (
              /* Medication rows — compact grid with inline truncated notes */
              group.items.map((entry) => {
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
                    <div className="grid grid-cols-[4rem_auto_1fr_auto] items-center gap-x-2 py-1">
                      {/* Time */}
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatTime(entry.dose_time)}
                      </span>
                      {/* Dose */}
                      <span className="text-sm tabular-nums text-foreground whitespace-nowrap">
                        {dose}
                      </span>
                      {/* Notes — inline truncated */}
                      <span className="text-xs text-muted-foreground italic truncate min-w-0">
                        {entry.entry_notes ?? ''}
                      </span>
                      {/* Actions */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {!isReadOnly && onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                            onClick={() => onEdit(entry)}
                            aria-label="Edit entry"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                        {!isReadOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                            onClick={() => onDelete(entry.id)}
                            aria-label="Delete entry"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              /* Non-medication rows — delegate to CustomLogEntryRow */
              group.items.map((entry) => (
                <CustomLogEntryRow
                  key={entry.id}
                  entry={entry}
                  typeName={logType?.name ?? ''}
                  valueType={logType?.value_type ?? 'text'}
                  typeUnit={logType?.unit}
                  onDelete={onDelete}
                  onUpdate={onUpdate ?? (() => {})}
                  isReadOnly={isReadOnly}
                />
              ))
            )}
          </div>
        );
      })}

      {onExport && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          For full history across all dates,{' '}
          <button
            onClick={onExport}
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            export your data to CSV
          </button>
        </p>
      )}
    </div>
  );
}
