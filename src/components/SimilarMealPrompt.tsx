import { useMemo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FoodItemsTable } from '@/components/FoodItemsTable';
import { SimilarMealMatch } from '@/lib/text-similarity';

interface SimilarMealPromptProps {
  match: SimilarMealMatch;
  onUseSaved: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

export function SimilarMealPrompt({
  match,
  onUseSaved,
  onDismiss,
  isLoading,
}: SimilarMealPromptProps) {
  const matchPercent = Math.round(match.score * 100);
  
  // Generate temporary UIDs for table rendering
  const itemsWithUids = useMemo(() => 
    match.meal.food_items.map((item, idx) => ({
      ...item,
      uid: `similar-preview-${idx}`,
    })),
    [match.meal.food_items]
  );
  
  return (
    <div className="relative rounded-md border bg-muted/50 p-3 space-y-3">
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="text-sm pr-6">
        Looks like your saved meal:{' '}
        <span className="font-medium">"{match.meal.name}"</span>{' '}
        <span className="text-muted-foreground">({matchPercent}% match)</span>
      </p>
      
      {/* Food items preview */}
      <div className="border rounded-md overflow-hidden bg-background/50">
        <FoodItemsTable
          items={itemsWithUids}
          editable={false}
          showHeader={false}
          showTotals={true}
          totalsPosition="bottom"
          showInlineLabels={true}
          showMacroPercentages={false}
        />
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={onUseSaved}
          disabled={isLoading}
        >
          Use Saved Meal
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDismiss}
          disabled={isLoading}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
