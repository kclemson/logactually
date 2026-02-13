import { useState, useRef, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
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

  // Sync from prop when not focused
  const ref = useRef<HTMLTextAreaElement>(null);
  if (ref.current && document.activeElement !== ref.current && value !== text) {
    // Will update on next render via state
  }

  return (
    <textarea
      ref={ref}
      value={text}
      readOnly={isReadOnly}
      onChange={(e) => setText(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        "min-w-[180px] max-w-[240px] min-h-[40px] rounded-md border border-input bg-background px-2 py-1 text-sm resize-y focus:outline-none cursor-text hover:bg-muted/50",
        !isReadOnly && "focus:ring-2 focus:ring-focus-ring focus:bg-focus-bg"
      )}
    />
  );
}

interface CustomLogEntryRowProps {
  entry: CustomLogEntry;
  typeName: string;
  valueType: string;
  typeUnit?: string | null;
  onDelete: (id: string) => void;
  onUpdate: (params: { id: string; numeric_value?: number | null; text_value?: string | null }) => void;
  isReadOnly?: boolean;
}

export function CustomLogEntryRow({ entry, typeName, valueType, typeUnit, onDelete, onUpdate, isReadOnly }: CustomLogEntryRowProps) {
  const unitLabel = entry.unit || typeUnit;

  // Numeric editing state
  const [editingNumeric, setEditingNumeric] = useState(false);
  const [numericValue, setNumericValue] = useState('');
  const numericOriginalRef = useRef<string>('');

  // Text editing state
  const textOriginalRef = useRef<string>('');

  const hasNumeric = valueType === 'numeric' || valueType === 'text_numeric';
  const hasText = valueType === 'text' || valueType === 'text_numeric' || valueType === 'text_multiline';
  const isMultiline = valueType === 'text_multiline';

  // --- Numeric handlers ---
  const handleNumericFocus = () => {
    if (isReadOnly) return;
    const val = entry.numeric_value != null ? String(entry.numeric_value) : '';
    numericOriginalRef.current = val;
    setNumericValue(val);
    setEditingNumeric(true);
  };

  const saveNumeric = () => {
    if (isReadOnly) {
      setEditingNumeric(false);
      return;
    }
    if (numericValue === '' || isNaN(Number(numericValue))) {
      // Revert
      setEditingNumeric(false);
      return;
    }
    if (numericValue !== numericOriginalRef.current) {
      onUpdate({ id: entry.id, numeric_value: Number(numericValue) });
    }
    setEditingNumeric(false);
  };

  const handleNumericKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveNumeric();
      (e.target as HTMLElement).blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingNumeric(false);
      (e.target as HTMLElement).blur();
    }
  };

  // --- Text handlers ---
  const handleTextFocus = (e: React.FocusEvent<HTMLSpanElement>) => {
    if (isReadOnly) {
      (e.target as HTMLElement).blur();
      return;
    }
    textOriginalRef.current = e.currentTarget.textContent || '';
  };

  const handleTextBlur = (e: React.FocusEvent<HTMLSpanElement>) => {
    const newVal = e.currentTarget.textContent?.trim() || '';
    if (isReadOnly || newVal === '' || newVal === textOriginalRef.current) {
      // Revert
      e.currentTarget.textContent = textOriginalRef.current;
      return;
    }
    onUpdate({ id: entry.id, text_value: newVal });
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.currentTarget.textContent = textOriginalRef.current;
      (e.target as HTMLElement).blur();
    }
  };

  return (
    <div className={cn("flex py-2 group", 
      isMultiline ? "items-start gap-3" : (valueType === 'text') ? "items-start justify-between" : "items-center justify-between"
    )}>
      <span className="text-sm text-muted-foreground">{typeName}</span>
      <div className={cn("flex gap-2", isMultiline ? "items-start" : "items-center")}>
        {/* Text value (for text and text_numeric) - single line */}
        {hasText && !isMultiline && (
          <div className={cn(
            "rounded px-1 min-w-[120px]",
            !isReadOnly && "focus-within:ring-2 focus-within:ring-focus-ring focus-within:bg-focus-bg"
          )}>
            <span
              contentEditable={!isReadOnly}
              suppressContentEditableWarning
              spellCheck={false}
              ref={(el) => {
                if (el && el.textContent !== (entry.text_value || '') && document.activeElement !== el) {
                  el.textContent = entry.text_value || '';
                }
              }}
              onFocus={handleTextFocus}
              onBlur={handleTextBlur}
              onKeyDown={handleTextKeyDown}
              className="text-sm border-0 bg-transparent focus:outline-none cursor-text hover:bg-muted/50"
            />
          </div>
        )}
        {/* Multiline text */}
        {isMultiline && (
          <MultilineTextArea
            value={entry.text_value || ''}
            isReadOnly={!!isReadOnly}
            onSave={(val) => onUpdate({ id: entry.id, text_value: val })}
          />
        )}

        {/* Separator for text_numeric */}
        {valueType === 'text_numeric' && <span className="text-sm text-muted-foreground">:</span>}

        {/* Numeric value (for numeric and text_numeric) */}
        {hasNumeric && (
          <Input
            type="number"
            inputMode="decimal"
            value={editingNumeric ? numericValue : (entry.numeric_value ?? '')}
            onFocus={handleNumericFocus}
            onChange={(e) => {
              if (editingNumeric) {
                setNumericValue(e.target.value);
              }
            }}
            onBlur={saveNumeric}
            onKeyDown={handleNumericKeyDown}
            className={cn(
              "h-7 w-[60px] text-sm text-center px-1 border-0 bg-transparent",
              "focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:bg-focus-bg"
            )}
          />
        )}

        {/* Unit label */}
        {hasNumeric && unitLabel && (
          <span className="text-sm text-muted-foreground">{unitLabel}</span>
        )}

        {/* Plain text display for text-only types without numeric */}
        {!hasNumeric && !hasText && (
          <span className="text-sm">{entry.text_value || ''}</span>
        )}

        {!isReadOnly && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete(entry.id)}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}
