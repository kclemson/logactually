import { useMemo, useState } from 'react';
import { ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SavedMeal, FoodItem } from '@/types/food';
import { FoodItemsTable } from '@/components/FoodItemsTable';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
  // Generate temporary UIDs for editing (not persisted)
  const itemsWithUids = useMemo(() => 
    meal.food_items.map((item, idx) => ({
      ...item,
      uid: `${meal.id}-item-${idx}`,
      entryId: meal.id,
    })),
    [meal.id, meal.food_items]
  );

  // Local state to track edits before saving
  const [localItems, setLocalItems] = useState<FoodItem[]>(itemsWithUids);
  
  // Sync local state when meal.food_items changes (after mutation)
  useMemo(() => {
    setLocalItems(itemsWithUids);
  }, [itemsWithUids]);

  const handleUpdateItem = (index: number, field: keyof FoodItem, value: string | number) => {
    const updated = localItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setLocalItems(updated);
    
    // Strip metadata and save
    const cleanedItems = updated.map(({ uid, entryId, editedFields, ...rest }) => rest);
    onUpdateMeal({ id: meal.id, foodItems: cleanedItems as FoodItem[] });
  };

  const handleUpdateItemBatch = (index: number, updates: Partial<FoodItem>) => {
    const updated = localItems.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    );
    setLocalItems(updated);
    
    // Strip metadata and save
    const cleanedItems = updated.map(({ uid, entryId, editedFields, ...rest }) => rest);
    onUpdateMeal({ id: meal.id, foodItems: cleanedItems as FoodItem[] });
  };

  const handleRemoveItem = (index: number) => {
    const updated = localItems.filter((_, i) => i !== index);
    setLocalItems(updated);
    
    // Strip metadata and save
    const cleanedItems = updated.map(({ uid, entryId, editedFields, ...rest }) => rest);
    onUpdateMeal({ id: meal.id, foodItems: cleanedItems as FoodItem[] });
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

        {/* Click-to-edit meal name */}
        <div
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onFocus={(e) => {
            e.currentTarget.dataset.original = meal.name;
          }}
          onBlur={(e) => {
            e.currentTarget.textContent = e.currentTarget.dataset.original || meal.name;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const newName = e.currentTarget.textContent?.trim();
              const original = e.currentTarget.dataset.original;
              if (newName && newName !== original) {
                onUpdateMeal({ id: meal.id, name: newName });
                e.currentTarget.dataset.original = newName;
              }
              e.currentTarget.blur();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              e.currentTarget.textContent = e.currentTarget.dataset.original || meal.name;
              e.currentTarget.blur();
            }
          }}
          className="flex-1 text-sm truncate cursor-text hover:bg-muted/50 focus:bg-focus-bg focus:ring-2 focus:ring-focus-ring focus:outline-none rounded px-1 py-0.5"
        >
          {meal.name}
        </div>

        {/* Item count */}
        <span className="text-xs text-muted-foreground shrink-0">
          {meal.food_items.length} {meal.food_items.length === 1 ? 'item' : 'items'}
        </span>

        {/* Delete button with popover confirmation */}
        <Popover 
          open={openDeletePopoverId === meal.id} 
          onOpenChange={(open) => setOpenDeletePopoverId(open ? meal.id : null)}
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
                <p className="font-medium text-sm">Delete saved meal?</p>
                <p className="text-xs text-muted-foreground">
                  "{meal.name}" will be permanently removed.
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
                    onDeleteMeal(meal.id);
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
            <p className="text-xs text-muted-foreground py-1">No items</p>
          ) : (
            <FoodItemsTable
              items={localItems}
              editable={true}
              showHeader={false}
              showTotals={false}
              onUpdateItem={handleUpdateItem}
              onUpdateItemBatch={handleUpdateItemBatch}
              onRemoveItem={handleRemoveItem}
            />
          )}
        </div>
      )}
    </li>
  );
}
