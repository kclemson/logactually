import { useState, useRef } from 'react';
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

  // Standard layout: [text] [colon] [number] [unit] [delete]
  return (
    <div className="grid grid-cols-[1fr_auto_60px_50px_24px] items-center gap-x-1 py-0.5 group">
      {/* Col 1: text label */}
      {hasText ? (
        <div className={cn(
          "rounded px-1 min-w-0",
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
            className="text-sm border-0 bg-transparent focus:outline-none cursor-text hover:bg-muted/50 block"
          />
        </div>
      ) : (
        <span />
      )}

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
          value={editingNumeric ? numericValue : (entry.numeric_value ?? '')}
          onFocus={handleNumericFocus}
          onChange={(e) => {
            if (editingNumeric) setNumericValue(e.target.value);
          }}
          onBlur={saveNumeric}
          onKeyDown={handleNumericKeyDown}
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
