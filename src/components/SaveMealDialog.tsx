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
import { FoodItem, calculateTotals } from '@/types/food';
import { FoodItemsTable } from '@/components/FoodItemsTable';

const INITIAL_VISIBLE_COUNT = 5;

interface OtherFoodEntry {
  entryId: string;
  items: FoodItem[];
  rawInput: string | null;
  isFromSavedMeal: boolean;
}

interface SaveMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawInput: string | null;
  foodItems: FoodItem[];
  onSave: (name: string, selectedItems: FoodItem[]) => void;
  isSaving: boolean;
  otherEntries?: OtherFoodEntry[];
}

/**
 * Extract a fallback name from the first food item's description.
 * Takes the text before any parentheses (portion info).
 */
function getFallbackName(foodItems: FoodItem[]): string {
  if (foodItems.length === 0) return '';
  const first = foodItems[0].description;
  // Remove portion info in parentheses
  const withoutPortion = first.replace(/\s*\([^)]*\)\s*$/, '').trim();
  return withoutPortion || first;
}

export function SaveMealDialog({
  open,
  onOpenChange,
  rawInput,
  foodItems,
  onSave,
  isSaving,
  otherEntries,
}: SaveMealDialogProps) {
  // Initialize with fallback name - state resets on each mount since dialog unmounts when closed
  const [name, setName] = useState(() => getFallbackName(foodItems));
  const [showAllItems, setShowAllItems] = useState(false);
  
  // Combine all items into one flat array (primary entry first, then others)
  // Sort other entries: manual entries first, then saved meal entries
  const allItems = useMemo(() => {
    const items: FoodItem[] = [...foodItems];
    
    const sortedOtherEntries = [...(otherEntries ?? [])].sort((a, b) => {
      if (!a.isFromSavedMeal && b.isFromSavedMeal) return -1;
      if (a.isFromSavedMeal && !b.isFromSavedMeal) return 1;
      return 0; // Keep relative order within group (already sorted by proximity in parent)
    });
    
    sortedOtherEntries.forEach(entry => items.push(...entry.items));
    return items.map((item, i) => ({ ...item, uid: `combined-${i}` }));
  }, [foodItems, otherEntries]);
  
  // Pre-select primary entry items (indices 0 to foodItems.length-1)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(() => 
    new Set(foodItems.map((_, i) => i))
  );

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
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
      // Collect selected items, strip the temporary uid
      const selectedItems = allItems
        .filter((_, i) => selectedIndices.has(i))
        .map(({ uid, ...rest }) => rest as FoodItem);
      onSave(trimmed, selectedItems);
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
    ? allItems 
    : allItems.slice(0, INITIAL_VISIBLE_COUNT);
  const hiddenCount = allItems.length - INITIAL_VISIBLE_COUNT;
  
  // Filter selectedIndices to only include visible items for the table
  const visibleSelectedIndices = useMemo(() => {
    const visible = new Set<number>();
    visibleItems.forEach((_, i) => {
      if (selectedIndices.has(i)) visible.add(i);
    });
    return visible;
  }, [visibleItems, selectedIndices]);

  const hasMultipleItems = allItems.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-2 right-2 top-12 translate-x-0 translate-y-0 w-auto max-w-[calc(100vw-16px)] sm:left-[50%] sm:right-auto sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle>Save as Meal</DialogTitle>
          <DialogDescription>
            Name this meal to quickly log it again.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="meal-name">Meal name</Label>
            <Input
              id="meal-name"
              value={name}
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              placeholder=""
              disabled={isSaving}
              autoFocus
              spellCheck={false}
            />
          </div>
          
          {/* Single unified table for all items */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Items ({selectedIndices.size} of {allItems.length} selected):
            </p>
            <FoodItemsTable
              items={visibleItems}
              editable={false}
              selectable={hasMultipleItems}
              selectedIndices={visibleSelectedIndices}
              onSelectionChange={handleSelectionChange}
              showHeader={true}
              showTotals={true}
              totalsPosition="bottom"
              compact={true}
              showInlineLabels={true}
              showMacroPercentages={false}
              showTotalsDivider={true}
              totals={calculateTotals(allItems.filter((_, i) => selectedIndices.has(i)))}
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
            
            {showAllItems && allItems.length > INITIAL_VISIBLE_COUNT && (
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
              'Save Meal'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
