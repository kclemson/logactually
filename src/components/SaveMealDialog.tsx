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
import { FoodItem } from '@/types/food';
import { FoodItemsTable } from '@/components/FoodItemsTable';

const INITIAL_VISIBLE_COUNT = 2;

interface OtherFoodEntry {
  entryId: string;
  items: FoodItem[];
  rawInput: string | null;
}

interface SaveMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawInput: string | null;
  foodItems: FoodItem[];
  onSave: (name: string, additionalEntryIds?: string[]) => void;
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
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
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
      onSave(trimmed, Array.from(selectedEntryIds));
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
      <DialogContent className="left-4 right-4 translate-x-0 w-auto max-w-[calc(100vw-32px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Save as Meal</DialogTitle>
          <DialogDescription>
            Give this meal a name to quickly log it again later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Items ({foodItems.length}):</p>
            <ul className="list-disc list-inside space-y-0.5">
              {foodItems.slice(0, 5).map((item, i) => (
                <li key={i} className="truncate">{item.description}</li>
              ))}
              {foodItems.length > 5 && (
                <li className="text-muted-foreground/70">+{foodItems.length - 5} more...</li>
              )}
            </ul>
          </div>
          
          {/* Add more from today section */}
          {otherEntries && otherEntries.length > 0 && (
            <div className="space-y-3 pt-2 border-t">
              <p className="text-sm font-medium">Add more from today:</p>
              
              {visibleEntries?.map(entry => {
                const isSelected = selectedEntryIds.has(entry.entryId);
                // Create items with temporary uids for the table
                const itemsWithUids = entry.items.map((item, i) => ({
                  ...item,
                  uid: `other-${entry.entryId}-${i}`,
                }));
                // When selected, all indices are selected; otherwise none
                const selectedSet = isSelected
                  ? new Set(itemsWithUids.map((_, i) => i))
                  : new Set<number>();

                return (
                  <div 
                    key={entry.entryId} 
                    className="rounded border border-border/50 p-1.5"
                  >
                    <FoodItemsTable
                      items={itemsWithUids}
                      editable={false}
                      selectable={true}
                      selectedIndices={selectedSet}
                      onSelectionChange={() => toggleEntry(entry.entryId)}
                      showHeader={false}
                      showTotals={true}
                      totalsPosition="bottom"
                      compact={true}
                      showInlineLabels={true}
                      showMacroPercentages={false}
                      showTotalsDivider={false}
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
              'Save Meal'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
