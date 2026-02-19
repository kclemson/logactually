import { useRef, useState } from 'react';
import { getMedicationMeta } from '@/lib/medication-meta';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DescriptionCell } from '@/components/DescriptionCell';
import { useInlineEdit } from '@/hooks/useInlineEdit';
import { useReadOnlyContext } from '@/contexts/ReadOnlyContext';
import { cn } from '@/lib/utils';
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

function formatTime(timestamp: string | null): string {
  if (!timestamp) return '—';
  // Handle Postgres time strings like "HH:MM:SS" (no date part)
  if (/^\d{2}:\d{2}/.test(timestamp)) {
    const [h, m] = timestamp.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return format(d, 'h:mm a');
  }
  // Full ISO timestamp
  return format(new Date(timestamp), 'h:mm a');
}

// ──────────────────────────────────────────────
// NonMedEntryRow — extracted so hooks are legal inside .map()
// ──────────────────────────────────────────────
type NumericField = 'numeric' | 'numeric_2';

interface NonMedEntryRowProps {
  entry: CustomLogEntry;
  valueType: string;
  typeUnit?: string | null;
  onDelete: (id: string) => void;
  onUpdate: (params: { id: string; numeric_value?: number | null; numeric_value_2?: number | null; text_value?: string | null }) => void;
  isReadOnly: boolean;
}

function MultilineTextArea({ value, isReadOnly, onSave }: { value: string; isReadOnly: boolean; onSave: (val: string) => void }) {
  const [text, setText] = useState(value);
  const originalRef = useRef(value);

  return (
    <textarea
      value={text}
      readOnly={isReadOnly}
      onChange={(e) => setText(e.target.value)}
      onFocus={() => { originalRef.current = text; }}
      onBlur={() => {
        const trimmed = text.trim();
        if (isReadOnly || trimmed === originalRef.current) return;
        if (trimmed === '') { setText(originalRef.current); return; }
        onSave(trimmed);
      }}
      className={cn(
        "w-full min-w-0 min-h-[60px] rounded-md border border-input bg-background px-2 py-1 text-sm resize-y focus:outline-none cursor-text hover:bg-muted/50",
        !isReadOnly && "focus:ring-2 focus:ring-focus-ring focus:bg-focus-bg"
      )}
    />
  );
}

