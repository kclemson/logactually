import { FoodItem, calculateTotals } from '@/types/food';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FoodItemsTableProps {
  items: FoodItem[];
  editable?: boolean;
  onUpdateItem?: (index: number, field: keyof FoodItem, value: string | number) => void;
  onRemoveItem?: (index: number) => void;
  previousItems?: FoodItem[] | null;
  showHeader?: boolean;
  showTotals?: boolean;
}

export function FoodItemsTable({
  items,
  editable = false,
  onUpdateItem,
  onRemoveItem,
  previousItems,
  showHeader = true,
  showTotals = true,
}: FoodItemsTableProps) {
  const isChanged = (itemName: string, field: keyof FoodItem): boolean => {
    if (!previousItems) return false;
    
    const normalizedName = itemName.toLowerCase().trim();
    const prevItem = previousItems.find(
      p => p.name.toLowerCase().trim() === normalizedName
    );
    
    // New item = highlight everything
    if (!prevItem) return true;
    
    const currentItem = items.find(
      i => i.name.toLowerCase().trim() === normalizedName
    );
    if (!currentItem) return false;
    
    return prevItem[field] !== currentItem[field];
  };

  const totals = calculateTotals(items);

  // Grid columns: with delete button vs without
  const gridCols = editable
    ? 'grid-cols-[1fr_56px_50px_44px_32px_24px]'
    : 'grid-cols-[1fr_56px_50px_44px_32px]';

  return (
    <div className="space-y-1">
      {/* Header row */}
      {showHeader && (
        <div className={cn('grid gap-0.5 text-muted-foreground', gridCols)}>
          <span className="text-size-compact px-2">Item</span>
          <span className="text-size-compact px-1">Calories</span>
          <span className="text-size-compact px-1">Protein</span>
          <span className="text-size-compact px-1">Carbs</span>
          <span className="text-size-compact px-1">Fat</span>
          {editable && <span></span>}
        </div>
      )}

      {/* Data rows */}
      <TooltipProvider>
        {items.map((item, index) => {
          const displayText = `${item.name}${item.portion ? ` (${item.portion})` : ''}`;
          
          return (
            <div
              key={index}
              className={cn('grid gap-0.5 items-start', gridCols)}
            >
              {/* Name cell */}
              <Tooltip>
                <TooltipTrigger asChild>
                  {editable ? (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdateItem?.(index, 'name', e.currentTarget.textContent || '')}
                      className={cn(
                        "text-size-compact px-2 py-1 border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50 focus:outline-none line-clamp-2 cursor-text rounded",
                        isChanged(item.name, 'name') && "bg-amber-100 dark:bg-amber-900/30"
                      )}
                    >
                      {displayText}
                    </div>
                  ) : (
                    <span className="text-size-compact px-2 py-1 line-clamp-2">
                      {displayText}
                    </span>
                  )}
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[300px]">
                  <p>{displayText}</p>
                </TooltipContent>
              </Tooltip>

              {/* Macro cells */}
              {editable ? (
                <>
                  <Input
                    type="number"
                    value={item.calories}
                    onChange={(e) => onUpdateItem?.(index, 'calories', Number(e.target.value))}
                    className={cn(
                      "h-7 !text-size-compact px-1 border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50",
                      isChanged(item.name, 'calories') && "bg-amber-100 dark:bg-amber-900/30"
                    )}
                  />
                  <Input
                    type="number"
                    value={item.protein}
                    onChange={(e) => onUpdateItem?.(index, 'protein', Number(e.target.value))}
                    className={cn(
                      "h-7 !text-size-compact px-1 border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50",
                      isChanged(item.name, 'protein') && "bg-amber-100 dark:bg-amber-900/30"
                    )}
                  />
                  <Input
                    type="number"
                    value={item.carbs}
                    onChange={(e) => onUpdateItem?.(index, 'carbs', Number(e.target.value))}
                    className={cn(
                      "h-7 !text-size-compact px-1 border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50",
                      isChanged(item.name, 'carbs') && "bg-amber-100 dark:bg-amber-900/30"
                    )}
                  />
                  <Input
                    type="number"
                    value={item.fat}
                    onChange={(e) => onUpdateItem?.(index, 'fat', Number(e.target.value))}
                    className={cn(
                      "h-7 !text-size-compact px-1 border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50",
                      isChanged(item.name, 'fat') && "bg-amber-100 dark:bg-amber-900/30"
                    )}
                  />
                </>
              ) : (
                <>
                  <span className="text-size-compact px-1 py-1 text-muted-foreground">{item.calories}</span>
                  <span className="text-size-compact px-1 py-1 text-muted-foreground">{item.protein}</span>
                  <span className="text-size-compact px-1 py-1 text-muted-foreground">{item.carbs}</span>
                  <span className="text-size-compact px-1 py-1 text-muted-foreground">{item.fat}</span>
                </>
              )}

              {/* Delete button (editable only) */}
              {editable && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveItem?.(index)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        })}
      </TooltipProvider>

      {/* Totals row */}
      {showTotals && (
        <div className={cn('grid gap-0.5 items-center pt-1 border-t !text-size-compact font-medium text-muted-foreground', gridCols)}>
          <span className="px-2">Total</span>
          <span className="px-1">{Math.round(totals.calories)}</span>
          <span className="px-1">{Math.round(totals.protein)}</span>
          <span className="px-1">{Math.round(totals.carbs)}</span>
          <span className="px-1">{Math.round(totals.fat)}</span>
          {editable && <span></span>}
        </div>
      )}
    </div>
  );
}
