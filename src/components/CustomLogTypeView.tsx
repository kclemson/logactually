import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { CustomLogType } from '@/hooks/useCustomLogTypes';
import type { CustomLogEntry } from '@/hooks/useCustomLogEntries';

interface CustomLogTypeViewProps {
  logType: CustomLogType;
  entries: CustomLogEntry[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  isReadOnly: boolean;
}

function formatEntryDate(entry: CustomLogEntry, valueType: string): string {
  const usesTime = valueType === 'text' || valueType === 'text_multiline';

  if (usesTime) {
    // Use created_at with time of day
    const dt = parseISO(entry.created_at);
    const timeStr = format(dt, 'h:mm a');
    if (isToday(dt)) return `Today, ${timeStr}`;
    if (isYesterday(dt)) return `Yesterday, ${timeStr}`;
    return format(dt, 'MMM d, h:mm a');
  } else {
    // Use logged_date as plain date
    const dt = parseISO(entry.logged_date);
    if (isToday(dt)) return 'Today';
    if (isYesterday(dt)) return 'Yesterday';
    return format(dt, 'MMM d');
  }
}

function formatEntryValue(entry: CustomLogEntry, valueType: string, unit: string | null): string {
  const unitLabel = entry.unit || unit;

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

export function CustomLogTypeView({ logType, entries, isLoading, onDelete, isReadOnly }: CustomLogTypeViewProps) {
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
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0 group"
        >
          <span className="text-xs text-muted-foreground shrink-0 w-36">
            {formatEntryDate(entry, logType.value_type)}
          </span>
          <span className="text-sm flex-1 min-w-0 truncate">
            {formatEntryValue(entry, logType.value_type, logType.unit)}
          </span>
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
      ))}
    </div>
  );
}
