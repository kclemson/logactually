import { useState } from 'react';
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
import { type WeightUnit, formatDurationMmSs } from '@/lib/weight-units';
import { WeightItemsTable } from '@/components/WeightItemsTable';

const INITIAL_VISIBLE_COUNT = 2;

interface OtherWeightEntry {
  entryId: string;
  exerciseSets: WeightSet[];
  rawInput: string | null;
}

interface SaveRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawInput: string | null;
  exerciseSets: WeightSet[];
  onSave: (name: string, isAutoNamed: boolean, additionalEntryIds?: string[]) => void;
  isSaving: boolean;
  otherEntries?: OtherWeightEntry[];
  /** Weight unit preference for display (lbs or kg) */
  weightUnit?: WeightUnit;
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
  otherEntries,
  weightUnit = 'lbs',
}: SaveRoutineDialogProps) {
  // State is fresh on each mount since dialog unmounts when closed
  const [name, setName] = useState(() => getDefaultName(exerciseSets));
  const [userHasTyped, setUserHasTyped] = useState(false);
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setUserHasTyped(true);
  };

  const toggleEntry = (entryId: string) => {
    setSelectedEntryIds(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed) {
      onSave(trimmed, !userHasTyped, Array.from(selectedEntryIds));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      e.preventDefault();
      handleSave();
    }
  };

  // Compute visible entries based on collapse state
  const visibleEntries = showAllEntries
    ? otherEntries
    : otherEntries?.slice(0, INITIAL_VISIBLE_COUNT);
  const hiddenCount = (otherEntries?.length ?? 0) - INITIAL_VISIBLE_COUNT;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-4 right-4 translate-x-0 w-auto max-w-[calc(100vw-32px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Save as Routine</DialogTitle>
          <DialogDescription>
            Give this routine a name to quickly log it again later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
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
          
          {/* Add more from today section */}
          {otherEntries && otherEntries.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium">Add more from today:</p>
              
              {visibleEntries?.map(entry => {
                const isSelected = selectedEntryIds.has(entry.entryId);
                // Create items with temporary uids for the table
                const itemsWithUids = entry.exerciseSets.map((set, i) => ({
                  ...set,
                  uid: `other-${entry.entryId}-${i}`,
                }));
                // When selected, all indices are selected; otherwise none
                const selectedSet = isSelected
                  ? new Set(itemsWithUids.map((_, i) => i))
                  : new Set<number>();

                return (
                  <div key={entry.entryId}>
                    <WeightItemsTable
                      items={itemsWithUids}
                      editable={false}
                      selectable={true}
                      selectedIndices={selectedSet}
                      onSelectionChange={() => toggleEntry(entry.entryId)}
                      showHeader={false}
                      showTotals={false}
                      compact={true}
                      showInlineLabels={true}
                      weightUnit={weightUnit}
                    />
                  </div>
                );
              })}
              
              {!showAllEntries && hiddenCount > 0 && (
                <button 
                  type="button"
                  onClick={() => setShowAllEntries(true)}
                  className="text-sm text-primary hover:underline"
                  disabled={isSaving}
                >
                  Show {hiddenCount} more...
                </button>
              )}
              
              {showAllEntries && otherEntries.length > INITIAL_VISIBLE_COUNT && (
                <button 
                  type="button"
                  onClick={() => setShowAllEntries(false)}
                  className="text-sm text-primary hover:underline"
                  disabled={isSaving}
                >
                  Show less
                </button>
              )}
            </div>
          )}
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
