import { useCallback, useState } from 'react';
import { CreateSavedDialog, CreateSavedDialogConfig } from './CreateSavedDialog';
import { FoodItemsTable } from './FoodItemsTable';
import { useAnalyzeFood } from '@/hooks/useAnalyzeFood';
import { useSaveMeal } from '@/hooks/useSavedMeals';
import { useSuggestMealName } from '@/hooks/useSuggestMealName';
import { useEditableFoodItems } from '@/hooks/useEditableItems';
import { FoodItem, SavedMeal, calculateTotals } from '@/types/food';

interface CreateMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMealCreated: (meal: SavedMeal, foodItems: FoodItem[]) => void;
  showLogPrompt?: boolean;
}

const FOOD_CONFIG: CreateSavedDialogConfig<FoodItem, SavedMeal> = {
  title: "Create Saved Meal",
  description: "Describe a meal to save for quick logging later.",
  inputLabel: "Ingredients",
  inputPlaceholder: "Describe your meal or list its ingredients",
  namePlaceholder: "e.g., Morning smoothie",
  saveButton: "Save Meal",
  savedTitle: "Meal saved!",
  logPromptMessage: (name) => `"${name}" has been saved. Would you also like to add it to today's log?`,
  getFallbackName: (items) => {
    if (items.length === 0) return '';
    const first = items[0].description;
    const withoutPortion = first.replace(/\s*\([^)]*\)\s*$/, '').trim();
    return withoutPortion || first;
  },
  getDescriptions: (items) => items.map(item => item.description),
};

export function CreateMealDialog({
  open,
  onOpenChange,
  onMealCreated,
  showLogPrompt = true,
}: CreateMealDialogProps) {
  // Local items state for this dialog (not tied to DB)
  const [localItems, setLocalItems] = useState<FoodItem[]>([]);
  
  const { analyzeFood, isAnalyzing, error } = useAnalyzeFood();
  const saveMeal = useSaveMeal();
  const { suggestName, isLoading } = useSuggestMealName();
  
  const editableItemsResult = useEditableFoodItems(localItems);

  // Wrap analyze to return just the items array
  const analyze = useCallback(async (text: string): Promise<FoodItem[] | null> => {
    const result = await analyzeFood(text);
    if (result) {
      const itemsWithUids = result.food_items.map(item => ({
        ...item,
        uid: crypto.randomUUID(),
      }));
      return itemsWithUids;
    }
    return null;
  }, [analyzeFood]);

  // Wrap save mutation to match expected interface
  const saveResultAdapter = {
    mutate: (
      params: { name: string; originalInput: string | null; items: FoodItem[] },
      options: { onSuccess: (data: SavedMeal) => void; onError: () => void }
    ) => {
      saveMeal.mutate(
        {
          name: params.name,
          originalInput: params.originalInput,
          foodItems: params.items,
        },
        {
          onSuccess: (savedData) => {
            // Convert the raw DB response to a SavedMeal type
            const meal: SavedMeal = {
              ...savedData,
              food_items: params.items,
            };
            options.onSuccess(meal);
          },
          onError: options.onError,
        }
      );
    },
  };

  // Calculate totals for display
  const totals = calculateTotals(editableItemsResult.displayItems);

  // Render the food items table with totals
  const renderItemsTable = useCallback((props: {
    items: FoodItem[];
    editable: boolean;
    onUpdateItem: (index: number, field: keyof FoodItem, value: string | number) => void;
    onUpdateItemBatch: (index: number, updates: Partial<FoodItem>) => void;
    onRemoveItem: (index: number) => void;
  }) => (
    <FoodItemsTable
      items={props.items}
      editable={props.editable}
      onUpdateItem={props.onUpdateItem}
      onUpdateItemBatch={props.onUpdateItemBatch}
      onRemoveItem={props.onRemoveItem}
      totals={totals}
      totalsPosition="top"
      showTotals={true}
    />
  ), [totals]);

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
    <CreateSavedDialog<FoodItem, SavedMeal>
      mode="food"
      config={FOOD_CONFIG}
      open={open}
      onOpenChange={handleOpenChange}
      onCreated={onMealCreated}
      showLogPrompt={showLogPrompt}
      analyzeResult={{ analyze, isAnalyzing, error }}
      saveResult={saveResultAdapter}
      suggestNameResult={{ suggestName, isLoading }}
      editableItemsResult={editableItemsWithSet}
      renderItemsTable={renderItemsTable}
    />
  );
}
