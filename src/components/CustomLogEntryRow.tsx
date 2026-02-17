import { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { DescriptionCell } from '@/components/DescriptionCell';
import { useInlineEdit } from '@/hooks/useInlineEdit';
import { useReadOnlyContext } from '@/contexts/ReadOnlyContext';
import type { CustomLogEntry } from '@/hooks/useCustomLogEntries';

function MultilineTextArea({ value, isReadOnly, onSave }: { value: string; isReadOnly: boolean; onSave: (val: string) => void }) {
  const [text, setText] = useState(value);
  const originalRef = useRef(value);

  const handleFocus = () => {
    originalRef.current = text;
  };

  const handleBlur = () => {
    const trimmed = text.trim();
    if (isReadOnly || trimmed === originalRef.current) return;
    if (trimmed === '') {
      setText(originalRef.current);
      return;
    }
    onSave(trimmed);
  };

  return (
    <textarea
      value={text}
      readOnly={isReadOnly}
      onChange={(e) => setText(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        "w-full min-w-0 min-h-[60px] rounded-md border border-input bg-background px-2 py-1 text-sm resize-y focus:outline-none cursor-text hover:bg-muted/50",
        !isReadOnly && "focus:ring-2 focus:ring-focus-ring focus:bg-focus-bg"
      )}
    />
  );
}

type NumericField = 'numeric' | 'numeric_2';

interface CustomLogEntryRowProps {
  entry: CustomLogEntry;
  typeName: string;
  valueType: string;
  typeUnit?: string | null;
  onDelete: (id: string) => void;
  onUpdate: (params: { id: string; numeric_value?: number | null; numeric_value_2?: number | null; text_value?: string | null }) => void;
  isReadOnly?: boolean;
}

export function CustomLogEntryRow({ entry, typeName, valueType, typeUnit, onDelete, onUpdate, isReadOnly }: CustomLogEntryRowProps) {
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
    isReadOnly: !!isReadOnly,
    triggerOverlay,
  });

  const isDualNumeric = valueType === 'dual_numeric';
  const hasNumeric = valueType === 'numeric' || valueType === 'text_numeric' || isDualNumeric;
  const hasText = valueType === 'text' || valueType === 'text_numeric' || valueType === 'text_multiline';
  const isMultiline = valueType === 'text_multiline';

  // Dual numeric layout: [value1] / [value2] [unit] [delete]
  if (isDualNumeric) {
    return (
      <div className="grid grid-cols-[60px_auto_60px_50px_24px] items-center gap-x-1 py-0.5 group">
        <Input
          type="number"
          inputMode="decimal"
          value={
            inlineEdit.editingCell?.field === 'numeric'
              ? inlineEdit.editingCell.value
              : (entry.numeric_value ?? '')
          }
          onFocus={() => inlineEdit.startEditing(0, 'numeric', entry.numeric_value ?? 0)}
          onChange={(e) => inlineEdit.updateEditingValue(e.target.value, parseFloat)}
          onBlur={inlineEdit.handleNumericBlur}
          onKeyDown={inlineEdit.handleNumericKeyDown}
          className={cn("h-7 w-full text-sm text-center px-1 border-0 bg-transparent", "focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:bg-focus-bg")}
        />
        <span className="text-sm text-muted-foreground text-center">/</span>
        <Input
          type="number"
          inputMode="decimal"
          value={
            inlineEdit.editingCell?.field === 'numeric_2'
              ? inlineEdit.editingCell.value
              : (entry.numeric_value_2 ?? '')
          }
          onFocus={() => inlineEdit.startEditing(0, 'numeric_2', entry.numeric_value_2 ?? 0)}
          onChange={(e) => inlineEdit.updateEditingValue(e.target.value, parseFloat)}
          onBlur={inlineEdit.handleNumericBlur}
          onKeyDown={inlineEdit.handleNumericKeyDown}
          className={cn("h-7 w-full text-sm text-center px-1 border-0 bg-transparent", "focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:bg-focus-bg")}
        />
        {unitLabel ? (
          <span className="text-xs text-muted-foreground">{unitLabel}</span>
        ) : <span />}
        {!isReadOnly ? (
          <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={() => onDelete(entry.id)} aria-label="Delete entry">
            <Trash2 className="h-3 w-3" />
          </Button>
        ) : <span />}
      </div>
    );
  }

  // Multiline layout: textarea + delete
  if (isMultiline) {
    return (
      <div className="grid grid-cols-[1fr_24px] items-start gap-x-2 py-0.5 group">
        <MultilineTextArea
          value={entry.text_value || ''}
          isReadOnly={!!isReadOnly}
          onSave={(val) => onUpdate({ id: entry.id, text_value: val })}
        />
        {!isReadOnly && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity mt-1"
            onClick={() => onDelete(entry.id)}
            aria-label="Delete entry"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  const isTextOnly = valueType === 'text';

  return (
    <div className={cn(
      "grid items-center gap-x-1 py-0.5 group",
      isTextOnly
        ? "grid-cols-[minmax(0,1fr)_24px] justify-items-center"
        : "grid-cols-[1fr_auto_60px_50px_24px]"
    )}>
      {hasText ? (
        <div className={cn(
          "rounded px-1 min-w-0",
          isTextOnly && "w-[280px] max-w-full",
          !isReadOnly && "focus-within:ring-2 focus-within:ring-focus-ring focus-within:bg-focus-bg"
        )}>
          <DescriptionCell
            value={entry.text_value || ''}
            onSave={(val) => onUpdate({ id: entry.id, text_value: val })}
            readOnly={isReadOnly}
            className={cn(
              "text-sm block",
              isTextOnly ? "text-left" : "text-right"
            )}
          />
        </div>
      ) : (
        <span />
      )}

      {!isTextOnly && (
        <>
          {/* Col 2: colon separator */}
          {valueType === 'text_numeric' ? (
            <span className="text-sm text-muted-foreground">:</span>
          ) : (
            <span />
          )}

          {/* Col 3: numeric input */}
          {hasNumeric ? (
            <Input
              type="number"
              inputMode="decimal"
              value={
                inlineEdit.editingCell?.field === 'numeric'
                  ? inlineEdit.editingCell.value
                  : (entry.numeric_value ?? '')
              }
              onFocus={() => inlineEdit.startEditing(0, 'numeric', entry.numeric_value ?? 0)}
              onChange={(e) => inlineEdit.updateEditingValue(e.target.value, parseFloat)}
              onBlur={inlineEdit.handleNumericBlur}
              onKeyDown={inlineEdit.handleNumericKeyDown}
              className={cn(
                "h-7 w-full text-sm text-center px-1 border-0 bg-transparent",
                "focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:bg-focus-bg"
              )}
            />
          ) : (
            <span />
          )}

          {/* Col 4: unit label */}
          {hasNumeric && unitLabel ? (
            <span className="text-xs text-muted-foreground">{unitLabel}</span>
          ) : (
            <span />
          )}
        </>
      )}

      {/* Col 5: delete button */}
      {!isReadOnly ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          onClick={() => onDelete(entry.id)}
          aria-label="Delete entry"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      ) : (
        <span />
      )}
    </div>
  );
}
