import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { WeightSet } from '@/types/weight';
import { formatDurationMmSs } from '@/lib/weight-units';

interface SaveRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawInput: string | null;
  exerciseSets: WeightSet[];
  onSave: (name: string, isAutoNamed: boolean) => void;
  isSaving: boolean;
}

/**
 * Format a single exercise for display.
 * Cardio: "Rowing Machine (15 min)"
 * Weights: "Lat Pulldown (3x10 @ 65 lbs)"
 */
function formatExerciseSummary(exercise: WeightSet, includeSpace = true): string {
  const isCardio = exercise.weight_lbs === 0 && 
    ((exercise.duration_minutes ?? 0) > 0 || (exercise.distance_miles ?? 0) > 0);
  if (isCardio) {
    const duration = exercise.duration_minutes ?? 0;
    const distance = exercise.distance_miles ?? 0;
    if (duration > 0 && distance > 0) {
      return `${exercise.description} (${formatDurationMmSs(duration)}, ${distance.toFixed(1)} mi)`;
    } else if (distance > 0) {
      return `${exercise.description} (${distance.toFixed(1)} mi)`;
    } else {
      return `${exercise.description} (${formatDurationMmSs(duration)})`;
    }
  }
  const separator = includeSpace ? ' @ ' : ' @ ';
  return `${exercise.description} (${exercise.sets}x${exercise.reps}${separator}${exercise.weight_lbs} lbs)`;
}

/**
 * Generate a default name from the first exercise
 */
function getDefaultName(exerciseSets: WeightSet[]): string {
  if (exerciseSets.length === 0) return '';
  return formatExerciseSummary(exerciseSets[0]);
}

export function SaveRoutineDialog({
  open,
  onOpenChange,
  rawInput,
  exerciseSets,
  onSave,
  isSaving,
}: SaveRoutineDialogProps) {
  // State is fresh on each mount since dialog unmounts when closed
  const [name, setName] = useState(() => getDefaultName(exerciseSets));
  const [userHasTyped, setUserHasTyped] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setUserHasTyped(true);
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed) {
      onSave(trimmed, !userHasTyped);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-4 right-4 translate-x-0 w-auto max-w-[calc(100vw-32px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Routine</DialogTitle>
          <DialogDescription>
            Give this routine a name to quickly log it again later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="routine-name">Routine name</Label>
            <Input
              id="routine-name"
              value={name}
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              placeholder=""
              disabled={isSaving}
              autoFocus
              spellCheck={false}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Exercises ({exerciseSets.length}):</p>
            <ul className="list-disc list-inside space-y-0.5">
              {exerciseSets.slice(0, 5).map((set, i) => (
                <li key={i} className="truncate">
                  {formatExerciseSummary(set, false)}
                </li>
              ))}
              {exerciseSets.length > 5 && (
                <li className="text-muted-foreground/70">+{exerciseSets.length - 5} more...</li>
              )}
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Saving...
              </>
            ) : (
              'Save Routine'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
