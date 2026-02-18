import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { estimateCalorieBurn, formatCalorieBurnValue, type CalorieBurnSettings, type CalorieBurnResult } from '@/lib/calorie-burn';
import { WeightSet } from '@/types/weight';

interface CalorieBurnInlineProps {
  exercises: WeightSet[];
  settings: CalorieBurnSettings;
  /** Called with (weight_set row id, calorie value) */
  onSave?: (id: string, calories: number) => void;
}

/**
 * Inline calorie burn display that becomes editable on tap.
 * For single-exercise entries: one input.
 * For multi-exercise entries: one labeled input per exercise.
 */
export function CalorieBurnInline({ exercises, settings, onSave }: CalorieBurnInlineProps) {
  const [editing, setEditing] = useState(false);

  // Compute per-exercise results
  const results = exercises.map(ex => ({
    id: ex.id,
    name: ex.description,
    result: estimateCalorieBurn({
      exercise_key: ex.exercise_key,
      exercise_subtype: ex.exercise_subtype,
      sets: ex.sets,
      reps: ex.reps,
      weight_lbs: ex.weight_lbs,
      duration_minutes: ex.duration_minutes,
      distance_miles: ex.distance_miles,
      exercise_metadata: ex.exercise_metadata,
    }, settings),
  }));

  const nonEmpty = results.filter(r => {
    if (r.result.type === 'exact') return true;
    return r.result.low > 0 || r.result.high > 0;
  });

  if (nonEmpty.length === 0) return null;

  if (!editing) {
    const detail = nonEmpty.length === 1
      ? formatCalorieBurnValue(nonEmpty[0].result)
      : nonEmpty.map(r => `${formatCalorieBurnValue(r.result)} (${r.name})`).join(', ');

    return (
      <button
        type="button"
        onClick={() => onSave && setEditing(true)}
        className="text-xs text-muted-foreground italic text-left hover:text-foreground transition-colors"
      >
        Estimated calories burned: {detail}
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground italic">Calories burned:</p>
      {nonEmpty.map(r => (
        <CalorieBurnInput
          key={r.id}
          id={r.id}
          name={nonEmpty.length > 1 ? r.name : undefined}
          result={r.result}
          onCommit={(id, val) => {
            onSave?.(id, val);
          }}
          onDone={() => setEditing(false)}
          autoFocus={nonEmpty.length === 1}
        />
      ))}
    </div>
  );
}

function CalorieBurnInput({
  id,
  name,
  result,
  onCommit,
  onDone,
  autoFocus,
}: {
  id: string;
  name?: string;
  result: CalorieBurnResult;
  onCommit: (id: string, val: number) => void;
  onDone: () => void;
  autoFocus: boolean;
}) {
  const defaultValue = result.type === 'exact'
    ? result.value
    : Math.round((result.low + result.high) / 2);
  const [value, setValue] = useState(String(defaultValue));
  const inputRef = useRef<HTMLInputElement>(null);
  const committedRef = useRef(false);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const commit = useCallback(() => {
    if (committedRef.current) return;
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      committedRef.current = true;
      onCommit(id, num);
    }
    onDone();
  }, [value, id, onCommit, onDone]);

  return (
    <div className="flex items-center gap-1.5">
      {name && <span className="text-xs text-muted-foreground shrink-0">{name}:</span>}
      <Input
        ref={inputRef}
        type="number"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          if (e.key === 'Escape') { e.preventDefault(); onDone(); }
        }}
        onBlur={commit}
        className="h-7 w-20 px-2 py-0 text-xs"
      />
      <span className="text-xs text-muted-foreground">cal</span>
    </div>
  );
}
