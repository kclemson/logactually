import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ValueType } from '@/hooks/useCustomLogTypes';

interface LogEntryInputProps {
  valueType: ValueType;
  onSubmit: (params: { numeric_value?: number | null; text_value?: string | null }) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  label?: string;
  unit?: string | null;
}

export function LogEntryInput({ valueType, onSubmit, onCancel, isLoading, label, unit }: LogEntryInputProps) {
  const [numericValue, setNumericValue] = useState('');
  const [textValue, setTextValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (valueType === 'numeric') {
      if (!numericValue) return;
      onSubmit({ numeric_value: parseFloat(numericValue) });
    } else if (valueType === 'text_numeric') {
      if (!textValue || !numericValue) return;
      onSubmit({ text_value: textValue, numeric_value: parseFloat(numericValue) });
    } else if (valueType === 'text' || valueType === 'text_multiline') {
      if (!textValue) return;
      onSubmit({ text_value: textValue });
    }

    setNumericValue('');
    setTextValue('');
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex gap-2", valueType === 'text_multiline' ? "items-start" : "items-center")}>
      {label && (
        <span className="text-xs font-medium text-muted-foreground shrink-0">{label}</span>
      )}
  {(valueType === 'text_numeric' || valueType === 'text') && (
        <Input
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder={valueType === 'text_numeric' ? 'Label (e.g. Waist)' : 'Enter text...'}
          className="h-8 text-sm flex-1"
          autoFocus
        />
      )}
      {valueType === 'text_multiline' && (
        <textarea
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder="Enter text..."
          className="w-[280px] min-h-[60px] rounded-md border border-input bg-background px-2 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
          autoFocus
        />
      )}
      {(valueType === 'numeric' || valueType === 'text_numeric') && (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            step="any"
            value={numericValue}
            onChange={(e) => setNumericValue(e.target.value)}
            placeholder="Value"
            className="h-8 text-sm w-20"
            autoFocus={valueType === 'numeric'}
          />
          {unit && (
            <span className="text-xs text-muted-foreground shrink-0">{unit}</span>
          )}
        </div>
      )}
      <Button type="submit" variant="ghost" size="sm" className="h-8 shrink-0 text-sm" disabled={isLoading}>
        Save
      </Button>
      {onCancel && (
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </form>
  );
}
