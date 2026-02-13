import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ValueType } from '@/hooks/useCustomLogTypes';

interface LogEntryInputProps {
  valueType: ValueType;
  onSubmit: (params: { numeric_value?: number | null; text_value?: string | null; unit?: string | null }) => void;
  isLoading?: boolean;
}

export function LogEntryInput({ valueType, onSubmit, isLoading }: LogEntryInputProps) {
  const [numericValue, setNumericValue] = useState('');
  const [textValue, setTextValue] = useState('');
  const [unit, setUnit] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (valueType === 'numeric') {
      if (!numericValue) return;
      onSubmit({ numeric_value: parseFloat(numericValue), unit: unit || null });
    } else if (valueType === 'text_numeric') {
      if (!textValue || !numericValue) return;
      onSubmit({ text_value: textValue, numeric_value: parseFloat(numericValue), unit: unit || null });
    } else {
      if (!textValue) return;
      onSubmit({ text_value: textValue });
    }

    setNumericValue('');
    setTextValue('');
    setUnit('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      {(valueType === 'text_numeric' || valueType === 'text') && (
        <Input
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder={valueType === 'text_numeric' ? 'Label (e.g. Waist)' : 'Enter text...'}
          className="h-8 text-sm flex-1"
        />
      )}
      {(valueType === 'numeric' || valueType === 'text_numeric') && (
        <Input
          type="number"
          step="any"
          value={numericValue}
          onChange={(e) => setNumericValue(e.target.value)}
          placeholder="Value"
          className="h-8 text-sm w-20"
        />
      )}
      {(valueType === 'numeric' || valueType === 'text_numeric') && (
        <Input
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="unit"
          className="h-8 text-sm w-14"
        />
      )}
      <Button type="submit" size="icon" variant="ghost" className="h-8 w-8 shrink-0" disabled={isLoading}>
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}
