import { useState } from 'react';
import { format, parseISO, isToday as dateFnsIsToday } from 'date-fns';
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
  todayLoggedTimes?: string[];
  initialDose?: number | null;
  initialTime?: string | null;
  initialNotes?: string | null;
  /** The original dose_time of the entry being edited — used to swap in the live timeValue for display */
  initialTimeInList?: string | null;
  /** yyyy-MM-dd date being logged for — used to show date in title and fix count label */
  loggedDate?: string;
  onSubmit: (params: {
    numeric_value: number | null;
    dose_time: string | null;
    entry_notes: string | null;
  }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function getCurrentTimeValue() {
  return format(new Date(), 'HH:mm');
}

function getDoseCountStyle(todayEntryCount: number, dosesPerDay: number): string {
  if (todayEntryCount === 0) return 'text-muted-foreground';
  if (dosesPerDay === 0) return 'text-amber-500 dark:text-amber-400';
  if (todayEntryCount <= dosesPerDay) return 'text-green-500 dark:text-green-400';
  return 'text-red-500';
}

function formatLoggedTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return format(d, 'h:mm a');
}

export function MedicationEntryInput({
  label,
  unit,
  description,
  defaultDose,
  dosesPerDay = 0,
  doseTimes,
  todayEntryCount = 0,
  todayLoggedTimes,
  initialDose,
  initialTime,
  initialNotes,
  initialTimeInList,
  loggedDate,
  onSubmit,
  onCancel,
  isLoading,
}: MedicationEntryInputProps) {
  const [timeValue, setTimeValue] = useState(initialTime ?? getCurrentTimeValue());
  const [doseValue, setDoseValue] = useState(
    initialDose != null ? String(initialDose) : defaultDose != null ? String(defaultDose) : ''
  );
  const [notes, setNotes] = useState(initialNotes ?? '');

  // Determine if the selected date is today
  const isLoggedToday = loggedDate ? dateFnsIsToday(parseISO(loggedDate)) : true;
  const dateLabel = !isLoggedToday && loggedDate
    ? format(parseISO(loggedDate), 'MMM d')
    : null;

  const canSubmit = doseValue.trim() !== '' && !isNaN(parseFloat(doseValue));

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      numeric_value: parseFloat(doseValue),
      dose_time: timeValue || null,
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

  // Schedule summary: e.g. "200 mg · as needed" or "2x/day · morning, evening"
  const scheduleSummary = (() => {
    const dosePart = defaultDose != null && unit
      ? `${defaultDose} ${unit}`
      : unit || null;

    if (dosesPerDay === 0) {
      return dosePart ? `${dosePart} · as needed` : 'as needed';
    }

    const freq = `${dosesPerDay}x/day`;
    const nonEmpty = doseTimes?.filter(t => t.trim()) ?? [];
    const times = nonEmpty.length > 0 ? ` · ${nonEmpty.join(', ')}` : '';
    return `${freq}${times}`;
  })();

  // Dose count line — date-aware, with logged times inline
  // Swap the stored time of the entry being edited with the live timeValue so it updates dynamically
  const displayTimes = todayLoggedTimes?.map(t =>
    initialTimeInList && t === initialTimeInList ? timeValue : t
  ) ?? [];

  const doseCountLine = (() => {
    const whenLabel = isLoggedToday ? 'today' : `on ${dateLabel}`;
    let line: string | null = null;
    if (dosesPerDay > 0) {
      line = `${todayEntryCount} of ${dosesPerDay} dose${dosesPerDay !== 1 ? 's' : ''} logged ${whenLabel}`;
    } else if (todayEntryCount > 0) {
      line = `${todayEntryCount} dose${todayEntryCount !== 1 ? 's' : ''} logged ${whenLabel}`;
    }
    if (line && displayTimes.length > 0) {
      line += `: ${displayTimes.map(formatLoggedTime).join('  ·  ')}`;
    }
    return line;
  })();

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-3">
      {/* Name (+ date suffix when not today) + cancel */}
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium flex-1 truncate">
          {label}{dateLabel ? ` (${dateLabel})` : ''}
        </span>
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

      {/* Schedule line */}
      {scheduleSummary && (
        <p className="text-xs text-muted-foreground">{scheduleSummary}</p>
      )}

      {/* Description: plain "Notes: …" label, no box */}
      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed">Notes: {description}</p>
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

      {/* Dose count + inline times: single line */}
      {doseCountLine && (
        <p className={cn("text-xs", getDoseCountStyle(todayEntryCount, dosesPerDay))}>
          {doseCountLine}
        </p>
      )}

      {/* Notes entry */}
      <Textarea
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
        spellCheck={false}
        className="min-h-[60px] text-sm resize-y"
      />
    </div>
  );
}
