import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { FoodItemsTable } from '@/components/FoodItemsTable';
import { SimilarEntryMatch } from '@/lib/text-similarity';

interface SimilarEntryPromptProps {
  match: SimilarEntryMatch;
  onUsePastEntry: () => void;
  onDismiss: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SimilarEntryPrompt({
  match,
  onUsePastEntry,
  onDismiss,
  onCancel,
  isLoading,
}: SimilarEntryPromptProps) {
  const matchPercent = Math.round(match.score * 100);
  const entryDate = parseISO(match.entry.eaten_date);
  const formattedDate = format(entryDate, 'EEE, MMM d');
  
  // Generate temporary UIDs for table rendering
  const itemsWithUids = useMemo(() => 
    match.entry.food_items.map((item, idx) => ({
      ...item,
      uid: `similar-entry-preview-${idx}`,
    })),
    [match.entry.food_items]
  );
  
  return (
    <div className="rounded-md border bg-muted/50 p-3 space-y-3">
      <p className="text-sm">
        Looks like your entry from{' '}
        <span className="font-medium">{formattedDate}</span>{' '}
        <span className="text-muted-foreground">({matchPercent}% match):</span>
      </p>
      
      {/* Food items preview */}
      <FoodItemsTable
        items={itemsWithUids}
        editable={false}
        showHeader={false}
        showTotals={true}
        totalsPosition="bottom"
        showInlineLabels={true}
        showMacroPercentages={false}
        compact={true}
        showTotalsDivider={false}
      />
      
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={onUsePastEntry}
          disabled={isLoading}
        >
          Use past entry
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDismiss}
          disabled={isLoading}
        >
          Log as new
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
