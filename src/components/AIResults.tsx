import { useState } from 'react';
import { FoodItem } from '@/types/food';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FoodItemsTable } from './FoodItemsTable';

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
          <p className="text-body italic text-foreground">{rawInput}</p>

          <FoodItemsTable
            items={items}
            editable
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            previousItems={previousItems}
            showHeader={true}
            showTotals={true}
          />

          <div className="flex gap-2">
            <Input
              placeholder="Ask AI to fix"
              value={fixContext}
              onChange={(e) => setFixContext(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFix()}
              className="text-body"
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
