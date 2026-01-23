import { FoodItem, DailyTotals, calculateTotals } from '@/types/food';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EntryBoundary {
  entryId: string;
  startIndex: number;
  endIndex: number;
}

interface FoodItemsTableProps {
  items: FoodItem[];
  editable?: boolean;
  onUpdateItem?: (index: number, field: keyof FoodItem, value: string | number) => void;
  onRemoveItem?: (index: number) => void;
  previousItems?: FoodItem[] | null;
  showHeader?: boolean;
  showTotals?: boolean;
  totalsPosition?: 'top' | 'bottom';
  totals?: DailyTotals;
  entryBoundaries?: EntryBoundary[];
  onDeleteEntry?: (entryId: string) => void;
}

export function FoodItemsTable({
  items,
  editable = false,
  onUpdateItem,
  onRemoveItem,
  previousItems,
  showHeader = true,
  showTotals = true,
  totalsPosition = 'bottom',
  totals: externalTotals,
  entryBoundaries,
  onDeleteEntry,
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

  const calculatedTotals = calculateTotals(items);
  const totals = externalTotals || calculatedTotals;

  // Determine if we're in entry-delete mode (grouped items with entry deletion)
  const hasEntryDeletion = entryBoundaries && onDeleteEntry;

  // Grid columns based on mode
  const getGridCols = (showDelete: boolean) => {
    if (showDelete) {
      return 'grid-cols-[1fr_56px_50px_44px_32px_24px]';
    }
    return 'grid-cols-[1fr_56px_50px_44px_32px]';
  };

  // For entry-deletion mode, check if this index is the last item in its entry
  const isLastItemInEntry = (index: number): EntryBoundary | null => {
    if (!entryBoundaries) return null;
    const boundary = entryBoundaries.find(b => b.endIndex === index);
    return boundary || null;
  };

  // Check if this is the first item in an entry (for visual grouping)
  const isFirstItemInEntry = (index: number): boolean => {
    if (!entryBoundaries) return false;
    return entryBoundaries.some(b => b.startIndex === index);
  };

  const gridCols = editable 
    ? getGridCols(true) 
    : hasEntryDeletion 
      ? getGridCols(true) 
      : getGridCols(false);

  const TotalsRow = () => (
    <div className={cn(
      'grid gap-0.5 items-center text-body font-semibold',
      totalsPosition === 'top' && 'bg-muted/30 rounded py-1',
      totalsPosition === 'bottom' && 'pt-1 border-t text-muted-foreground',
      gridCols
    )}>
      <span className="px-2">Total</span>
      <span className="px-1">{Math.round(totals.calories)}</span>
      <span className="px-1">{Math.round(totals.protein)}</span>
      <span className="px-1">{Math.round(totals.carbs)}</span>
      <span className="px-1">{Math.round(totals.fat)}</span>
      {(editable || hasEntryDeletion) && <span></span>}
    </div>
  );

  return (
    <div className="space-y-1">
      {/* Header row */}
      {showHeader && (
        <div className={cn('grid gap-0.5 text-muted-foreground', gridCols)}>
          <span className="text-size-compact px-2"></span>
          <span className="text-size-compact px-1">Calories</span>
          <span className="text-size-compact px-1">Protein</span>
          <span className="text-size-compact px-1">Carbs</span>
          <span className="text-size-compact px-1">Fat</span>
          {(editable || hasEntryDeletion) && <span></span>}
        </div>
      )}

      {/* Totals at top */}
      {showTotals && totalsPosition === 'top' && <TotalsRow />}

      {/* Data rows */}
      {items.map((item, index) => {
        const displayText = `${item.name}${item.portion ? ` (${item.portion})` : ''}`;
        const entryBoundary = isLastItemInEntry(index);
        const isFirstInEntry = isFirstItemInEntry(index);
        
        return (
          <div
            key={index}
            className={cn(
              'grid gap-0.5 items-start',
              gridCols,
              // Add top border for entry groups (except first entry)
              hasEntryDeletion && isFirstInEntry && index > 0 && 'border-t border-muted/50 pt-1'
            )}
          >
            {/* Name cell */}
            {editable ? (
              <div
                contentEditable
                suppressContentEditableWarning
                title={displayText}
                onBlur={(e) => onUpdateItem?.(index, 'name', e.currentTarget.textContent || '')}
                className={cn(
                  "text-size-compact px-2 py-1 border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50 focus:outline-none line-clamp-2 cursor-text rounded",
                  isChanged(item.name, 'name') && "bg-amber-100 dark:bg-amber-900/30"
                )}
              >
                {displayText}
              </div>
            ) : (
              <span 
                title={displayText}
                className="text-size-compact px-2 py-1 line-clamp-2"
              >
                {displayText}
              </span>
            )}

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
                  value={Math.round(item.protein)}
                  onChange={(e) => onUpdateItem?.(index, 'protein', Number(e.target.value))}
                  className={cn(
                    "h-7 !text-size-compact px-1 border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50",
                    isChanged(item.name, 'protein') && "bg-amber-100 dark:bg-amber-900/30"
                  )}
                />
                <Input
                  type="number"
                  value={Math.round(item.carbs)}
                  onChange={(e) => onUpdateItem?.(index, 'carbs', Number(e.target.value))}
                  className={cn(
                    "h-7 !text-size-compact px-1 border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50",
                    isChanged(item.name, 'carbs') && "bg-amber-100 dark:bg-amber-900/30"
                  )}
                />
                <Input
                  type="number"
                  value={Math.round(item.fat)}
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
                <span className="text-size-compact px-1 py-1 text-muted-foreground">{Math.round(item.protein)}</span>
                <span className="text-size-compact px-1 py-1 text-muted-foreground">{Math.round(item.carbs)}</span>
                <span className="text-size-compact px-1 py-1 text-muted-foreground">{Math.round(item.fat)}</span>
              </>
            )}

            {/* Delete button */}
            {editable && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveItem?.(index)}
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            
            {/* Entry delete button (only on last item of each entry) */}
            {!editable && hasEntryDeletion && (
              entryBoundary ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove this meal and all its items.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => onDeleteEntry!(entryBoundary.entryId)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <span></span>
              )
            )}
          </div>
        );
      })}

      {/* Totals at bottom */}
      {showTotals && totalsPosition === 'bottom' && <TotalsRow />}
    </div>
  );
}