function NonMedEntryRow({ entry, valueType, typeUnit, onDelete, onUpdate, isReadOnly }: NonMedEntryRowProps) {
  const unitLabel = entry.unit || typeUnit;
  const { triggerOverlay } = useReadOnlyContext();

  const inlineEdit = useInlineEdit<NumericField>({
    onSaveNumeric: (_index, field, value) => {
      if (field === 'numeric') {
        onUpdate({ id: entry.id, numeric_value: value });
      } else {
        onUpdate({ id: entry.id, numeric_value_2: value });
      }
    },
    isReadOnly,
    triggerOverlay,
  });

  const timeStr = formatTime(entry.created_at);
  const isDualNumeric = valueType === 'dual_numeric';
  const hasNumeric = valueType === 'numeric' || valueType === 'text_numeric' || isDualNumeric;
  const hasText = valueType === 'text' || valueType === 'text_numeric';
  const isMultiline = valueType === 'text_multiline';

  // text_multiline: time | textarea (col-span-2) | delete
  if (isMultiline) {
    return (
      <div className="grid grid-cols-[4rem_1fr_auto] items-start gap-x-2 py-1 pl-3 group border-b border-border/50 last:border-0">
        <span className="text-xs text-muted-foreground tabular-nums pt-1">{timeStr}</span>
        <MultilineTextArea
          value={entry.text_value || ''}
          isReadOnly={isReadOnly}
          onSave={(val) => onUpdate({ id: entry.id, text_value: val })}
        />
        {!isReadOnly ? (
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity mt-1"
            onClick={() => onDelete(entry.id)}
            aria-label="Delete entry"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        ) : <span />}
      </div>
    );
  }

  // All other non-med types: time | value | spacer | actions
  return (
    <div className="grid grid-cols-[4rem_auto_1fr_auto] items-center gap-x-2 py-1 pl-3 group border-b border-border/50 last:border-0">
      {/* Col 1: time */}
      <span className="text-xs text-muted-foreground tabular-nums">{timeStr}</span>

      {/* Col 2: value */}
      <div className="flex items-center gap-1">
        {hasText && (
          <div className={cn(
            "rounded px-1 min-w-0",
            !isReadOnly && "focus-within:ring-2 focus-within:ring-focus-ring focus-within:bg-focus-bg"
          )}>
            <DescriptionCell
              value={entry.text_value || ''}
              onSave={(val) => onUpdate({ id: entry.id, text_value: val })}
              readOnly={isReadOnly}
              className="text-sm block"
            />
          </div>
        )}
        {valueType === 'text_numeric' && (
          <span className="text-sm text-muted-foreground">:</span>
        )}
        {isDualNumeric ? (
          <>
            <Input
              type="number" inputMode="decimal"
              value={inlineEdit.editingCell?.field === 'numeric' ? inlineEdit.editingCell.value : (entry.numeric_value ?? '')}
              onFocus={() => inlineEdit.startEditing(0, 'numeric', entry.numeric_value ?? 0)}
              onChange={(e) => inlineEdit.updateEditingValue(e.target.value, parseFloat)}
              onBlur={inlineEdit.handleNumericBlur}
              onKeyDown={inlineEdit.handleNumericKeyDown}
              className="h-7 w-12 text-sm text-center px-1 border-0 bg-transparent focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:bg-focus-bg"
            />
            <span className="text-sm text-muted-foreground">/</span>
            <Input
              type="number" inputMode="decimal"
              value={inlineEdit.editingCell?.field === 'numeric_2' ? inlineEdit.editingCell.value : (entry.numeric_value_2 ?? '')}
              onFocus={() => inlineEdit.startEditing(0, 'numeric_2', entry.numeric_value_2 ?? 0)}
              onChange={(e) => inlineEdit.updateEditingValue(e.target.value, parseFloat)}
              onBlur={inlineEdit.handleNumericBlur}
              onKeyDown={inlineEdit.handleNumericKeyDown}
              className="h-7 w-12 text-sm text-center px-1 border-0 bg-transparent focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:bg-focus-bg"
            />
          </>
        ) : hasNumeric ? (
          <Input
            type="number" inputMode="decimal"
            value={inlineEdit.editingCell?.field === 'numeric' ? inlineEdit.editingCell.value : (entry.numeric_value ?? '')}
            onFocus={() => inlineEdit.startEditing(0, 'numeric', entry.numeric_value ?? 0)}
            onChange={(e) => inlineEdit.updateEditingValue(e.target.value, parseFloat)}
            onBlur={inlineEdit.handleNumericBlur}
            onKeyDown={inlineEdit.handleNumericKeyDown}
            className="h-7 w-14 text-sm text-center px-1 border-0 bg-transparent focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:bg-focus-bg"
          />
        ) : null}
        {hasNumeric && unitLabel && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">{unitLabel}</span>
        )}
      </div>

      {/* Col 3: spacer */}
      <span />

      {/* Col 4: actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        {!isReadOnly && (
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete(entry.id)}
            aria-label="Delete entry"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main view component
// ──────────────────────────────────────────────
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

  // Group entries by log_type_id, preserving insertion order
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
            <div className="py-0.5 flex items-baseline gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {logType?.name ?? 'Unknown'}
              </span>
              {isMedication && logType && (() => {
                const meta = getMedicationMeta(logType);
                return meta ? (
                  <span className="text-xs text-muted-foreground/60">· {meta}</span>
                ) : null;
              })()}
            </div>

            {isMedication ? (
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
                  <div key={entry.id} className="border-b border-border/50 last:border-0 group">
                    <div className="grid grid-cols-[4rem_auto_1fr_auto] items-center gap-x-2 py-1 pl-3">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatTime(entry.dose_time)}
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                        {dose}
                      </span>
                      <span className="text-xs text-muted-foreground italic truncate min-w-0">
                        {entry.entry_notes ?? ''}
                      </span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {!isReadOnly && onEdit && (
                          <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 p-0 text-foreground hover:text-foreground hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                            onClick={() => onEdit(entry)}
                            aria-label="Edit entry"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                        {!isReadOnly && (
                          <Button
                            variant="ghost" size="icon"
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
              group.items.map((entry) => (
                <NonMedEntryRow
                  key={entry.id}
                  entry={entry}
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
