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
import { MacroSummary } from './MacroSummary';
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm Your Food</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">"{rawInput}"</p>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border bg-card p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    className="font-medium border-0 p-0 h-auto text-base focus-visible:ring-0"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  value={item.portion}
                  onChange={(e) => updateItem(index, 'portion', e.target.value)}
                  placeholder="Portion"
                  className="text-sm text-muted-foreground"
                />
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Cal</label>
                    <Input
                      type="number"
                      value={item.calories}
                      onChange={(e) =>
                        updateItem(index, 'calories', Number(e.target.value))
                      }
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Protein</label>
                    <Input
                      type="number"
                      value={item.protein}
                      onChange={(e) =>
                        updateItem(index, 'protein', Number(e.target.value))
                      }
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Carbs</label>
                    <Input
                      type="number"
                      value={item.carbs}
                      onChange={(e) =>
                        updateItem(index, 'carbs', Number(e.target.value))
                      }
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Fat</label>
                    <Input
                      type="number"
                      value={item.fat}
                      onChange={(e) =>
                        updateItem(index, 'fat', Number(e.target.value))
                      }
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <MacroSummary totals={totals} />

          <div className="flex gap-2">
            <Input
              placeholder="Ask AI to fix (e.g. 'this was from Chipotle')"
              value={fixContext}
              onChange={(e) => setFixContext(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFix()}
            />
            <Button
              variant="outline"
              onClick={handleFix}
              disabled={!fixContext.trim() || isReanalyzing}
            >
              {isReanalyzing ? 'Fixing...' : 'Fix'}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={items.length === 0}>
            Confirm & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
