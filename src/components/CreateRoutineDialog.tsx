import { useCallback, useState } from 'react';
import { CreateSavedDialog, CreateSavedDialogConfig } from './CreateSavedDialog';
import { WeightItemsTable } from './WeightItemsTable';
import { useAnalyzeWeights } from '@/hooks/useAnalyzeWeights';
import { useSaveRoutine } from '@/hooks/useSavedRoutines';
import { useEditableItems } from '@/hooks/useEditableItems';
import { WeightSet, SavedRoutine, SavedExerciseSet, WeightEditableField } from '@/types/weight';

interface CreateRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoutineCreated: (routine: SavedRoutine, exercises: WeightSet[]) => void;
  showLogPrompt?: boolean;
}

const WEIGHTS_CONFIG: CreateSavedDialogConfig<WeightSet, SavedRoutine> = {
  title: "Create Saved Routine",
  description: "Describe a workout to save for quick logging later.",
  inputLabel: "Exercises",
  inputPlaceholder: "Describe your workout or list exercises",
  namePlaceholder: "e.g., Push day",
  saveButton: "Save Routine",
  savedTitle: "Routine saved!",
  logPromptMessage: (name) => `"${name}" has been saved. Would you also like to add it to today's log?`,
  getFallbackName: (items) => {
    if (items.length === 0) return '';
    const first = items[0];
    return `${first.description} (${first.sets}x${first.reps} @ ${first.weight_lbs} lbs)`;
  },
  getDescriptions: (items) => items.map(item => item.description),
};

const WEIGHT_EDITABLE_FIELDS: WeightEditableField[] = ['description', 'sets', 'reps', 'weight_lbs'];

export function CreateRoutineDialog({
  open,
  onOpenChange,
  onRoutineCreated,
  showLogPrompt = true,
}: CreateRoutineDialogProps) {
  // Local items state for this dialog (not tied to DB)
  const [localItems, setLocalItems] = useState<WeightSet[]>([]);
  
  const { analyzeWeights, isAnalyzing, error } = useAnalyzeWeights();
  const saveRoutine = useSaveRoutine();
  
  const editableItemsResult = useEditableItems<WeightSet>(localItems, WEIGHT_EDITABLE_FIELDS);

  // Wrap analyze to return just the items array with UIDs
  const analyze = useCallback(async (text: string): Promise<WeightSet[] | null> => {
    const result = await analyzeWeights(text);
    if (result) {
      const itemsWithUids: WeightSet[] = result.exercises.map(exercise => ({
        id: crypto.randomUUID(),
        uid: crypto.randomUUID(),
        entryId: crypto.randomUUID(),
        exercise_key: exercise.exercise_key,
        description: exercise.description,
        sets: exercise.sets,
        reps: exercise.reps,
        weight_lbs: exercise.weight_lbs,
      }));
      return itemsWithUids;
    }
    return null;
  }, [analyzeWeights]);

  // Wrap save mutation to match expected interface
  const saveResultAdapter = {
    mutate: (
      params: { name: string; originalInput: string | null; items: WeightSet[] },
      options: { onSuccess: (data: SavedRoutine) => void; onError: () => void }
    ) => {
      // Convert WeightSet[] to SavedExerciseSet[] (strip client-side metadata)
      const exerciseSets: SavedExerciseSet[] = params.items.map(item => ({
        exercise_key: item.exercise_key,
        description: item.description,
        sets: item.sets,
        reps: item.reps,
        weight_lbs: item.weight_lbs,
      }));

      saveRoutine.mutate(
        {
          name: params.name,
          originalInput: params.originalInput,
          exerciseSets,
        },
        {
          onSuccess: (savedData) => {
            // Convert the raw DB response to a SavedRoutine type
            const routine: SavedRoutine = {
              ...savedData,
              exercise_sets: exerciseSets,
            };
            options.onSuccess(routine);
          },
          onError: options.onError,
        }
      );
    },
  };

  // Render the weight items table (simplified version without entry boundaries)
  const renderItemsTable = useCallback((props: {
    items: WeightSet[];
    editable: boolean;
    onUpdateItem: (index: number, field: keyof WeightSet, value: string | number) => void;
    onUpdateItemBatch: (index: number, updates: Partial<WeightSet>) => void;
    onRemoveItem: (index: number) => void;
  }) => (
    <WeightItemsTable
      items={props.items}
      editable={props.editable}
      onUpdateItem={props.onUpdateItem}
      onRemoveItem={props.onRemoveItem}
      showHeader={true}
      totalsPosition="top"
    />
  ), []);

  // Handle dialog close - reset local items
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setLocalItems([]);
    }
    onOpenChange(isOpen);
  }, [onOpenChange]);

  // Extend editable items result with setItems
  const editableItemsWithSet = {
    ...editableItemsResult,
    setItems: setLocalItems,
  };

  return (
    <CreateSavedDialog<WeightSet, SavedRoutine>
      mode="weights"
      config={WEIGHTS_CONFIG}
      open={open}
      onOpenChange={handleOpenChange}
      onCreated={onRoutineCreated}
      showLogPrompt={showLogPrompt}
      analyzeResult={{ analyze, isAnalyzing, error }}
      saveResult={saveResultAdapter}
      editableItemsResult={editableItemsWithSet}
      renderItemsTable={renderItemsTable}
    />
  );
}
