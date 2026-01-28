import { useState, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogInput, LogInputRef } from '@/components/LogInput';
import { FoodItemsTable } from '@/components/FoodItemsTable';
import { useAnalyzeFood } from '@/hooks/useAnalyzeFood';
import { useEditableFoodItems } from '@/hooks/useEditableItems';
import { useSaveMeal } from '@/hooks/useSavedMeals';
import { useSuggestMealName } from '@/hooks/useSuggestMealName';
import { FoodItem, SavedMeal, calculateTotals } from '@/types/food';

interface CreateMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMealCreated: (meal: SavedMeal, foodItems: FoodItem[]) => void;
  showLogPrompt?: boolean;
}

type DialogState = 'input' | 'analyzing' | 'editing' | 'saving' | 'prompting';

/**
 * Extract a fallback name from the first food item's description.
 */
function getFallbackName(foodItems: FoodItem[]): string {
  if (foodItems.length === 0) return '';
  const first = foodItems[0].description;
  const withoutPortion = first.replace(/\s*\([^)]*\)\s*$/, '').trim();
  return withoutPortion || first;
}

export function CreateMealDialog({
  open,
  onOpenChange,
  onMealCreated,
  showLogPrompt = true,
}: CreateMealDialogProps) {
  const [state, setState] = useState<DialogState>('input');
  const [name, setName] = useState('');
  const [userHasTyped, setUserHasTyped] = useState(false);
  const [rawInput, setRawInput] = useState<string | null>(null);
  const [createdMeal, setCreatedMeal] = useState<SavedMeal | null>(null);
  
  // Local items state for this dialog (not tied to DB)
  const [localItems, setLocalItems] = useState<FoodItem[]>([]);
  
  const foodInputRef = useRef<LogInputRef>(null);
  
  const { analyzeFood, isAnalyzing, error: analyzeError } = useAnalyzeFood();
  const saveMeal = useSaveMeal();
  const { suggestName, isLoading: isSuggestingName } = useSuggestMealName();
  
  // Use editable items hook for the analyzed food items
  const {
    displayItems,
    updateItem,
    updateItemBatch,
    removeItem,
  } = useEditableFoodItems(localItems);

  // Calculate totals for display
  const totals = calculateTotals(displayItems);

  // Helper to close everything and reset state
  const closeAll = useCallback(() => {
    setState('input');
    setName('');
    setUserHasTyped(false);
    setRawInput(null);
    setCreatedMeal(null);
    setLocalItems([]);
    onOpenChange(false);
  }, [onOpenChange]);

  // Handle food analysis submission
  const handleFoodSubmit = async (text: string) => {
    setState('analyzing');
    setRawInput(text);
    
    const result = await analyzeFood(text);
    
    if (result) {
      // Add items with UIDs to local state
      const itemsWithUids = result.food_items.map(item => ({
        ...item,
        uid: crypto.randomUUID(),
      }));
      setLocalItems(itemsWithUids);
      setState('editing');
      
      // Suggest a name in the background
      if (!userHasTyped) {
        const descriptions = itemsWithUids.map(item => item.description);
        const suggested = await suggestName(descriptions);
        if (suggested && !userHasTyped) {
          setName(suggested);
        } else if (!suggested && !userHasTyped) {
          setName(getFallbackName(itemsWithUids));
        }
      }
    } else {
      setState('input');
    }
  };

  // Handle name input changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setUserHasTyped(true);
  };

  // Handle saving the meal
  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || displayItems.length === 0) return;
    
    setState('saving');
    
    saveMeal.mutate(
      {
        name: trimmedName,
        originalInput: rawInput,
        foodItems: displayItems,
      },
      {
        onSuccess: (savedData) => {
          // Convert the raw DB response to a SavedMeal type
          const meal: SavedMeal = {
            ...savedData,
            food_items: displayItems, // Use local items which are properly typed
          };
          setCreatedMeal(meal);
          if (showLogPrompt) {
            setState('prompting');
          } else {
            // No prompt - just close
            onMealCreated(meal, displayItems);
            onOpenChange(false);
          }
        },
        onError: () => {
          setState('editing');
        },
      }
    );
  };

  // Handle "Also log to today" prompt responses
  const handleLogYes = () => {
    if (createdMeal) {
      onMealCreated(createdMeal, displayItems);
    }
    closeAll();
  };

  const handleLogNo = () => {
    closeAll();
  };

  // Handle item updates (no auto-save to DB, just local state)
  const handleItemUpdate = useCallback((index: number, field: keyof FoodItem, value: string | number) => {
    updateItem(index, field, value);
  }, [updateItem]);

  const handleItemUpdateBatch = useCallback((index: number, updates: Partial<FoodItem>) => {
    updateItemBatch(index, updates);
  }, [updateItemBatch]);

  const handleItemRemove = useCallback((index: number) => {
    removeItem(index);
  }, [removeItem]);

  const isGeneratingName = isSuggestingName && !userHasTyped;
  const isEditing = state === 'editing' || state === 'saving';
  const canSave = name.trim() && displayItems.length > 0 && state === 'editing';

  return (
    <>
      <Dialog open={open && state !== 'prompting'} onOpenChange={onOpenChange}>
        <DialogContent className="left-4 right-4 translate-x-0 w-auto max-w-[calc(100vw-32px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Saved Meal</DialogTitle>
            <DialogDescription>
              Describe a meal to save for quick logging later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Meal name input */}
            <div className="space-y-2">
              <Label htmlFor="meal-name">Meal name</Label>
              <div className="relative">
                {isGeneratingName && (
                  <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                <Input
                  id="meal-name"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="e.g., Morning smoothie"
                  disabled={state === 'saving' || isGeneratingName}
                  className={isGeneratingName ? "pl-10" : ""}
                  spellCheck={false}
                />
                {isGeneratingName && (
                  <div className="absolute left-10 top-0 bottom-0 flex items-center pointer-events-none text-muted-foreground italic text-sm">
                    <span>Generating name...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Food input - only show when in input or analyzing state */}
            {(state === 'input' || state === 'analyzing') && (
              <div className="space-y-2">
                <Label>Ingredients</Label>
                <LogInput
                  mode="food"
                  ref={foodInputRef}
                  onSubmit={handleFoodSubmit}
                  isLoading={isAnalyzing}
                  placeholder="Describe your meal or list its ingredients"
                />
                {analyzeError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    Analysis failed: {analyzeError}
                  </div>
                )}
              </div>
            )}

            {/* Food items table - show after analysis */}
            {(state === 'editing' || state === 'saving') && displayItems.length > 0 && (
              <div className="space-y-2">
                <Label>Items</Label>
                <FoodItemsTable
                  items={displayItems}
                  editable={state !== 'saving'}
                  onUpdateItem={handleItemUpdate}
                  onUpdateItemBatch={handleItemUpdateBatch}
                  onRemoveItem={handleItemRemove}
                  totals={totals}
                  totalsPosition="top"
                  showTotals={true}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={state === 'saving'}>
              Cancel
            </Button>
            {isEditing && (
              <Button onClick={handleSave} disabled={!canSave}>
                {state === 'saving' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Saving...
                  </>
                ) : (
                  'Save Meal'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* "Also add to today's log?" prompt */}
      <AlertDialog 
        open={open && state === 'prompting'} 
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            closeAll();
          }
        }}
      >
        <AlertDialogContent className="left-4 right-4 translate-x-0 w-auto max-w-[calc(100vw-32px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Meal saved!</AlertDialogTitle>
            <AlertDialogDescription>
              "{name}" has been saved. Would you also like to add it to today's log?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleLogNo}>No, just save</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogYes}>Yes, log it too</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
