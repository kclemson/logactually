import { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CustomLogEntry } from '@/hooks/useCustomLogEntries';

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
  const hasText = valueType === 'text' || valueType === 'text_numeric';

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
    <div className="flex items-center justify-between py-2 group">
      <span className="text-sm text-muted-foreground">{typeName}</span>
      <div className="flex items-center gap-2">
        {/* Text value (for text and text_numeric) */}
        {hasText && (
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
