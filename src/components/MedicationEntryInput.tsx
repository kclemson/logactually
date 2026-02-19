import { useState } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface MedicationEntryInputProps {
  label: string;
  unit: string | null;
  description?: string | null;
  onSubmit: (params: {
    numeric_value: number | null;
    logged_time: string | null;
    entry_notes: string | null;
  }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function getCurrentTimeValue() {
  return format(new Date(), 'HH:mm');
}

export function MedicationEntryInput({
  label,
  unit,
  description,
  onSubmit,
  onCancel,
  isLoading,
}: MedicationEntryInputProps) {
  const [timeValue, setTimeValue] = useState(getCurrentTimeValue());
  const [doseValue, setDoseValue] = useState('');
  const [notes, setNotes] = useState('');

  const canSubmit = doseValue.trim() !== '' && !isNaN(parseFloat(doseValue));

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      numeric_value: parseFloat(doseValue),
      logged_time: timeValue || null,
      entry_notes: notes.trim() || null,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium flex-1 truncate">{label}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={onCancel}
          aria-label="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      )}

      <div className="flex items-center gap-2">
        {/* Time picker */}
        <input
          type="time"
          value={timeValue}
          onChange={(e) => setTimeValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "h-9 rounded-md border border-input bg-background px-2 py-1 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-ring"
          )}
        />

        {/* Dose amount */}
        <Input
          type="number"
          inputMode="decimal"
          placeholder="Dose"
          value={doseValue}
          onChange={(e) => setDoseValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-9 w-24 text-sm"
          autoFocus
        />

        {/* Unit label */}
        {unit && (
          <span className="text-sm text-muted-foreground shrink-0">{unit}</span>
        )}

        <Button
          size="sm"
          className="h-9 bg-teal-500 hover:bg-teal-600 text-white border-teal-500 ml-auto"
          onClick={handleSubmit}
          disabled={!canSubmit || isLoading}
        >
          Save
        </Button>
      </div>

      {/* Notes */}
      <Textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
        className="min-h-[60px] text-sm resize-y"
      />
    </div>
  );
}
