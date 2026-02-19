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
  defaultDose?: number | null;
  dosesPerDay?: number;
  doseTimes?: string[] | null;
  todayEntryCount?: number;
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

function getDoseCountStyle(todayEntryCount: number, dosesPerDay: number): string {
  if (dosesPerDay === 0 || todayEntryCount === 0) return 'text-muted-foreground';
  if (todayEntryCount < dosesPerDay) return 'text-amber-500';
  if (todayEntryCount === dosesPerDay) return 'text-green-500 dark:text-green-400';
  return 'text-red-500';
}

export function MedicationEntryInput({
  label,
  unit,
  description,
  defaultDose,
  dosesPerDay = 0,
  doseTimes,
  todayEntryCount = 0,
  onSubmit,
  onCancel,
  isLoading,
}: MedicationEntryInputProps) {
  const [timeValue, setTimeValue] = useState(getCurrentTimeValue());
  const [doseValue, setDoseValue] = useState(defaultDose != null ? String(defaultDose) : '');
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

  // Schedule summary: e.g. "2x/day · morning, evening"
  const scheduleSummary = dosesPerDay === 0
    ? null
    : (() => {
        const freq = `${dosesPerDay}x/day`;
        const times = doseTimes && doseTimes.length > 0 ? ` · ${doseTimes.join(', ')}` : '';
        return `${freq}${times}`;
      })();

  // Dose count line
  const doseCountLine = (() => {
    if (dosesPerDay > 0) {
      return `${todayEntryCount} of ${dosesPerDay} dose${dosesPerDay !== 1 ? 's' : ''} logged today`;
    }
    if (todayEntryCount > 0) {
      return `${todayEntryCount} dose${todayEntryCount !== 1 ? 's' : ''} logged today`;
    }
    return null;
  })();

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-3">
      {/* Name + cancel */}
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

      {/* Schedule line: below name, outside muted box */}
      {scheduleSummary && (
        <p className="text-xs text-muted-foreground">{scheduleSummary}</p>
      )}

      {/* Description: alone in muted box */}
      {description && (
        <div className="rounded-md bg-muted/50 px-2.5 py-2">
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2">
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

      {/* Dose count: below input row, with conditional colour */}
      {doseCountLine && (
        <p className={cn("text-xs", getDoseCountStyle(todayEntryCount, dosesPerDay))}>
          {doseCountLine}
        </p>
      )}

      {/* Notes */}
      <Textarea
        placeholder="Notes"
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
