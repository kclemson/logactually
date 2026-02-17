import { useMemo } from 'react';
import { SavedMeal, FoodItem } from '@/types/food';
import { FoodItemsTable } from '@/components/FoodItemsTable';
import { SavedItemRow } from '@/components/SavedItemRow';

interface SavedMealRowProps {
  meal: SavedMeal;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateMeal: (params: { id: string; name?: string; foodItems?: FoodItem[] }) => void;
  onDeleteMeal: (id: string) => void;
  openDeletePopoverId: string | null;
  setOpenDeletePopoverId: (id: string | null) => void;
}

export function SavedMealRow({
  meal,
  isExpanded,
  onToggleExpand,
  onUpdateMeal,
  onDeleteMeal,
  openDeletePopoverId,
  setOpenDeletePopoverId,
}: SavedMealRowProps) {
  const itemsWithUids = useMemo(() =>
    meal.food_items.map((item, idx) => ({
      ...item,
      uid: `${meal.id}-item-${idx}`,
      entryId: meal.id,
    })),
    [meal.id, meal.food_items]
  );

  const handleUpdateItem = (index: number, field: keyof FoodItem, value: string | number) => {
    const updated = itemsWithUids.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    const cleanedItems = updated.map(({ uid, entryId, editedFields, ...rest }) => rest);
    onUpdateMeal({ id: meal.id, foodItems: cleanedItems as FoodItem[] });
  };

  const handleUpdateItemBatch = (index: number, updates: Partial<FoodItem>) => {
    const updated = itemsWithUids.map((item, i) =>
      i === index ? { ...item, ...updates } : item
    );
    const cleanedItems = updated.map(({ uid, entryId, editedFields, ...rest }) => rest);
    onUpdateMeal({ id: meal.id, foodItems: cleanedItems as FoodItem[] });
  };

  const handleRemoveItem = (index: number) => {
    const updated = itemsWithUids.filter((_, i) => i !== index);
    const cleanedItems = updated.map(({ uid, entryId, editedFields, ...rest }) => rest);
    onUpdateMeal({ id: meal.id, foodItems: cleanedItems as FoodItem[] });
  };

  return (
    <SavedItemRow
      id={meal.id}
      name={meal.name}
      onUpdateName={(newName) => onUpdateMeal({ id: meal.id, name: newName })}
      onDelete={() => onDeleteMeal(meal.id)}
      deleteConfirmLabel="Delete saved meal?"
      deleteConfirmDescription={`"${meal.name}" will be permanently removed.`}
      openDeletePopoverId={openDeletePopoverId}
      setOpenDeletePopoverId={setOpenDeletePopoverId}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      meta={`${meal.food_items.length} ${meal.food_items.length === 1 ? 'item' : 'items'}`}
    >
      {itemsWithUids.length === 0 ? (
        <p className="text-xs text-muted-foreground py-1">No items</p>
      ) : (
        <FoodItemsTable
          items={itemsWithUids}
          editable={true}
          showHeader={false}
          showTotals={false}
          showInlineLabels={true}
          onUpdateItem={handleUpdateItem}
          onUpdateItemBatch={handleUpdateItemBatch}
          onRemoveItem={handleRemoveItem}
        />
      )}
    </SavedItemRow>
  );
}
