import { useState, useMemo } from 'react';
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

const INITIAL_VISIBLE_COUNT = 5;

interface OtherWeightEntry {
  entryId: string;
  exerciseSets: WeightSet[];
  rawInput: string | null;
  isFromSavedRoutine: boolean;
}

interface SaveRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawInput: string | null;
  exerciseSets: WeightSet[];
  onSave: (name: string, isAutoNamed: boolean, selectedExercises: WeightSet[]) => void;
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
  const [showAllItems, setShowAllItems] = useState(false);
  
  // Combine all exercises into one flat array (primary entry first, then others)
  // Sort other entries: manual entries first, then saved routine entries
  const allExercises = useMemo(() => {
    const items: WeightSet[] = [...exerciseSets];
    
    const sortedOtherEntries = [...(otherEntries ?? [])].sort((a, b) => {
      if (!a.isFromSavedRoutine && b.isFromSavedRoutine) return -1;
      if (a.isFromSavedRoutine && !b.isFromSavedRoutine) return 1;
      return 0; // Keep relative order within group (already sorted by proximity in parent)
    });
    
    sortedOtherEntries.forEach(entry => items.push(...entry.exerciseSets));
    return items.map((item, i) => ({ ...item, uid: `combined-${i}` }));
  }, [exerciseSets, otherEntries]);
  
  // Pre-select primary entry exercises (indices 0 to exerciseSets.length-1)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(() => 
    new Set(exerciseSets.map((_, i) => i))
  );

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setUserHasTyped(true);
  };

  const handleSelectionChange = (index: number, selected: boolean) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(index);
      } else {
        next.delete(index);
      }
      return next;
    });
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed && selectedIndices.size > 0) {
      // Collect selected exercises, strip the temporary uid
      const selectedExercises = allExercises
        .filter((_, i) => selectedIndices.has(i))
        .map(({ uid, ...rest }) => rest as WeightSet);
      onSave(trimmed, !userHasTyped, selectedExercises);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim() && selectedIndices.size > 0) {
      e.preventDefault();
      handleSave();
    }
  };

  // Compute visible items based on collapse state
  const visibleItems = showAllItems 
    ? allExercises 
    : allExercises.slice(0, INITIAL_VISIBLE_COUNT);
  const hiddenCount = allExercises.length - INITIAL_VISIBLE_COUNT;
  
  // Filter selectedIndices to only include visible items for the table
  const visibleSelectedIndices = useMemo(() => {
    const visible = new Set<number>();
    visibleItems.forEach((_, i) => {
      if (selectedIndices.has(i)) visible.add(i);
    });
    return visible;
  }, [visibleItems, selectedIndices]);

  const hasMultipleItems = allExercises.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-2 right-2 translate-x-0 w-auto max-w-[calc(100vw-16px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle>Save as Routine</DialogTitle>
          <DialogDescription>
            Name this routine to quickly log it again.
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
          
          {/* Single unified table for all exercises */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Exercises ({selectedIndices.size} of {allExercises.length} selected):
            </p>
            <WeightItemsTable
              items={visibleItems}
              editable={false}
              selectable={hasMultipleItems}
              selectedIndices={visibleSelectedIndices}
              onSelectionChange={handleSelectionChange}
              showHeader={true}
              showTotals={false}
              compact={true}
              showInlineLabels={true}
              weightUnit={weightUnit}
            />
            
            {!showAllItems && hiddenCount > 0 && (
              <button 
                type="button"
                onClick={() => setShowAllItems(true)}
                className="text-sm text-primary hover:underline"
                disabled={isSaving}
              >
                Show {hiddenCount} more...
              </button>
            )}
            
            {showAllItems && allExercises.length > INITIAL_VISIBLE_COUNT && (
              <button 
                type="button"
                onClick={() => setShowAllItems(false)}
                className="text-sm text-primary hover:underline"
                disabled={isSaving}
              >
                Show less
              </button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || selectedIndices.size === 0 || isSaving}>
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
