import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { CustomLogType } from '@/hooks/useCustomLogTypes';
import type { CustomLogEntry } from '@/hooks/useCustomLogEntries';

interface CustomLogTypeViewProps {
  logType: CustomLogType;
  entries: CustomLogEntry[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onEdit?: (entry: CustomLogEntry) => void;
  isReadOnly: boolean;
}

function formatEntryDate(entry: CustomLogEntry, valueType: string): string {
  const usesTime = valueType === 'text' || valueType === 'text_multiline';
  const isMedication = valueType === 'medication';

  if (isMedication) {
    // Show logged_date + logged_time if available
    const dt = parseISO(entry.logged_date);
    const dateStr = isToday(dt) ? 'Today' : isYesterday(dt) ? 'Yesterday' : format(dt, 'MMM d');
    if (entry.logged_time) {
      const [h, m] = entry.logged_time.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0);
      const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return `${dateStr}, ${timeStr}`;
    }
    return dateStr;
  }

  if (usesTime) {
    const dt = parseISO(entry.created_at);
    const timeStr = format(dt, 'h:mm a');
    if (isToday(dt)) return `Today, ${timeStr}`;
    if (isYesterday(dt)) return `Yesterday, ${timeStr}`;
    return format(dt, 'MMM d, h:mm a');
  } else {
    const dt = parseISO(entry.logged_date);
    if (isToday(dt)) return 'Today';
    if (isYesterday(dt)) return 'Yesterday';
    return format(dt, 'MMM d');
  }
}

function formatEntryValue(entry: CustomLogEntry, valueType: string, unit: string | null): string {
  const unitLabel = entry.unit || unit;

  if (valueType === 'medication') {
    if (entry.numeric_value == null) return '—';
    return unitLabel ? `${entry.numeric_value} ${unitLabel}` : String(entry.numeric_value);
  }

  if (valueType === 'dual_numeric') {
    const v1 = entry.numeric_value ?? '—';
    const v2 = entry.numeric_value_2 ?? '—';
    const u = unitLabel ? ` ${unitLabel}` : '';
    return `${v1} / ${v2}${u}`;
  }

  if (valueType === 'text_numeric') {
    const label = entry.text_value ?? '';
    const num = entry.numeric_value != null ? entry.numeric_value : null;
    const u = unitLabel && num != null ? ` ${unitLabel}` : '';
    if (label && num != null) return `${label}: ${num}${u}`;
    if (label) return label;
    if (num != null) return `${num}${u}`;
    return '—';
  }

  if (valueType === 'numeric') {
    if (entry.numeric_value == null) return '—';
    return unitLabel ? `${entry.numeric_value} ${unitLabel}` : String(entry.numeric_value);
  }

  // text or text_multiline
  return entry.text_value || '—';
}

export function CustomLogTypeView({ logType, entries, isLoading, onDelete, onEdit, isReadOnly }: CustomLogTypeViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-9 w-full rounded" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No entries yet for {logType.name}. Tap + Log to add your first entry.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {logType.description && (
        <p className="text-xs text-muted-foreground italic mb-3 px-1 leading-relaxed">{logType.description}</p>
      )}
      {entries.map((entry) => {
        const isMedication = logType.value_type === 'medication';
        return (
          <div
            key={entry.id}
            className="border-b border-border/50 last:border-0 group"
          >
            <div className="flex items-center gap-3 py-2">
              <span className="text-xs text-muted-foreground shrink-0 w-32">
                {formatEntryDate(entry, logType.value_type)}
              </span>
              <span className="text-sm tabular-nums truncate flex-1">
                {formatEntryValue(entry, logType.value_type, logType.unit)}
              </span>
              {!isReadOnly && (
                <>
                  {isMedication && onEdit && (
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => onDelete(entry.id)}
                    aria-label="Delete entry"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
            {isMedication && entry.entry_notes && (
              <p className="text-xs text-muted-foreground italic pb-1.5 pl-32 pr-2">{entry.entry_notes}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
