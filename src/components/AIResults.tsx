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
import { Trash2 } from 'lucide-react';

interface AIResultsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foodItems: FoodItem[];
  rawInput: string;
  onConfirm: (items: FoodItem[]) => void;
  onReanalyze: (additionalContext: string) => void;
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
  const [fixContext, setFixContext] = useState('');

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

  const handleFix = () => {
    if (fixContext.trim()) {
      onReanalyze(fixContext.trim());
      setFixContext('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-h-[90vh] overflow-y-auto sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Confirm Your Food</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-secondary italic text-muted-foreground">{rawInput}</p>

          <div className="space-y-1">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_48px_40px_40px_40px_28px] gap-1 text-caption text-muted-foreground">
              <span className="px-2">Item</span>
              <span className="px-2">Cal</span>
              <span className="px-2">P</span>
              <span className="px-2">C</span>
              <span className="px-2">F</span>
              <span></span>
            </div>
            
            {/* Data rows */}
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_48px_40px_40px_40px_28px] gap-1 items-center"
              >
                <Input
                  value={`${item.name}${item.portion ? ` (${item.portion})` : ''}`}
                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                  className="h-7 text-compact truncate"
                  title={`${item.name} - ${item.portion}`}
                />
                <Input
                  type="number"
                  value={item.calories}
                  onChange={(e) => updateItem(index, 'calories', Number(e.target.value))}
                  className="h-7 text-compact px-2"
                />
                <Input
                  type="number"
                  value={item.protein}
                  onChange={(e) => updateItem(index, 'protein', Number(e.target.value))}
                  className="h-7 text-compact px-2"
                />
                <Input
                  type="number"
                  value={item.carbs}
                  onChange={(e) => updateItem(index, 'carbs', Number(e.target.value))}
                  className="h-7 text-compact px-2"
                />
                <Input
                  type="number"
                  value={item.fat}
                  onChange={(e) => updateItem(index, 'fat', Number(e.target.value))}
                  className="h-7 text-compact px-2"
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
            ))}

            {/* Totals row - aligned with columns */}
            <div className="grid grid-cols-[1fr_48px_40px_40px_40px_28px] gap-1 items-center pt-1 border-t text-compact font-medium text-muted-foreground">
              <span className="px-2">Total</span>
              <span className="px-2">{Math.round(totals.calories)}</span>
              <span className="px-2">{Math.round(totals.protein)}</span>
              <span className="px-2">{Math.round(totals.carbs)}</span>
              <span className="px-2">{Math.round(totals.fat)}</span>
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
