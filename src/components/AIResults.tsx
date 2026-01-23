import { useState } from 'react';
import { FoodItem, calculateTotals } from '@/types/food';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIResultsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foodItems: FoodItem[];
  rawInput: string;
  onConfirm: (items: FoodItem[]) => void;
  onReanalyze: (additionalContext: string, currentItems: FoodItem[]) => Promise<FoodItem[] | null>;
  isReanalyzing?: boolean;
}

export function AIResults({
  open,
  onOpenChange,
  foodItems: initialItems,
  rawInput,
  onConfirm,
  onReanalyze,
  isReanalyzing,
}: AIResultsProps) {
  const [items, setItems] = useState<FoodItem[]>(initialItems);
  const [previousItems, setPreviousItems] = useState<FoodItem[] | null>(null);
  const [fixContext, setFixContext] = useState('');

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

  const updateItem = (
    index: number,
    field: keyof FoodItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totals = calculateTotals(items);

  const handleConfirm = () => {
    onConfirm(items);
    onOpenChange(false);
  };

  const handleFix = async () => {
    if (fixContext.trim()) {
      const oldItems = [...items];
      const newItems = await onReanalyze(fixContext.trim(), items);
      if (newItems) {
        setPreviousItems(oldItems);
        setItems(newItems);
      }
      setFixContext('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-h-[90vh] overflow-y-auto sm:max-w-md px-4"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Confirm Your Food</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-size-sm italic text-foreground">{rawInput}</p>

          <div className="space-y-1">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_56px_50px_44px_32px_24px] gap-0.5 text-size-caption text-muted-foreground">
              <span className="px-2">Item</span>
              <span className="px-1">Calories</span>
              <span className="px-1">Protein</span>
              <span className="px-1">Carbs</span>
              <span className="px-1">Fat</span>
              <span></span>
            </div>
            
            {/* Data rows */}
            <TooltipProvider>
              {items.map((item, index) => {
                const displayText = `${item.name}${item.portion ? ` (${item.portion})` : ''}`;
                return (
                  <div
                    key={index}
                    className="grid grid-cols-[1fr_56px_50px_44px_32px_24px] gap-0.5 items-start"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateItem(index, 'name', e.currentTarget.textContent || '')}
                          className={cn(
                            "text-size-compact px-2 py-1 border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50 focus:outline-none line-clamp-2 cursor-text rounded",
                            isChanged(item.name, 'name') && "bg-amber-100 dark:bg-amber-900/30"
                          )}
                        >
                          {displayText}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[300px]">
                        <p>{displayText}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Input
                      type="number"
                      value={item.calories}
                      onChange={(e) => updateItem(index, 'calories', Number(e.target.value))}
                      className={cn(
                        "h-7 !text-size-compact px-1 border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50",
                        isChanged(item.name, 'calories') && "bg-amber-100 dark:bg-amber-900/30"
                      )}
                    />
                    <Input
                      type="number"
                      value={item.protein}
                      onChange={(e) => updateItem(index, 'protein', Number(e.target.value))}
                      className={cn(
                        "h-7 !text-size-compact px-1 border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50",
                        isChanged(item.name, 'protein') && "bg-amber-100 dark:bg-amber-900/30"
                      )}
                    />
                    <Input
                      type="number"
                      value={item.carbs}
                      onChange={(e) => updateItem(index, 'carbs', Number(e.target.value))}
                      className={cn(
                        "h-7 !text-size-compact px-1 border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50",
                        isChanged(item.name, 'carbs') && "bg-amber-100 dark:bg-amber-900/30"
                      )}
                    />
                    <Input
                      type="number"
                      value={item.fat}
                      onChange={(e) => updateItem(index, 'fat', Number(e.target.value))}
                      className={cn(
                        "h-7 !text-size-compact px-1 border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50",
                        isChanged(item.name, 'fat') && "bg-amber-100 dark:bg-amber-900/30"
                      )}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </TooltipProvider>

            {/* Totals row - aligned with columns */}
            <div className="grid grid-cols-[1fr_56px_50px_44px_32px_24px] gap-0.5 items-center pt-1 border-t !text-size-compact font-medium text-muted-foreground">
              <span className="px-2">Total</span>
              <span className="px-1">{Math.round(totals.calories)}</span>
              <span className="px-1">{Math.round(totals.protein)}</span>
              <span className="px-1">{Math.round(totals.carbs)}</span>
              <span className="px-1">{Math.round(totals.fat)}</span>
              <span></span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Ask AI to fix (e.g. 'this was from Chipotle')"
              value={fixContext}
              onChange={(e) => setFixContext(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFix()}
              className="text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleFix}
              disabled={!fixContext.trim() || isReanalyzing}
            >
              {isReanalyzing ? 'Fixing...' : 'Fix'}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={items.length === 0}>
            Confirm & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
