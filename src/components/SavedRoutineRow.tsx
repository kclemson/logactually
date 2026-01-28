import { useMemo, useState } from 'react';
import { ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SavedRoutine, SavedExerciseSet, WeightSet } from '@/types/weight';
import { WeightItemsTable } from '@/components/WeightItemsTable';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SavedRoutineRowProps {
  routine: SavedRoutine;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateRoutine: (params: { id: string; name?: string; exerciseSets?: SavedExerciseSet[] }) => void;
  onDeleteRoutine: (id: string) => void;
  openDeletePopoverId: string | null;
  setOpenDeletePopoverId: (id: string | null) => void;
}

export function SavedRoutineRow({
  routine,
  isExpanded,
  onToggleExpand,
  onUpdateRoutine,
  onDeleteRoutine,
  openDeletePopoverId,
  setOpenDeletePopoverId,
}: SavedRoutineRowProps) {
  // Generate temporary UIDs for editing (not persisted)
  // WeightItemsTable expects WeightSet with id, uid, entryId
  const itemsWithUids = useMemo((): WeightSet[] => 
    routine.exercise_sets.map((set, idx) => ({
      ...set,
      id: `${routine.id}-set-${idx}`,
      uid: `${routine.id}-set-${idx}`,
      entryId: routine.id,
    })),
    [routine.id, routine.exercise_sets]
  );

  // Local state to track edits before saving
  const [localItems, setLocalItems] = useState<WeightSet[]>(itemsWithUids);
  
  // Sync local state when routine.exercise_sets changes (after mutation)
  useMemo(() => {
    setLocalItems(itemsWithUids);
  }, [itemsWithUids]);

  const handleUpdateItem = (index: number, field: keyof WeightSet, value: string | number) => {
    const updated = localItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setLocalItems(updated);
    
    // Strip metadata and convert to SavedExerciseSet format
    const cleanedItems: SavedExerciseSet[] = updated.map(({ id, uid, entryId, editedFields, rawInput, ...rest }) => rest);
    onUpdateRoutine({ id: routine.id, exerciseSets: cleanedItems });
  };

  const handleRemoveItem = (index: number) => {
    const updated = localItems.filter((_, i) => i !== index);
    setLocalItems(updated);
    
    // Strip metadata and convert to SavedExerciseSet format
    const cleanedItems: SavedExerciseSet[] = updated.map(({ id, uid, entryId, editedFields, rawInput, ...rest }) => rest);
    onUpdateRoutine({ id: routine.id, exerciseSets: cleanedItems });
  };

  return (
    <li className="py-0.5">
      <div className="flex items-center gap-2">
        {/* Chevron toggle */}
        <button
          onClick={onToggleExpand}
          className="p-0.5 text-muted-foreground hover:text-foreground transition-transform"
        >
          <ChevronRight 
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-90"
            )} 
          />
        </button>

        {/* Click-to-edit routine name */}
        <div
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onFocus={(e) => {
            e.currentTarget.dataset.original = routine.name;
          }}
          onBlur={(e) => {
            e.currentTarget.textContent = e.currentTarget.dataset.original || routine.name;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const newName = e.currentTarget.textContent?.trim();
              const original = e.currentTarget.dataset.original;
              if (newName && newName !== original) {
                onUpdateRoutine({ id: routine.id, name: newName });
                e.currentTarget.dataset.original = newName;
              }
              e.currentTarget.blur();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              e.currentTarget.textContent = e.currentTarget.dataset.original || routine.name;
              e.currentTarget.blur();
            }
          }}
          className="flex-1 text-sm truncate cursor-text hover:bg-muted/50 focus:bg-focus-bg focus:ring-2 focus:ring-focus-ring focus:outline-none rounded px-1 py-0.5"
        >
          {routine.name}
        </div>

        {/* Exercise count */}
        <span className="text-xs text-muted-foreground shrink-0">
          {routine.exercise_sets.length} {routine.exercise_sets.length === 1 ? 'exercise' : 'exercises'}
        </span>

        {/* Delete button with popover confirmation */}
        <Popover 
          open={openDeletePopoverId === routine.id} 
          onOpenChange={(open) => setOpenDeletePopoverId(open ? routine.id : null)}
        >
          <PopoverTrigger asChild>
            <button
              className="p-1.5 hover:bg-muted rounded"
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4" side="top" align="end">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="font-medium text-sm">Delete saved routine?</p>
                <p className="text-xs text-muted-foreground">
                  "{routine.name}" will be permanently removed.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setOpenDeletePopoverId(null)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    onDeleteRoutine(routine.id);
                    setOpenDeletePopoverId(null);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Expanded items table */}
      {isExpanded && (
        <div className="pl-6 mt-1">
          {localItems.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">No exercises</p>
          ) : (
            <WeightItemsTable
              items={localItems}
              editable={true}
              showHeader={false}
              showTotals={false}
              onUpdateItem={handleUpdateItem}
              onRemoveItem={handleRemoveItem}
            />
          )}
        </div>
      )}
    </li>
  );
}
