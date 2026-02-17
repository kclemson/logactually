import { useMemo } from 'react';
import { SavedRoutine, SavedExerciseSet, WeightSet } from '@/types/weight';
import { WeightItemsTable } from '@/components/WeightItemsTable';
import { SavedItemRow } from '@/components/SavedItemRow';

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
  const itemsWithUids = useMemo((): WeightSet[] =>
    routine.exercise_sets.map((set, idx) => ({
      ...set,
      id: `${routine.id}-set-${idx}`,
      uid: `${routine.id}-set-${idx}`,
      entryId: routine.id,
    })),
    [routine.id, routine.exercise_sets]
  );

  const handleUpdateItem = (index: number, field: keyof WeightSet, value: string | number) => {
    const updated = itemsWithUids.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    const cleanedItems: SavedExerciseSet[] = updated.map(({ id, uid, entryId, editedFields, rawInput, ...rest }) => rest);
    onUpdateRoutine({ id: routine.id, exerciseSets: cleanedItems });
  };

  const handleRemoveItem = (index: number) => {
    const updated = itemsWithUids.filter((_, i) => i !== index);
    const cleanedItems: SavedExerciseSet[] = updated.map(({ id, uid, entryId, editedFields, rawInput, ...rest }) => rest);
    onUpdateRoutine({ id: routine.id, exerciseSets: cleanedItems });
  };

  return (
    <SavedItemRow
      id={routine.id}
      name={routine.name}
      onUpdateName={(newName) => onUpdateRoutine({ id: routine.id, name: newName })}
      onDelete={() => onDeleteRoutine(routine.id)}
      deleteConfirmLabel="Delete saved routine?"
      deleteConfirmDescription={`"${routine.name}" will be permanently removed.`}
      openDeletePopoverId={openDeletePopoverId}
      setOpenDeletePopoverId={setOpenDeletePopoverId}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      meta={`${routine.exercise_sets.length} ${routine.exercise_sets.length === 1 ? 'exercise' : 'exercises'}`}
    >
      {itemsWithUids.length === 0 ? (
        <p className="text-xs text-muted-foreground py-1">No exercises</p>
      ) : (
        <WeightItemsTable
          items={itemsWithUids}
          editable={true}
          showHeader={false}
          showTotals={false}
          showInlineLabels={true}
          onUpdateItem={handleUpdateItem}
          onRemoveItem={handleRemoveItem}
        />
      )}
    </SavedItemRow>
  );
}
